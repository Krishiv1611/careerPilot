# backend/routers/resume_router.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from models.database import get_db
from models.resume_model import Resume
from models.schemas import ResumeResponseModel
from services.pdf_reader import PDFReader
from services.text_cleaner import TextCleaner

router = APIRouter(prefix="/resume", tags=["Resume"])


@router.post("/upload", response_model=ResumeResponseModel)
async def upload_resume(file: UploadFile = File(...), db: Session = Depends(get_db)):
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

    # Save in DB
    resume = Resume(
        id=file_id,
        raw_text=cleaned,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return resume


@router.get("/{resume_id}", response_model=ResumeResponseModel)
def get_resume(resume_id: str, db: Session = Depends(get_db)):
    resume = db.query(Resume).filter(Resume.id == resume_id).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    return resume
