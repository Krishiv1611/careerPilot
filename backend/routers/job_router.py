# backend/routers/job_router.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from models.database import get_db
from models.job_model import Job
from models.schemas import JobCreateModel, JobResponseModel

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/add", response_model=JobResponseModel)
def add_job(job: JobCreateModel, db: Session = Depends(get_db)):
    job_id = str(uuid4())

    record = Job(
        id=job_id,
        title=job.title,
        company=job.company,
        location=job.location,
        employment_type=job.employment_type,
        experience_level=job.experience_level,
        skills=job.skills,
        description=job.description,
        salary_range=job.salary_range,
        url=job.url,
        posted_date=job.posted_date,
    )

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/all", response_model=list[JobResponseModel])
def get_all_jobs(db: Session = Depends(get_db)):
    return db.query(Job).all()


@router.get("/{job_id}", response_model=JobResponseModel)
def get_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    return job



    
