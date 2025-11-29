from langgraph.graph import StateGraph, END
from agents.resume_extractor_agent import resume_extractor_agent
from agents.skill_mapping_agent import skill_mapping_agent
from agents.job_search_agent import job_search_agent
from agents.serpapi_job_search_agent import serpapi_job_search_agent
from agents.tavily_agent import tavily_job_search_agent
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

    # tavily_job_search needs DB
    graph.add_node(
        "tavily_job_search",
        tavily_job_search_agent
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
    
    def join_logic(state):
        # This function decides where to go after search/resume processing
        
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
    
    graph.set_entry_point("resume_extractor")
    
    graph.add_edge("resume_extractor", "skill_mapping")
    graph.add_edge("resume_extractor", "ats_score")
    
    graph.add_conditional_edges(
        "skill_mapping",
        job_search_router,
        {
            "job_search": "job_search",
            "serpapi_job_search": "serpapi_job_search",
            "tavily_job_search": "tavily_job_search",
            "skip_search": "jd_analyzer"
        }
    )
    
    graph.add_edge("ats_score", END)
    
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

    graph.add_conditional_edges(
        "tavily_job_search",
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
