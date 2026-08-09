from agents.state import CareerWorkflowState
from services.career_track_classifier import suggest_career_tracks
from services.github_project_ranker import rank_projects
from services.resume_tailoring_service import (
    analyze_resume_for_job,
    apply_simple_prompt,
    find_unsupported_claims,
)


def analyze_resume_evidence(state: CareerWorkflowState) -> dict:
    """Map resume evidence to the job without inventing missing claims."""
    if state.get("task") == "edit_resume":
        return _edit_resume(state)
    if state.get("task") == "rank_github_evidence":
        return _rank_github_evidence(state)
    if state.get("task") == "suggest_career_tracks":
        return _suggest_career_tracks(state)

    analysis = analyze_resume_for_job(
        state.get("resume_text", ""),
        state.get("job_description", ""),
    )
    return {
        "handled_by": "resume_evidence_agent",
        "resume_analysis": analysis,
    }


def _edit_resume(state: CareerWorkflowState) -> dict:
    original_text = state.get("resume_text", "")
    updated_content = apply_simple_prompt(
        state.get("current_resume_text", original_text),
        state.get("instruction", ""),
        job_description=state.get("job_description", ""),
    )
    unsupported = find_unsupported_claims(original_text, updated_content)
    if unsupported["skills"] or unsupported["numbers"]:
        raise ValueError("That edit would add claims not supported by the original resume.")

    return {
        "handled_by": "resume_evidence_agent",
        "resume_edit_result": {
            "content": updated_content,
            "unsupported_claims": unsupported,
        },
    }


def _rank_github_evidence(state: CareerWorkflowState) -> dict:
    repositories = state.get("repository_evidence", [])
    projects = rank_projects(state.get("missing_skills", []), repositories)
    return {
        "handled_by": "resume_evidence_agent",
        "github_project_result": {
            "projects": projects,
            "repositories_checked": len(repositories),
        },
    }


def _suggest_career_tracks(state: CareerWorkflowState) -> dict:
    predictor = state.get("career_track_predictor") or suggest_career_tracks
    result = predictor(state.get("resume_text", ""), limit=3)
    return {
        "handled_by": "resume_evidence_agent",
        "career_track_result": result,
    }
