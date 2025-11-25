# backend/routers/job_router.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from models.database import get_db
from models.job_model import Job
from models.schemas import JobCreateModel, JobResponseModel
from services.job_ingestor import JobIngestor

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
    
    # Index job in vector store for semantic search
    if job.description:
        try:
            ingestor = JobIngestor()
            ingestor.ingest_job(job_id=job_id, job_description=job.description)
            print(f"[JobRouter] Successfully indexed job {job_id} in vector store")
        except Exception as e:
            print(f"[JobRouter] Warning: Failed to index job in vector store: {e}")
            # Don't fail the request if vector indexing fails
    
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





@router.post("/reindex-all")
def reindex_all_jobs(db: Session = Depends(get_db)):
    """
    Re-index all existing jobs in the vector store.
    Useful when jobs were added before vector indexing was implemented.
    """
    jobs = db.query(Job).all()
    
    if not jobs:
        return {"message": "No jobs found to index", "indexed_count": 0}
    
    ingestor = JobIngestor()
    indexed_count = 0
    failed_count = 0
    
    for job in jobs:
        if job.description:
            try:
                ingestor.ingest_job(job_id=job.id, job_description=job.description)
                indexed_count += 1
                print(f"[JobRouter] Re-indexed job {job.id}: {job.title}")
            except Exception as e:
                failed_count += 1
                print(f"[JobRouter] Failed to re-index job {job.id}: {e}")
    
    return {
        "message": f"Re-indexing complete",
        "total_jobs": len(jobs),
        "indexed_count": indexed_count,
        "failed_count": failed_count
    }


@router.delete("/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    db.delete(job)
    db.commit()

    return {"message": "Job deleted successfully"}
