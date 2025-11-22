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

    # -------------------- Edges --------------------
    graph.set_entry_point("resume_extractor")

    graph.add_edge("resume_extractor", "skill_mapping")

    # Conditional edge → route based on search_query and use_serpapi
    def route_after_skill_mapping(state):
        if not state.get("search_query"):
            return "jd_analyzer"
        
        # Check if SerpAPI is requested and API key is available
        if state.get("use_serpapi"):
            serpapi_key = os.getenv("SERPAPI_API_KEY")
            if serpapi_key:
                return "serpapi_job_search"
            # Fallback to regular search if API key is missing
            return "job_search"
        
        return "job_search"

    graph.add_conditional_edges(
        "skill_mapping",
        route_after_skill_mapping,
        {
            "job_search": "job_search",
            "serpapi_job_search": "serpapi_job_search",
            "jd_analyzer": "jd_analyzer",
        }
    )

    # After job search, check if we have a job_id
    # If no job_id but we have recommended_jobs, we can't proceed to jd_analyzer
    def route_after_job_search(state):
        # Debug: Print state info
        recommended_jobs = state.get("recommended_jobs")
        job_id = state.get("job_id")
        
        print(f"[Graph] route_after_job_search - job_id: {job_id}")
        print(f"[Graph] route_after_job_search - recommended_jobs type: {type(recommended_jobs)}")
        print(f"[Graph] route_after_job_search - recommended_jobs value: {recommended_jobs}")
        if recommended_jobs:
            print(f"[Graph] route_after_job_search - recommended_jobs length: {len(recommended_jobs)}")
        
        # If we have a job_id, proceed to jd_analyzer
        if job_id:
            print(f"[Graph] Routing to jd_analyzer (has job_id)")
            return "jd_analyzer"
        
        # If we have recommended_jobs but no job_id, we need to stop
        # (user should select a job first)
        # Check if recommended_jobs exists and is not empty
        if recommended_jobs and len(recommended_jobs) > 0:
            print(f"[Graph] Routing to end_search (has {len(recommended_jobs)} jobs, no job_id)")
            return "end_search"  # End here, return results
        
        # If no jobs found, still try jd_analyzer (it will handle empty job_id)
        print(f"[Graph] Routing to jd_analyzer (no jobs found)")
        return "jd_analyzer"

    graph.add_conditional_edges(
        "job_search",
        route_after_job_search,
        {
            "jd_analyzer": "jd_analyzer",
            "end_search": END
        }
    )
    
    graph.add_conditional_edges(
        "serpapi_job_search",
        route_after_job_search,
        {
            "jd_analyzer": "jd_analyzer",
            "end_search": END
        }
    )

    graph.add_edge("jd_analyzer", "fit_score")
    graph.add_edge("fit_score", "resume_improver")
    graph.add_edge("resume_improver", "cover_letter")
    graph.add_edge("cover_letter", "application_saver")

    graph.add_edge("application_saver", END)

    return graph.compile()

