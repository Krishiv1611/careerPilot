from langgraph.graph import StateGraph, END
from agents.resume_extractor_agent import resume_extractor_agent
from agents.skill_mapping_agent import skill_mapping_agent
from agents.job_search_agent import job_search_agent
from agents.serpapi_job_search_agent import serpapi_job_search_agent
from agents.jd_analyzer_agent import jd_analyzer_agent
from agents.fit_score_agent import fit_score_agent
from agents.resume_improver_agent import resume_improver_agent
from agents.cover_letter_agent import cover_letter_agent
from agents.application_saver_agent import application_saver_agent
from agents.ats_score_agent import ats_score_agent
from agents.job_search_router import job_search_router
from agents.state import CareerPilotState

from models.database import SessionLocal
import os


# DB session generator
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def build_careerpilot_graph():
    graph = StateGraph(CareerPilotState)

    # -------------------- Node wrappers --------------------
    # Resume extractor → only uses state
    graph.add_node("resume_extractor", resume_extractor_agent)

    # Skill mapping → only uses state
    graph.add_node("skill_mapping", skill_mapping_agent)
    
    # ATS Score
    graph.add_node("ats_score", ats_score_agent)

    # job_search needs DB
    graph.add_node(
        "job_search",
        job_search_agent
    )

    # serpapi_job_search needs DB
    graph.add_node(
        "serpapi_job_search",
        serpapi_job_search_agent
    )

    # JD analyzer → only state
    graph.add_node("jd_analyzer", jd_analyzer_agent)

    # Fit score (Gemini)
    graph.add_node("fit_score", fit_score_agent)

    # Resume improver
    graph.add_node("resume_improver", resume_improver_agent)

    # Cover letter
    graph.add_node("cover_letter", cover_letter_agent)

    # Application saver needs DB
    graph.add_node(
        "application_saver",
        lambda state: application_saver_agent(state, next(get_db()))
    )
    
    # Join Node (Virtual node to synchronize parallel branches)
    # In LangGraph, we can just point multiple nodes to the next step.
    # But we need logic to decide if we proceed to JD Analyzer or End.
    
    def join_logic(state):
        # This function decides where to go after search/resume processing
        # It acts as a router after the parallel branches merge
        
        recommended_jobs = state.get("recommended_jobs")
        job_id = state.get("job_id")
        
        # If we have a job_id (either from input or selected), we proceed to analysis
        if job_id:
            return "jd_analyzer"
            
        # If we have recommended jobs but no job_id, we stop (user needs to select)
        if recommended_jobs and len(recommended_jobs) > 0:
            return "end_search"
            
        # If no jobs found
        return "end_search"

    # -------------------- Edges --------------------
    
    # PARALLEL START:
    # 1. Resume Processing Branch
    # 2. Job Search Branch
    
    graph.set_entry_point("resume_extractor")
    
    # Branch 1: Resume Processing
    # resume_extractor -> skill_mapping
    # resume_extractor -> ats_score (Parallel sub-branch)
    
    graph.add_edge("resume_extractor", "skill_mapping")
    graph.add_edge("resume_extractor", "ats_score")
    
    # Branch 2: Job Search (Parallel to Resume Processing? No, strictly speaking resume_extractor is entry)
    # To make them truly parallel from start, we'd need a dummy start node.
    # But resume_extractor is fast enough, let's keep it as entry.
    # Actually, the user wants "optimise graph structure".
    # If we want true parallel, we can use a "start" node that does nothing.
    
    # Let's keep resume_extractor as entry for simplicity, but split AFTER it.
    # Or, we can add a "router" at start?
    # Let's just branch AFTER resume_extractor.
    # resume_extractor -> job_search_router
    
    graph.add_conditional_edges(
        "skill_mapping",
        job_search_router,
        {
            "job_search": "job_search",
            "serpapi_job_search": "serpapi_job_search",
            "skip_search": "jd_analyzer"
        }
    )
    
    # Now we have 3 branches running from resume_extractor:
    # 1. skill_mapping
    # 2. ats_score
    # 3. job_search (via router)
    
    # End of branches:
    
    # ATS Score -> END (Just adds data)
    graph.add_edge("ats_score", END)
    
    # Skill Mapping -> END (Just adds data, unless we need it for search? No, search is parallel)
    # But wait, if we go to jd_analyzer later, we need skills.
    # The state is shared.
    # Skill Mapping -> END (Removed because it now flows to job_search_router)
    # graph.add_edge("skill_mapping", END)
    
    # Job Search -> Join Logic
    graph.add_conditional_edges(
        "job_search",
        join_logic,
        {
            "jd_analyzer": "jd_analyzer",
            "end_search": END
        }
    )
    
    graph.add_conditional_edges(
        "serpapi_job_search",
        join_logic,
        {
            "jd_analyzer": "jd_analyzer",
            "end_search": END
        }
    )

    # Analysis Pipeline (Sequential)
    graph.add_edge("jd_analyzer", "fit_score")
    graph.add_edge("fit_score", "resume_improver")
    graph.add_edge("resume_improver", "cover_letter")
    graph.add_edge("cover_letter", "application_saver")

    graph.add_edge("application_saver", END)

    return graph.compile()
