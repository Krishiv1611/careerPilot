from fastapi import APIRouter, Depends
from pydantic import BaseModel

from models.user_model import User
from services.outreach_service import generate_outreach_package
from utils.auth import get_current_user

router = APIRouter(prefix="/outreach", tags=["Recruiter Outreach"])


class OutreachRequest(BaseModel):
    job_title: str
    company_name: str
    candidate_name: str | None = None
    key_skills: list[str] | None = None
    recruiter_name: str | None = None


@router.post("/generate")
def create_outreach_package(
    request: OutreachRequest,
    current_user: User = Depends(get_current_user),
):
    candidate = request.candidate_name or current_user.name or "Candidate"
    package = generate_outreach_package(
        job_title=request.job_title,
        company_name=request.company_name,
        candidate_name=candidate,
        key_skills=request.key_skills,
        recruiter_name=request.recruiter_name,
    )
    return package
