from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.candidate_profile_model import CandidateProfile
from models.database import get_db
from models.resume_model import Resume
from models.user_model import User
from services.candidate_profile_service import build_profile_data
from utils.auth import get_current_user


router = APIRouter(prefix="/profile", tags=["Candidate profile"])


class ProfileUpdate(BaseModel):
    target_roles: list[str]
    preferred_locations: list[str]
    employment_types: list[str]


@router.get("")
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    result = build_profile_data(resumes, profile)
    result["id"] = profile.id if profile else None
    return result


@router.put("")
def update_profile(
    request: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(CandidateProfile).filter(
        CandidateProfile.user_id == current_user.id
    ).first()
    if not profile:
        profile = CandidateProfile(id=str(uuid4()), user_id=current_user.id)
        db.add(profile)

    profile.target_roles = _clean_values(request.target_roles)
    profile.preferred_locations = _clean_values(request.preferred_locations)
    profile.employment_types = _clean_values(request.employment_types)
    db.commit()
    db.refresh(profile)

    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).all()
    result = build_profile_data(resumes, profile)
    result["id"] = profile.id
    return result


def _clean_values(values):
    return list(dict.fromkeys(value.strip() for value in values if value.strip()))
