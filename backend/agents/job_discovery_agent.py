from agents.state import CareerWorkflowState
from services.job_discovery_service import run_job_search


def discover_jobs(state: CareerWorkflowState) -> dict:
    """Search job providers and publish only results that pass job filters."""
    result = run_job_search(
        state.get("role", ""),
        state.get("location"),
        state.get("employment_type"),
        providers=state.get("providers"),
    )
    return {
        "handled_by": "job_discovery_agent",
        "job_search_result": result,
    }
