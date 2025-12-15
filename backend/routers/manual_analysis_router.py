from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from models.database import get_db
from models.user_model import User
from models.resume_model import Resume
from routers.auth_router import get_current_user
from agents.graph import build_careerpilot_graph

router = APIRouter(
    prefix="/manual-analysis",
    tags=["Manual Analysis"]
)

class ManualAnalysisRequest(BaseModel):
    manual_jd_text: str
    resume_id: Optional[int] = None
    resume_text: Optional[str] = None

@router.post("/analyze")
async def analyze_manual_jd(
    request: ManualAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Run the analysis graph with a manually provided JD.
    Can use an existing resume_id or provided resume_text.
    """
    
    # 1. Resolve Resume Text
    resume_text = request.resume_text
    
    if not resume_text:
        # Try to fetch from DB
        if request.resume_id:
            # Verify ownership
            resume = db.query(Resume).filter(
                Resume.id == request.resume_id,
                Resume.user_id == current_user.id
            ).first()
            if not resume:
                raise HTTPException(status_code=404, detail="Resume not found")
            resume_text = resume.content_text
        else:
            # Try to get latest resume for user
            fetch_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).first()
            if fetch_resume:
                resume_text = fetch_resume.content_text
            else:
                 raise HTTPException(status_code=400, detail="No resume provided or found for this user.")

    # 2. Build State
    # Note: We don't have a job_id, but the updated graph logic handles 'manual_jd_text'
    state = {
        "resume_text": resume_text,
        "manual_jd_text": request.manual_jd_text, 
        "user_id": current_user.id,
        "db": db,
        "google_api_key": current_user.google_api_key  # Ensure user has configured this
    }

    if not state["google_api_key"]:
         raise HTTPException(status_code=400, detail="Google API Key is missing. Please configure it in settings.")

    # 3. Run Graph
    app = build_careerpilot_graph()
    result = app.invoke(state)
    
    # 4. Extract Results
    return {
        "improved_resume": result.get("improved_resume"),
        "fit_score": result.get("fit_score_data"), # Check actual key in graph/agent
        "missing_skills": result.get("missing_skills"),
        "job_skills": result.get("job_skills"), 
        # Add other relevant fields if needed
    }
