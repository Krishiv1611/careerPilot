from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from agents.career_supervisor import run_career_workflow
from models.database import get_db
from models.application_model import Application
from models.github_evidence_model import GitHubEvidence
from models.match_model import MatchResult
from models.resume_model import Resume
from models.resume_version_model import ResumeVersion
from models.schemas import ResumeResponseModel
from models.user_model import User
from services.pdf_reader import PDFReader
from services.skill_extractor import SkillExtractor
from services.text_cleaner import TextCleaner
from services.docx_resume_service import extract_docx_text
from utils.auth import get_current_user


router = APIRouter(prefix="/resume", tags=["Resume"])

BACKEND_ROOT = Path(__file__).resolve().parents[1]
RESUME_DIR = BACKEND_ROOT / "data" / "resumes"
MAX_RESUME_BYTES = 10 * 1024 * 1024


@router.post("/upload", response_model=ResumeResponseModel)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filename = file.filename or ""
    file_type = Path(filename).suffix.lower().lstrip(".")
    if file_type not in {"pdf", "docx"}:
        raise HTTPException(status_code=400, detail="Upload a PDF or DOCX resume.")

    content = await file.read(MAX_RESUME_BYTES + 1)
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Resume must be 10 MB or smaller.")
    if file_type == "pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid PDF.")
    if file_type == "docx" and not content.startswith(b"PK"):
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid DOCX.")

    RESUME_DIR.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid4())
    stored_filename = f"{file_id}.{file_type}"
    file_path = RESUME_DIR / stored_filename
    file_path.write_bytes(content)

    try:
        if file_type == "pdf":
            raw_text = PDFReader().extract_text(str(file_path))
        else:
            raw_text = extract_docx_text(content)
        cleaned = TextCleaner.clean_text(raw_text)
        if not cleaned.strip():
            raise HTTPException(status_code=422, detail="No readable text was found in this PDF.")

        extracted_skills, skill_categories = SkillExtractor().extract_skills(cleaned)
        career_track_suggestions = []
        resume_category = None
        try:
            workflow_result = run_career_workflow({
                "task": "suggest_career_tracks",
                "resume_text": cleaned,
            })
            career_track_result = workflow_result.get("career_track_result", {})
            if career_track_result.get("available"):
                career_track_suggestions = career_track_result.get("suggestions") or []
                if career_track_suggestions:
                    resume_category = career_track_suggestions[0].get("category")
        except Exception:
            # Classification is advisory and must never block evidence upload.
            career_track_suggestions = []

        resume = Resume(
            id=file_id,
            user_id=current_user.id,
            user_name=current_user.full_name,
            raw_text=cleaned,
            extracted_skills=extracted_skills,
            skill_categories=skill_categories,
            resume_category=resume_category,
            career_track_suggestions=career_track_suggestions,
            original_filename=Path(filename).name,
            file_type=file_type,
            stored_filename=stored_filename,
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return resume
    except HTTPException:
        file_path.unlink(missing_ok=True)
        raise
    except Exception as exc:
        file_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail="The resume could not be parsed.") from exc


@router.get("/all", response_model=list[ResumeResponseModel])
def get_all_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Resume).filter(Resume.user_id == current_user.id).all()


@router.get("/{resume_id}", response_model=ResumeResponseModel)
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    return resume


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    version_ids = [
        version_id for (version_id,) in db.query(ResumeVersion.id).filter(
            ResumeVersion.resume_id == resume.id,
            ResumeVersion.user_id == current_user.id,
        ).all()
    ]
    if version_ids:
        db.query(GitHubEvidence).filter(
            GitHubEvidence.user_id == current_user.id,
            GitHubEvidence.resume_version_id.in_(version_ids),
        ).delete(synchronize_session=False)
        db.query(ResumeVersion).filter(
            ResumeVersion.user_id == current_user.id,
            ResumeVersion.id.in_(version_ids),
        ).delete(synchronize_session=False)

    db.query(MatchResult).filter(
        MatchResult.user_id == current_user.id,
        MatchResult.resume_id == resume.id,
    ).delete(synchronize_session=False)
    db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.resume_id == resume.id,
    ).update({Application.resume_id: None}, synchronize_session=False)

    stored_filename = resume.stored_filename or f"{resume.id}.pdf"
    db.delete(resume)
    db.commit()
    (RESUME_DIR / Path(stored_filename).name).unlink(missing_ok=True)
    return {
        "message": "Resume and its derived analysis were deleted successfully.",
        "deleted_version_count": len(version_ids),
    }
