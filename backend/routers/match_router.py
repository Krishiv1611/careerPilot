from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.job_model import Job
from models.match_model import MatchResult
from models.resume_model import Resume
from models.user_model import User
from services.matching_service import match_resume_to_job
from services.user_job_service import find_user_job
from utils.auth import get_current_user


router = APIRouter(prefix="/matches", tags=["Job matching"])


class MatchRequest(BaseModel):
    job_id: str
    resume_id: str | None = None


@router.post("/analyze")
def analyze_match(
    request: MatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_job = find_user_job(db, current_user.id, request.job_id)
    if not user_job:
        raise HTTPException(status_code=404, detail="Job not found in your workspace.")
    job, _ = user_job
    if not job.description:
        raise HTTPException(status_code=400, detail="This job has no description to analyze.")

    resume_query = db.query(Resume).filter(Resume.user_id == current_user.id)
    if request.resume_id:
        resume = resume_query.filter(Resume.id == request.resume_id).first()
    else:
        resume = resume_query.order_by(Resume.created_at.desc()).first()
    if not resume:
        raise HTTPException(status_code=400, detail="Add a resume before checking this match.")

    analysis = match_resume_to_job(resume.raw_text, job.description, job_title=job.title)
    match = MatchResult(
        id=str(uuid4()),
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=job.id,
        eligible=analysis["eligibility_status"] == "eligible",
        **analysis,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return _match_response(match)


@router.get("/job/{job_id}")
def get_latest_match(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.query(MatchResult).filter(
        MatchResult.job_id == job_id,
        MatchResult.user_id == current_user.id,
    ).order_by(MatchResult.created_at.desc()).first()
    if not match:
        return None
    return _match_response(match)


def _match_response(match):
    return {
        "id": match.id,
        "resume_id": match.resume_id,
        "job_id": match.job_id,
        "eligibility_status": match.eligibility_status,
        "eligibility_reasons": match.eligibility_reasons,
        "coverage_percent": match.coverage_percent,
        "requirements": match.requirements,
        "matched_skills": match.matched_skills,
        "missing_skills": match.missing_skills,
        "must_have_skills": match.must_have_skills,
        "missing_must_haves": match.missing_must_haves,
        "evidence_map": match.evidence_map,
        "created_at": match.created_at,
    }
