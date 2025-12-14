from langgraph.graph import StateGraph, END
from agents.resume_extractor_agent import resume_extractor_agent
from agents.query_manager_agent import query_manager_agent
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
    graph.add_node("resume_extractor", resume_extractor_agent)
    
    # NEW: Query Manager optimizes the search string
    graph.add_node("query_manager", query_manager_agent)

    # ATS Score
    graph.add_node("ats_score", ats_score_agent)

    # Search Agents
    graph.add_node("job_search", job_search_agent)
    graph.add_node("serpapi_job_search", serpapi_job_search_agent)
    graph.add_node("tavily_job_search", tavily_job_search_agent)

    # Downstream Analysis
    graph.add_node("jd_analyzer", jd_analyzer_agent)
    graph.add_node("fit_score", fit_score_agent)
    graph.add_node("resume_improver", resume_improver_agent)
    graph.add_node("cover_letter", cover_letter_agent)

    # Application Saver
    graph.add_node(
        "application_saver",
        lambda state: application_saver_agent(state, next(get_db()))
    )
    
    # -------------------- Conditional Logic --------------------

    def search_routing_logic(state):
        # Decide which search agent to use or if we skip to analysis
        route = job_search_router(state)
        
        # If we are doing a search, we might want to optimize the query first
        if route in ["job_search", "serpapi_job_search", "tavily_job_search"]:
            # If we extracted a category but haven't run query manager, run it
            # But here we just route to query_manager, which will then route to the specific search
            # To handle this simple graph, we can route TO query_manager, and pass the intended *search tool* 
            # in state, OR simpler: Always run query_manager before search nodes if possible.
            
            # Since `job_search_router` returns the NODE name, we can intercept it.
            return "query_manager" 
            
        return route

    def query_manager_router(state):
        # After optimizing query, determine which search tool to run
        # We re-use logic or check flags
        if state.get("use_serpapi"):
            return "serpapi_job_search"
        elif state.get("use_tavily"):
            return "tavily_job_search"
        else:
            return "job_search"

    def join_logic(state):
        # This function decides where to go after search/resume processing
        # OPTIMIZATION: STOP if no job is selected.
        
        job_id = state.get("job_id")
        
        # If we have a selected job_id (e.g. from user input or forcing), proceed to analysis
        if job_id:
            return "jd_analyzer"
            
        # Otherwise, just END. The frontend will display results and user will pick one.
        # This prevents running fit_score/cover_letter on nothing.
        return "end_search"

    # -------------------- Edges --------------------
    
    graph.set_entry_point("resume_extractor")
    
    # Parallel: Calculate ATS score immediately
    graph.add_edge("resume_extractor", "ats_score")
    graph.add_edge("ats_score", END)

    # Router: Extractor -> Query Manager (if searching) -> Search Tool
    graph.add_conditional_edges(
        "resume_extractor",
        search_routing_logic,
        {
            "query_manager": "query_manager", # Creating strict search query
            "skip_search": "jd_analyzer",     # If we already have job_id and skip search
            "jd_analyzer": "jd_analyzer"      # Direct fallback
        }
    )
    
    # From Query Manager -> Actual Search Tool
    graph.add_conditional_edges(
        "query_manager",
        query_manager_router,
        {
            "serpapi_job_search": "serpapi_job_search",
            "tavily_job_search": "tavily_job_search",
            "job_search": "job_search"
        }
    )
    
    # After Search -> Conditional Stop
    graph.add_conditional_edges(
        "job_search",
        join_logic,
        {"jd_analyzer": "jd_analyzer", "end_search": END}
    )
    
    graph.add_conditional_edges(
        "serpapi_job_search",
        join_logic,
        {"jd_analyzer": "jd_analyzer", "end_search": END}
    )

    graph.add_conditional_edges(
        "tavily_job_search",
        join_logic,
        {"jd_analyzer": "jd_analyzer", "end_search": END}
    )

    # Deep Analysis Pipeline (Only runs if job_id is present)
    graph.add_edge("jd_analyzer", "fit_score")
    graph.add_edge("fit_score", "resume_improver")
    graph.add_edge("resume_improver", "cover_letter")
    graph.add_edge("cover_letter", "application_saver")
    graph.add_edge("application_saver", END)

    return graph.compile()
