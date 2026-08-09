import os
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from agents.career_supervisor import run_career_workflow
from models.database import get_db
from models.github_connection_model import GitHubConnection
from models.github_evidence_model import GitHubEvidence
from models.resume_version_model import ResumeVersion
from models.user_model import User
from services.github_mcp_service import (
    build_installation_url,
    create_installation_token,
    fetch_repository_evidence,
    get_installation_details,
    github_mcp_configured,
    list_installation_repositories,
    read_installation_state,
)
from services.github_evidence_service import build_github_resume_proposal
from services.resume_diff_service import build_line_changes
from utils.auth import get_current_user


router = APIRouter(prefix="/github", tags=["GitHub evidence"])


class GitHubEvidenceRequest(BaseModel):
    resume_version_id: str
    repositories: list[str]


class GitHubEvidenceApprovalRequest(BaseModel):
    selected_skills: list[str]
    contribution: str
    wording: str
    outcome: str | None = None
    confirmed: bool = False


@router.get("/status")
def github_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    connection = db.query(GitHubConnection).filter(
        GitHubConnection.user_id == current_user.id
    ).first()
    return {
        "configured": github_mcp_configured(),
        "connected": connection is not None,
        "account_login": connection.account_login if connection else None,
        "provider": "Official GitHub MCP",
    }


@router.post("/connect")
def connect_github(current_user: User = Depends(get_current_user)):
    try:
        return {"authorization_url": build_installation_url(current_user.id)}
    except ValueError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@router.get("/callback")
def github_callback(
    installation_id: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        user_id = read_installation_state(state)
        installation = get_installation_details(installation_id)
    except (ValueError, KeyError, TypeError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    connection = db.query(GitHubConnection).filter(
        GitHubConnection.user_id == user_id
    ).first()
    if not connection:
        connection = GitHubConnection(id=str(uuid4()), user_id=user_id)
        db.add(connection)

    connection.installation_id = installation_id
    connection.account_login = installation.get("account", {}).get("login")
    db.commit()

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    return RedirectResponse(f"{frontend_url}/profile/tailor?github=connected")


@router.get("/repositories")
def get_github_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    connection = _get_connection(db, current_user.id)
    try:
        token = create_installation_token(connection.installation_id)
        return list_installation_repositories(token)
    except Exception as error:
        raise HTTPException(status_code=502, detail="GitHub repositories could not be loaded.") from error


@router.post("/evidence")
async def find_github_evidence(
    request: GitHubEvidenceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = db.query(ResumeVersion).filter(
        ResumeVersion.id == request.resume_version_id,
        ResumeVersion.user_id == current_user.id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Resume version not found.")
    if not request.repositories or len(request.repositories) > 5:
        raise HTTPException(status_code=400, detail="Choose between one and five repositories.")

    connection = _get_connection(db, current_user.id)
    try:
        token = create_installation_token(connection.installation_id)
        allowed_repositories = list_installation_repositories(token)
        allowed_by_name = {repo["full_name"]: repo for repo in allowed_repositories}

        repository_evidence = []
        evidence_records = {}
        for full_name in request.repositories:
            if full_name not in allowed_by_name:
                raise HTTPException(status_code=403, detail=f"Repository is not approved: {full_name}")
            evidence = await fetch_repository_evidence(token, allowed_by_name[full_name])
            evidence_id = str(uuid4())
            evidence["evidence_id"] = evidence_id
            repository_evidence.append(evidence)

            evidence_record = GitHubEvidence(
                id=evidence_id,
                user_id=current_user.id,
                resume_version_id=version.id,
                repository=full_name,
                evidence=evidence,
                approval_status="pending",
                approved_skills=[],
            )
            db.add(evidence_record)
            evidence_records[evidence_id] = evidence_record

        workflow_result = run_career_workflow({
            "task": "rank_github_evidence",
            "missing_skills": version.missing_skills or [],
            "repository_evidence": repository_evidence,
        })
        result = workflow_result["github_project_result"]
        for project in result["projects"]:
            evidence_record = evidence_records.get(project.get("evidence_id"))
            if evidence_record:
                evidence_record.evidence = {
                    **evidence_record.evidence,
                    "matching_skills": project["matching_skills"],
                }
                project["approval_status"] = evidence_record.approval_status
        db.commit()
        return result
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=502, detail="GitHub MCP evidence retrieval failed.") from error


@router.post("/evidence/{evidence_id}/approve")
def approve_github_evidence(
    evidence_id: str,
    request: GitHubEvidenceApprovalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    evidence_record = db.query(GitHubEvidence).filter(
        GitHubEvidence.id == evidence_id,
        GitHubEvidence.user_id == current_user.id,
    ).first()
    if not evidence_record:
        raise HTTPException(status_code=404, detail="GitHub evidence not found.")
    if evidence_record.approval_status != "pending":
        raise HTTPException(status_code=409, detail="This GitHub evidence was already reviewed.")

    source_version = db.query(ResumeVersion).filter(
        ResumeVersion.id == evidence_record.resume_version_id,
        ResumeVersion.user_id == current_user.id,
    ).first()
    if not source_version:
        raise HTTPException(status_code=404, detail="Resume version not found.")

    try:
        proposal = build_github_resume_proposal(
            repository=evidence_record.repository,
            evidence=evidence_record.evidence,
            selected_skills=request.selected_skills,
            contribution=request.contribution,
            wording=request.wording,
            outcome=request.outcome or "",
            confirmed=request.confirmed,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    proposed_content = source_version.content.rstrip() + "\n" + proposal["resume_line"]
    proposal_version = ResumeVersion(
        id=str(uuid4()),
        user_id=current_user.id,
        resume_id=source_version.resume_id,
        job_id=source_version.job_id,
        job_description=source_version.job_description,
        base_content=source_version.content,
        content=proposed_content,
        changes=build_line_changes(source_version.content, proposed_content),
        approval_status="draft",
        source_version_id=source_version.id,
        requirements=source_version.requirements,
        matched_skills=sorted(set(source_version.matched_skills or []) | set(proposal["skills"])),
        missing_skills=[
            skill for skill in (source_version.missing_skills or [])
            if skill.casefold() not in {item.casefold() for item in proposal["skills"]}
        ],
        evidence_map={
            **(source_version.evidence_map or {}),
            **{skill: f"GitHub: {evidence_record.repository}" for skill in proposal["skills"]},
        },
        project_suggestions=source_version.project_suggestions,
        prompt_history=[
            *(source_version.prompt_history or []),
            {"source": "github_evidence", "evidence_id": evidence_record.id},
        ],
        template_mode=source_version.template_mode,
    )
    db.add(proposal_version)

    evidence_record.approval_status = "approved"
    evidence_record.student_contribution = proposal["contribution"]
    evidence_record.approved_wording = proposal["wording"]
    evidence_record.approved_skills = proposal["skills"]
    evidence_record.outcome = proposal["outcome"]
    evidence_record.proposal_version_id = proposal_version.id
    evidence_record.approved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(proposal_version)

    return {
        "evidence_id": evidence_record.id,
        "approval_status": evidence_record.approval_status,
        "version": _version_response(proposal_version),
    }


@router.delete("/connection")
def disconnect_github(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    connection = db.query(GitHubConnection).filter(
        GitHubConnection.user_id == current_user.id
    ).first()
    db.query(GitHubEvidence).filter(GitHubEvidence.user_id == current_user.id).delete()
    if connection:
        db.delete(connection)
    db.commit()
    return {"message": "GitHub connection and cached evidence deleted."}


def _get_connection(db, user_id):
    connection = db.query(GitHubConnection).filter(
        GitHubConnection.user_id == user_id
    ).first()
    if not connection:
        raise HTTPException(status_code=404, detail="Connect GitHub first.")
    return connection


def _version_response(version):
    return {
        "id": version.id,
        "resume_id": version.resume_id,
        "job_id": version.job_id,
        "job_description": version.job_description,
        "base_content": version.base_content,
        "content": version.content,
        "changes": version.changes or [],
        "approval_status": version.approval_status,
        "source_version_id": version.source_version_id,
        "approved_at": version.approved_at,
        "requirements": version.requirements or [],
        "matched_skills": version.matched_skills or [],
        "missing_skills": version.missing_skills or [],
        "evidence_map": version.evidence_map or {},
        "project_suggestions": version.project_suggestions or [],
        "prompt_history": version.prompt_history or [],
        "template_mode": version.template_mode,
        "created_at": version.created_at,
    }
