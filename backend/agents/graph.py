from langgraph.graph import StateGraph, END
from agents.resume_extractor_agent import resume_extractor_agent
from agents.skill_mapping_agent import skill_mapping_agent
from agents.job_search_agent import job_search_agent
from agents.jd_analyzer_agent import jd_analyzer_agent
from agents.fit_score_agent import fit_score_agent
from agents.resume_improver_agent import resume_improver_agent
from agents.cover_letter_agent import cover_letter_agent
from agents.application_saver_agent import application_saver_agent
from agents.state import CareerPilotState

from models.database import SessionLocal


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

    # Conditional edge → if user gives search_query, go to job_search
    graph.add_conditional_edges(
        "skill_mapping",
        lambda state: "job_search" if state.get("search_query") else "jd_analyzer",
        {
            "job_search": "job_search",
            "jd_analyzer": "jd_analyzer",
        }
    )

    # After job search, must pass job_id → jd_analyzer
    graph.add_edge("job_search", "jd_analyzer")

    graph.add_edge("jd_analyzer", "fit_score")
    graph.add_edge("fit_score", "resume_improver")
    graph.add_edge("resume_improver", "cover_letter")
    graph.add_edge("cover_letter", "application_saver")

    graph.add_edge("application_saver", END)

    return graph.compile()

