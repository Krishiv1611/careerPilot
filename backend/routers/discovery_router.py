from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agents.career_supervisor import run_career_workflow
from models.database import get_db
from models.job_model import Job
from models.user_model import User
from services.user_job_service import set_user_job_state
from utils.auth import get_current_user


router = APIRouter(prefix="/discovery", tags=["Job discovery"])


class JobSearchRequest(BaseModel):
    query: str
    location: str | None = None
    employment_type: str | None = None


@router.post("/search")
def search_jobs(
    request: JobSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workflow_result = run_career_workflow({
        "task": "discover_jobs",
        "role": request.query,
        "location": request.location,
        "employment_type": request.employment_type,
    })
    result = workflow_result["job_search_result"]
    result["jobs"] = _save_jobs(db, result["jobs"], current_user.id)
    return result


def _save_jobs(db, jobs, user_id):
    saved_jobs = []

    for job in jobs:
        existing_job = db.query(Job).filter(Job.url == job["url"]).first()

        if existing_job:
            existing_job.title = job["title"]
            existing_job.company = job["company"]
            existing_job.location = job.get("location")
            existing_job.employment_type = job.get("employment_type")
            existing_job.experience_level = job.get("experience_level")
            existing_job.description = job.get("description")
            existing_job.source = ", ".join(job.get("sources") or [job.get("source")])
            existing_job.verification_status = job.get("verification_status", "candidate")
            existing_job.fetched_at = datetime.now(timezone.utc)
            user_job = set_user_job_state(db, user_id, existing_job.id, "discovered")
            if user_job.state != "dismissed":
                saved_jobs.append(_job_response(existing_job, job, user_job.state))
            continue

        record = Job(
            id=str(uuid4()),
            title=job["title"],
            company=job["company"],
            location=job.get("location"),
            employment_type=job.get("employment_type"),
            experience_level=job.get("experience_level"),
            skills=job.get("skills") or [],
            description=job.get("description"),
            salary_range=job.get("salary_range"),
            url=job["url"],
            source=", ".join(job.get("sources") or [job.get("source")]),
            verification_status=job.get("verification_status", "candidate"),
            fetched_at=datetime.now(timezone.utc),
        )
        db.add(record)
        db.flush()
        user_job = set_user_job_state(db, user_id, record.id, "discovered")
        saved_jobs.append(_job_response(record, job, user_job.state))

    db.commit()
    return saved_jobs


def _job_response(record, discovery_data, user_state):
    return {
        "id": record.id,
        "title": record.title,
        "company": record.company,
        "location": record.location,
        "employment_type": record.employment_type,
        "experience_level": record.experience_level,
        "skills": record.skills or [],
        "description": record.description,
        "salary_range": record.salary_range,
        "url": record.url,
        "source": record.source,
        "sources": discovery_data.get("sources") or [record.source],
        "verification_status": record.verification_status,
        "fetched_at": record.fetched_at,
        "user_state": user_state,
    }
