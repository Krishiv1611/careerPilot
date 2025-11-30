# backend/routers/roadmap_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from pydantic import BaseModel
from typing import List, Optional

from models.database import get_db
from models.roadmap_model import Roadmap
from models.job_model import Job
from models.resume_model import Resume
from models.user_model import User
from models.schemas import RoadmapRequest, RoadmapResponse
from utils.auth import get_current_user
from agents.roadmap_agent import generate_roadmap

router = APIRouter(prefix="/roadmap", tags=["Roadmap"])

@router.post("/create", response_model=RoadmapResponse)
def create_roadmap(
    request: RoadmapRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Check if roadmap already exists for this user + job
    existing_roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.job_id == request.job_id
    ).first()

    if existing_roadmap:
        return {
            "id": existing_roadmap.id,
            "job_id": existing_roadmap.job_id,
            "content": existing_roadmap.content["roadmap"], # specific structure from agent
            "created_at": str(existing_roadmap.created_at)
        }

    # 2. Fetch Job and Resume data
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    resume = db.query(Resume).filter(Resume.id == request.resume_id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # 3. Generate Roadmap using Agent
    try:
        # Use job description if available, otherwise title + skills
        job_context = job.description if job.description else f"{job.title} at {job.company}. Skills: {job.skills}"
        
        agent_result = generate_roadmap(
            resume_text=resume.raw_text,
            job_description=job_context,
            google_api_key=request.google_api_key
        )
        
        # agent_result is expected to be {'roadmap': [...]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate roadmap: {str(e)}")

    # 4. Save to DB
    roadmap_id = str(uuid4())
    new_roadmap = Roadmap(
        id=roadmap_id,
        user_id=current_user.id,
        job_id=request.job_id,
        content=agent_result
    )
    
    db.add(new_roadmap)
    db.commit()
    db.refresh(new_roadmap)

    return {
        "id": new_roadmap.id,
        "job_id": new_roadmap.job_id,
        "content": new_roadmap.content["roadmap"],
        "created_at": str(new_roadmap.created_at)
    }

@router.get("/{job_id}", response_model=Optional[RoadmapResponse])
def get_roadmap(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roadmap = db.query(Roadmap).filter(
        Roadmap.user_id == current_user.id,
        Roadmap.job_id == job_id
    ).first()

    if not roadmap:
        return None

    return {
        "id": roadmap.id,
        "job_id": roadmap.job_id,
        "content": roadmap.content["roadmap"],
        "created_at": str(roadmap.created_at)
    }
