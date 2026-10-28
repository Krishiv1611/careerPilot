from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from models.database import get_db
from models.growth_priority_model import GrowthPriority
from models.resume_version_model import ResumeVersion
from models.user_model import User
from services.growth_blueprint_database import get_skill_blueprint
from services.growth_service import (
    build_growth_plan,
    complete_growth_priority,
    verify_github_growth_submission,
)
from utils.auth import get_current_user


router = APIRouter(prefix="/growth", tags=["Growth"])


class GrowthCompletionRequest(BaseModel):
    evidence_url: str | None = None
    external_confirmation: bool = False


class RepoVerificationRequest(BaseModel):
    repo_url: str
    skill: str


@router.get("/plan")
def get_growth_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    versions = db.query(ResumeVersion).filter(
        ResumeVersion.user_id == current_user.id
    ).all()
    version_data = [
        {"missing_skills": version.missing_skills or []}
        for version in versions
    ]
    proposed_priorities = build_growth_plan(version_data)
    existing = db.query(GrowthPriority).filter(
        GrowthPriority.user_id == current_user.id
    ).all()
    existing_by_skill = {priority.skill.casefold(): priority for priority in existing}
    priorities = []

    for proposal in proposed_priorities:
        priority = existing_by_skill.get(proposal["skill"].casefold())
        if not priority:
            priority = GrowthPriority(
                id=str(uuid4()),
                user_id=current_user.id,
                status="active",
                skill=proposal["skill"],
                job_count=proposal["job_count"],
                next_action=proposal["next_action"],
                completion_rule=proposal["completion_rule"],
                blueprint_title=proposal.get("blueprint_title"),
            )
            db.add(priority)
        elif priority.status != "completed":
            priority.job_count = proposal["job_count"]
            priority.next_action = proposal["next_action"]
            priority.completion_rule = proposal["completion_rule"]
            if proposal.get("blueprint_title"):
                priority.blueprint_title = proposal.get("blueprint_title")
        priorities.append(priority)

    db.commit()
    for priority in priorities:
        db.refresh(priority)

    return {
        "priorities": [_priority_response(priority) for priority in priorities],
        "evidence_source_count": len(versions),
    }


@router.get("/blueprints/{skill}")
def get_blueprint_for_skill(skill: str):
    blueprint = get_skill_blueprint(skill)
    if not blueprint:
        raise HTTPException(status_code=404, detail=f"No curated blueprint found for '{skill}'.")
    return blueprint


@router.post("/verify-repo")
def verify_repository_evidence(request: RepoVerificationRequest):
    result = verify_github_growth_submission(request.repo_url, request.skill)
    return result


@router.post("/priorities/{priority_id}/complete")
def complete_priority(
    priority_id: str,
    request: GrowthCompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    priority = db.query(GrowthPriority).filter(
        GrowthPriority.id == priority_id,
        GrowthPriority.user_id == current_user.id,
    ).first()
    if not priority:
        raise HTTPException(status_code=404, detail="Growth priority not found.")
    if priority.status == "completed":
        return _priority_response(priority)

    try:
        completion = complete_growth_priority(
            evidence_url=request.evidence_url or "",
            external_confirmation=request.external_confirmation,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    # If evidence is a GitHub repo, inspect it and verify
    verification = None
    if request.evidence_url and "github.com" in request.evidence_url:
        verification = verify_github_growth_submission(request.evidence_url, priority.skill)
        if verification.get("verified"):
            completion["completion_source"] = "github_verified"

    priority.status = completion["status"]
    priority.completion_source = completion["completion_source"]
    priority.evidence_url = completion["evidence_url"]
    priority.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(priority)
    resp = _priority_response(priority)
    if verification:
        resp["verification"] = verification
    return resp


def _priority_response(priority):
    return {
        "id": priority.id,
        "skill": priority.skill,
        "job_count": priority.job_count,
        "blueprint_title": getattr(priority, "blueprint_title", None) or f"{priority.skill.capitalize()} Production Proof",
        "next_action": priority.next_action,
        "completion_rule": priority.completion_rule,
        "status": priority.status,
        "completion_source": priority.completion_source,
        "evidence_url": priority.evidence_url,
        "completed_at": priority.completed_at,
    }
