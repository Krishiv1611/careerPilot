from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.application_model import Application
from models.database import get_db
from models.job_model import Job
from models.resume_model import Resume
from models.resume_version_model import ResumeVersion
from models.schemas import (
    ApplicationCreateModel,
    ApplicationDetailsUpdateModel,
    ApplicationResponseModel,
    ApplicationStatusUpdateModel,
)
from models.user_model import User
from models.user_job_model import UserJob
from services.application_autopsy_service import run_application_autopsy
from services.application_service import build_new_application, change_status
from services.interview_stress_test_service import generate_resume_defense_matrix
from services.user_job_service import find_user_job, set_user_job_state
from utils.auth import get_current_user


router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("", response_model=ApplicationResponseModel)
def create_application(
    request: ApplicationCreateModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_job = find_user_job(db, current_user.id, request.job_id)
    if not user_job:
        raise HTTPException(status_code=404, detail="Job not found.")
    job, _ = user_job

    if request.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == request.resume_id,
            Resume.user_id == current_user.id,
        ).first()
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found.")

    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == request.job_id,
    ).first()
    if existing:
        set_user_job_state(db, current_user.id, request.job_id, "saved")
        db.commit()
        return existing

    try:
        application_data = build_new_application(
            request.job_id,
            request.resume_id,
            request.confirmed,
            resume_version_id=request.resume_version_id,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    application = Application(
        id=str(uuid4()),
        user_id=current_user.id,
        **application_data,
    )
    db.add(application)
    set_user_job_state(db, current_user.id, request.job_id, "saved")
    db.commit()
    db.refresh(application)
    return application


@router.get("/all", response_model=list[ApplicationResponseModel])
def get_all_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.created_at.desc()).all()


@router.get("/{application_id}", response_model=ApplicationResponseModel)
def get_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, application_id, current_user.id)
    return application


@router.patch("/{application_id}/status", response_model=ApplicationResponseModel)
def update_application_status(
    application_id: str,
    request: ApplicationStatusUpdateModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, application_id, current_user.id)

    try:
        status_change = change_status(application.status, request.status, "user")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    application.status = status_change["status"]
    application.status_source = status_change["status_source"]
    application.timeline = [*(application.timeline or []), status_change["timeline_event"]]
    if "next_action" in request.model_fields_set:
        application.next_action = request.next_action
    if "notes" in request.model_fields_set:
        application.notes = request.notes
    if "deadline" in request.model_fields_set:
        application.deadline = request.deadline
    if "follow_up_at" in request.model_fields_set:
        application.follow_up_at = request.follow_up_at

    db.commit()
    db.refresh(application)
    return application


@router.patch("/{application_id}", response_model=ApplicationResponseModel)
def update_application_details(
    application_id: str,
    request: ApplicationDetailsUpdateModel,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, application_id, current_user.id)
    application.next_action = request.next_action
    application.notes = request.notes
    application.deadline = request.deadline
    application.follow_up_at = request.follow_up_at
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, application_id, current_user.id)
    db.delete(application)
    db.commit()
    return {"message": "Application deleted successfully"}


@router.post("/{application_id}/stress-test")
def stress_test_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, application_id, current_user.id)
    ctx = _resolve_application_context(db, application, current_user.id)
    return generate_resume_defense_matrix(
        resume_text=ctx["resume_text"],
        job_description=ctx["job_description"],
        company=ctx["company"],
    )


@router.post("/{application_id}/autopsy")
def autopsy_application(
    application_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    application = _get_owned_application(db, application_id, current_user.id)
    ctx = _resolve_application_context(db, application, current_user.id)
    return run_application_autopsy(
        resume_text=ctx["resume_text"],
        job_description=ctx["job_description"],
        rejection_feedback=application.notes or "",
    )


def _resolve_application_context(db: Session, application: Application, user_id: int):
    resume_text = ""
    if application.resume_version_id:
        version = db.query(ResumeVersion).filter(
            ResumeVersion.id == application.resume_version_id,
            ResumeVersion.user_id == user_id,
        ).first()
        if version and version.content:
            resume_text = version.content
        elif version and version.base_content:
            resume_text = version.base_content

    if not resume_text and application.resume_id:
        resume = db.query(Resume).filter(
            Resume.id == application.resume_id,
            Resume.user_id == user_id,
        ).first()
        if resume and resume.raw_text:
            resume_text = resume.raw_text

    if not resume_text:
        latest_resume = db.query(Resume).filter(
            Resume.user_id == user_id,
        ).order_by(Resume.created_at.desc()).first()
        if latest_resume and latest_resume.raw_text:
            resume_text = latest_resume.raw_text

    company = ""
    job_description = ""
    if application.job_id:
        job = db.query(Job).filter(Job.id == application.job_id).first()
        if job:
            company = job.company or ""
            job_description = job.description or ""

    if not job_description and application.resume_version_id:
        version = db.query(ResumeVersion).filter(
            ResumeVersion.id == application.resume_version_id,
            ResumeVersion.user_id == user_id,
        ).first()
        if version and version.job_description:
            job_description = version.job_description

    return {
        "resume_text": resume_text,
        "job_description": job_description,
        "company": company,
    }


def _get_owned_application(db, application_id, user_id):
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == user_id,
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")
    return application
