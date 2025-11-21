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
    skill_score = len(state.get("extracted_skills", []))  # simple metric
    missing_skills = state.get("missing_skills", [])
    suggestions = state.get("fit_explanation", "")
    ats_score = None  # reserved for future classical ATS

    app = ApplicationSaver.save(
        db=db,
        resume_id=resume_id,
        job_id=job_id,
        overall_fit_score=overall_fit_score,   # <-- FIXED
        skill_match_score=skill_score,
        missing_skills=missing_skills,
        fit_explanation=suggestions,   # <-- suggestions is actually explanation
        ats_score=ats_score
)


    return {
        "application_id": app.id
    }
