from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from models.application_model import Application
from models.job_model import Job
from models.user_job_model import UserJob
from models.schemas import JobResponseModel
from models.user_model import User
from utils.auth import get_current_user
from services.user_job_service import find_user_job, set_user_job_state, should_show_user_job


router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("/all", response_model=list[JobResponseModel])
def get_all_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(Job, UserJob).join(
        UserJob,
        UserJob.job_id == Job.id,
    ).filter(
        UserJob.user_id == current_user.id,
    ).order_by(Job.fetched_at.desc().nullslast()).all()
    return [
        _job_response(job, user_job.state)
        for job, user_job in rows
        if should_show_user_job(user_job.state, job.fetched_at)
    ]


@router.post("/{job_id}/save", response_model=JobResponseModel)
def save_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job, _ = _get_user_job(db, job_id, current_user.id)
    user_job = set_user_job_state(db, current_user.id, job.id, "saved")
    db.commit()
    return _job_response(job, user_job.state)


@router.post("/{job_id}/dismiss", response_model=JobResponseModel)
def dismiss_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job, _ = _get_user_job(db, job_id, current_user.id)
    tracked_application = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == job.id,
    ).first()
    if tracked_application:
        raise HTTPException(
            status_code=409,
            detail="Remove the tracked application before dismissing this job.",
        )
    user_job = set_user_job_state(db, current_user.id, job.id, "dismissed")
    db.commit()
    return _job_response(job, user_job.state)


@router.get("/{job_id}", response_model=JobResponseModel)
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job, user_job = _get_user_job(db, job_id, current_user.id)
    return _job_response(job, user_job.state)


def _get_user_job(db, job_id, user_id):
    row = find_user_job(db, user_id, job_id, include_dismissed=True)
    if not row:
        raise HTTPException(status_code=404, detail="Job not found in your workspace.")
    return row


def _job_response(job, user_state):
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "employment_type": job.employment_type,
        "experience_level": job.experience_level,
        "skills": job.skills or [],
        "description": job.description,
        "salary_range": job.salary_range,
        "url": job.url,
        "posted_date": job.posted_date,
        "source": job.source,
        "verification_status": job.verification_status,
        "fetched_at": job.fetched_at,
        "user_state": user_state,
    }
