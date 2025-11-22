# agents/application_saver_agent.py

from typing import Dict, Any
from services.application_saver import ApplicationSaver


def application_saver_agent(state: Dict[str, Any], db) -> Dict[str, Any]:
    """
    Agent that stores completed ATS evaluation into SQL.
    """

    resume_id = state.get("resume_id")
    job_id = state.get("job_id")
    overall_fit_score = state.get("overall_fit_score")
    skill_match_score = state.get("skill_match_score", 0.0)  # Use the calculated score from fit_score_agent
    missing_skills = state.get("missing_skills", [])
    fit_explanation = state.get("fit_explanation", "")
    ats_score = None  # reserved for future classical ATS

    app = ApplicationSaver.save(
        db=db,
        resume_id=resume_id,
        job_id=job_id,
        overall_fit_score=overall_fit_score,
        skill_match_score=skill_match_score,  # Use the actual skill_match_score from state
        missing_skills=missing_skills,
        fit_explanation=fit_explanation,
        ats_score=ats_score
    )

    return {
        "application_id": app.id
    }
