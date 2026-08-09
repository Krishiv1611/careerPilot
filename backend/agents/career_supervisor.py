from langgraph.graph import END, START, StateGraph

from agents.job_discovery_agent import discover_jobs
from agents.resume_evidence_agent import analyze_resume_evidence
from agents.state import CareerWorkflowState


def _route_task(state: CareerWorkflowState) -> str:
    task = state.get("task")
    if task == "discover_jobs":
        return "job_discovery_agent"
    if task in (
        "analyze_resume",
        "edit_resume",
        "rank_github_evidence",
        "suggest_career_tracks",
    ):
        return "resume_evidence_agent"
    raise ValueError(f"Unsupported career workflow task: {task}")


def _build_workflow():
    workflow = StateGraph(CareerWorkflowState)
    workflow.add_node("job_discovery_agent", discover_jobs)
    workflow.add_node("resume_evidence_agent", analyze_resume_evidence)
    workflow.add_conditional_edges(
        START,
        _route_task,
        {
            "job_discovery_agent": "job_discovery_agent",
            "resume_evidence_agent": "resume_evidence_agent",
        },
    )
    workflow.add_edge("job_discovery_agent", END)
    workflow.add_edge("resume_evidence_agent", END)
    return workflow.compile()


career_workflow = _build_workflow()


def run_career_workflow(request: CareerWorkflowState) -> CareerWorkflowState:
    """Run one student task through the matching specialist agent."""
    return career_workflow.invoke(request)
