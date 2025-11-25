# backend/routers/resume_router.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from models.database import get_db
from models.resume_model import Resume
from models.schemas import ResumeResponseModel
from services.pdf_reader import PDFReader
from services.text_cleaner import TextCleaner
from services.skill_extractor import SkillExtractor
import os

from models.user_model import User
from utils.auth import get_current_user

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponseModel)
async def upload_resume(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are allowed.")

    file_id = str(uuid4())
    file_path = f"backend/data/resumes/{file_id}.pdf"

    # Save file
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Extract text
    reader = PDFReader()
    raw_text = reader.extract_text(file_path)
    cleaned = TextCleaner.clean_text(raw_text)

    # Extract Skills
    extractor = SkillExtractor()
    extracted_skills, skill_categories = extractor.extract_skills(cleaned)

    # Save in DB
    resume = Resume(
        id=file_id,
        user_id=current_user.id, # Link to user
        user_name=current_user.full_name,
        raw_text=cleaned,
        extracted_skills=extracted_skills,
        skill_categories=skill_categories,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("/all", response_model=list[ResumeResponseModel])
def get_all_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Filter by current user
    return db.query(Resume).filter(Resume.user_id == current_user.id).all()


@router.get("/{resume_id}", response_model=ResumeResponseModel)
def get_resume(
    resume_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    return resume


@router.delete("/{resume_id}")
def delete_resume(
    resume_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Ensure resume belongs to user
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Delete file
    file_path = f"backend/data/resumes/{resume.id}.pdf"
    if os.path.exists(file_path):
        os.remove(file_path)

    db.delete(resume)
    db.commit()

    return {"message": "Resume deleted successfully"}
