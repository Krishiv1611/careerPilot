# services/application_saver.py

from uuid import uuid4
from sqlalchemy.orm import Session
from models.application_model import Application
from datetime import datetime

class ApplicationSaver:
    """
    Saves ATS evaluation + recommendations into the Application table.
    """

    @staticmethod
    def save(
        db: Session,
        resume_id: str,
        job_id: str,
        overall_fit_score: float,
        skill_match_score: float,
        missing_skills: list,
        fit_explanation: str,
        ats_score: float = None
    ):
        """Save evaluation results into the database using correct column names."""

        app = Application(
            id=str(uuid4()),
            resume_id=resume_id,
            job_id=job_id,

            # ---- Correct Fields (match Application model) ----
            overall_fit_score=overall_fit_score,
            skill_match_score=skill_match_score,
            missing_skills=missing_skills,          # stored as JSON automatically
            fit_explanation=fit_explanation,
            ats_score=ats_score,

            created_at=datetime.utcnow()
        )

        db.add(app)
        db.commit()
        db.refresh(app)

        return app
