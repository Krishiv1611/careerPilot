from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.application_model import Application
from models.database import get_db
from models.resume_model import Resume
from models.resume_version_model import ResumeVersion
from models.user_job_model import UserJob
from models.user_model import User
from services.today_service import choose_today_action
from utils.auth import get_current_user


router = APIRouter(prefix="/today", tags=["Today"])


@router.get("")
def get_today_action(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).all()
    resume_count = db.query(Resume).filter(Resume.user_id == current_user.id).count()
    job_count = db.query(UserJob).filter(
        UserJob.user_id == current_user.id,
        UserJob.state != "dismissed",
    ).count()
    draft_version_count = db.query(ResumeVersion).filter(
        ResumeVersion.user_id == current_user.id,
        ResumeVersion.approval_status == "draft",
    ).count()

    action = choose_today_action(
        resume_count=resume_count,
        job_count=job_count,
        draft_version_count=draft_version_count,
        applications=[
            {
                "id": application.id,
                "status": application.status,
                "follow_up_at": application.follow_up_at,
                "deadline": application.deadline,
                "next_action": application.next_action,
            }
            for application in applications
        ],
    )
    return {
        "action": action,
        "counts": {
            "resumes": resume_count,
            "jobs": job_count,
            "applications": len(applications),
            "resume_drafts": draft_version_count,
        },
    }
