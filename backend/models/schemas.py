# backend/models/schemas.py

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date


# ==========================================================
# Resume Schemas
# ==========================================================
class ResumeCreateModel(BaseModel):
    user_name: Optional[str] = None
    raw_text: str
    extracted_skills: Optional[List[str]] = None
    skill_categories: Optional[Dict[str, List[str]]] = None
    experience: Optional[str] = None
    education: Optional[str] = None


class ResumeResponseModel(ResumeCreateModel):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True


# ==========================================================
# Job Schemas
# ==========================================================
class JobCreateModel(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[List[str]] = None          # stored as JSON list
    description: Optional[str] = None
    salary_range: Optional[str] = None
    url: Optional[str] = None
    posted_date: Optional[date] = None


class JobResponseModel(JobCreateModel):
    id: str

    class Config:
        orm_mode = True


# ==========================================================
# Application Schemas (ATS Scores)
# ==========================================================
class ApplicationCreateModel(BaseModel):
    resume_id: str
    job_id: str

    overall_fit_score: float                     # LLM final score
    skill_match_score: Optional[float] = None
    missing_skills: Optional[List[str]] = None   # JSON list
    fit_explanation: Optional[str] = None        # LLM explanation
    ats_score: Optional[float] = None            # optional ATS score


class ApplicationResponseModel(ApplicationCreateModel):
    id: str
    created_at: datetime

    class Config:
        orm_mode = True


# ==========================================================
# Pipeline (Agentic Workflow) Schemas
# ==========================================================
class CareerPilotRequest(BaseModel):
    resume_id: str                  # path or resume DB ID
    job_id: Optional[str] = None
    search_query: Optional[str] = None


class CareerPilotResponse(BaseModel):
    # Resume
    resume_text: Optional[str]
    extracted_skills: Optional[List[str]]
    skill_categories: Optional[Dict[str, List[str]]]

    # Job
    job_id: Optional[str]
    job_description: Optional[str]
    job_skills: Optional[List[str]]
    job_metadata: Optional[Dict[str, Any]]

    # ATS Scores
    missing_skills: Optional[List[str]]
    skill_match_score: Optional[float]
    overall_fit_score: Optional[float]
    fit_explanation: Optional[str]

    # AI Outputs
    improved_resume: Optional[str]
    cover_letter: Optional[str]

    # Result
    application_id: Optional[str]
    timestamp: Optional[str]

