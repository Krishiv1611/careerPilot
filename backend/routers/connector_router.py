from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from models.user_model import User
from services.github_public_service import fetch_github_summary
from services.leetcode_service import fetch_leetcode_stats
from services.linkedin_pdf_service import parse_linkedin_text_profile
from utils.auth import get_current_user

router = APIRouter(prefix="/connectors", tags=["Platform Connectors"])


class UsernameRequest(BaseModel):
    username: str


class LinkedInTextRequest(BaseModel):
    text: str


@router.post("/leetcode")
def get_leetcode_profile(
    request: UsernameRequest,
    current_user: User = Depends(get_current_user),
):
    stats = fetch_leetcode_stats(request.username)
    return stats


@router.post("/github")
def get_github_profile(
    request: UsernameRequest,
    current_user: User = Depends(get_current_user),
):
    summary = fetch_github_summary(request.username)
    return summary


@router.post("/linkedin")
def import_linkedin_profile(
    request: LinkedInTextRequest,
    current_user: User = Depends(get_current_user),
):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="LinkedIn profile text cannot be empty.")
    profile = parse_linkedin_text_profile(request.text)
    return profile
