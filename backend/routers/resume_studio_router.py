from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from agents.career_supervisor import run_career_workflow
from models.database import get_db
from models.job_model import Job
from models.resume_model import Resume
from models.resume_version_model import ResumeVersion
from models.user_model import User
from services.docx_resume_service import create_tailored_docx
from services.resume_diff_service import apply_change_decisions, build_line_changes
from services.user_job_service import find_user_job
from utils.auth import get_current_user


router = APIRouter(prefix="/resume-studio", tags=["Resume Studio"])


class ResumeAnalysisRequest(BaseModel):
    resume_id: str
    job_description: str | None = None
    job_id: str | None = None


class ResumePromptRequest(BaseModel):
    instruction: str


class ResumeChangeDecision(BaseModel):
    change_id: str
    status: Literal["accepted", "rejected"]


class ResumeReviewRequest(BaseModel):
    decisions: list[ResumeChangeDecision]


@router.post("/analyze")
def analyze_resume(
    request: ResumeAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = _get_owned_resume(db, request.resume_id, current_user.id)
    job_description = (request.job_description or "").strip()

    if request.job_id:
        user_job = find_user_job(db, current_user.id, request.job_id)
        if not user_job:
            raise HTTPException(status_code=404, detail="Job not found in your workspace.")
        job, _ = user_job
        if not job_description:
            job_description = job.description or ""

    if not job_description:
        raise HTTPException(status_code=400, detail="Add a job description to continue.")

    workflow_result = run_career_workflow({
        "task": "analyze_resume",
        "resume_text": resume.raw_text,
        "job_description": job_description,
    })
    analysis = workflow_result["resume_analysis"]
    version = ResumeVersion(
        id=str(uuid4()),
        user_id=current_user.id,
        resume_id=resume.id,
        job_id=request.job_id,
        job_description=job_description,
        base_content=resume.raw_text,
        content=analysis["tailored_text"],
        changes=build_line_changes(resume.raw_text, analysis["tailored_text"]),
        approval_status="draft",
        requirements=analysis["requirements"],
        matched_skills=analysis["matched_skills"],
        missing_skills=analysis["missing_skills"],
        evidence_map=analysis["evidence_map"],
        project_suggestions=analysis["project_suggestions"],
        prompt_history=[],
        template_mode="same_docx_template" if resume.file_type == "docx" else "clean_pdf",
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return _version_response(version)


@router.get("/versions")
def list_versions(
    resume_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ResumeVersion).filter(ResumeVersion.user_id == current_user.id)
    if resume_id:
        query = query.filter(ResumeVersion.resume_id == resume_id)
    versions = query.order_by(ResumeVersion.created_at.desc()).all()
    return [_version_response(version) for version in versions]


@router.post("/versions/{version_id}/prompt")
def prompt_resume_version(
    version_id: str,
    request: ResumePromptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = _get_owned_version(db, version_id, current_user.id)
    resume = _get_owned_resume(db, version.resume_id, current_user.id)

    try:
        workflow_result = run_career_workflow({
            "task": "edit_resume",
            "resume_text": resume.raw_text,
            "current_resume_text": version.content,
            "instruction": request.instruction,
            "job_description": version.job_description,
        })
        updated_content = workflow_result["resume_edit_result"]["content"]
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    new_version = ResumeVersion(
        id=str(uuid4()),
        user_id=current_user.id,
        resume_id=version.resume_id,
        job_id=version.job_id,
        job_description=version.job_description,
        base_content=version.content,
        content=updated_content,
        changes=build_line_changes(version.content, updated_content),
        approval_status="draft",
        source_version_id=version.id,
        requirements=version.requirements,
        matched_skills=version.matched_skills,
        missing_skills=version.missing_skills,
        evidence_map=version.evidence_map,
        project_suggestions=version.project_suggestions,
        prompt_history=[
            *(version.prompt_history or []),
            {"instruction": request.instruction, "source_version_id": version.id},
        ],
        template_mode=version.template_mode,
    )
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    return _version_response(new_version)


@router.post("/versions/{version_id}/review")
def review_resume_version(
    version_id: str,
    request: ResumeReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = _get_owned_version(db, version_id, current_user.id)
    if version.approval_status != "draft":
        raise HTTPException(status_code=409, detail="Only a draft can be reviewed.")

    decisions = {decision.change_id: decision.status for decision in request.decisions}
    known_change_ids = {change["id"] for change in (version.changes or [])}
    if set(decisions) - known_change_ids:
        raise HTTPException(status_code=400, detail="The review contains an unknown change.")

    try:
        reviewed = apply_change_decisions(
            version.base_content,
            version.changes or [],
            decisions,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    approved_version = ResumeVersion(
        id=str(uuid4()),
        user_id=current_user.id,
        resume_id=version.resume_id,
        job_id=version.job_id,
        job_description=version.job_description,
        base_content=version.base_content,
        content=reviewed["content"],
        changes=reviewed["changes"],
        approval_status="approved",
        source_version_id=version.id,
        approved_at=datetime.now(timezone.utc),
        requirements=version.requirements,
        matched_skills=version.matched_skills,
        missing_skills=version.missing_skills,
        evidence_map=version.evidence_map,
        project_suggestions=version.project_suggestions,
        prompt_history=version.prompt_history,
        template_mode=version.template_mode,
    )
    db.add(approved_version)
    db.commit()
    db.refresh(approved_version)
    return _version_response(approved_version)


@router.get("/versions/{version_id}/download")
def download_resume_version(
    version_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    version = _get_owned_version(db, version_id, current_user.id)
    resume = _get_owned_resume(db, version.resume_id, current_user.id)

    if version.approval_status != "approved":
        raise HTTPException(status_code=409, detail="Review every proposed change before downloading.")

    if resume.file_type == "docx":
        stored_filename = resume.stored_filename or f"{resume.id}.docx"
        original_path = Path(__file__).resolve().parents[1] / "data" / "resumes" / Path(stored_filename).name
        if not original_path.exists():
            raise HTTPException(status_code=404, detail="The original DOCX template is missing.")
        try:
            document = create_tailored_docx(
                str(original_path),
                version.base_content,
                version.content,
            )
        except ValueError as error:
            raise HTTPException(status_code=409, detail=str(error)) from error
        return StreamingResponse(
            document,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": "attachment; filename=careerpilot-tailored-resume.docx"},
        )

    document = _create_pdf(version.content)
    return StreamingResponse(
        document,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=careerpilot-tailored-resume.pdf"},
    )


def _get_owned_resume(db, resume_id, user_id):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == user_id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume


def _get_owned_version(db, version_id, user_id):
    version = db.query(ResumeVersion).filter(
        ResumeVersion.id == version_id,
        ResumeVersion.user_id == user_id,
    ).first()
    if not version:
        raise HTTPException(status_code=404, detail="Resume version not found.")
    return version


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


def _create_pdf(text):
    buffer = BytesIO()
    document = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    margin = 50
    y_position = height - 50
    document.setFont("Helvetica", 10)

    for line in text.splitlines():
        for wrapped_line in simpleSplit(line, "Helvetica", 10, width - (2 * margin)):
            if y_position < 50:
                document.showPage()
                document.setFont("Helvetica", 10)
                y_position = height - 50
            document.drawString(margin, y_position, wrapped_line)
            y_position -= 13
        y_position -= 2

    document.save()
    buffer.seek(0)
    return buffer
