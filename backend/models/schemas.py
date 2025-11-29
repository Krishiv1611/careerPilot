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
    ats_score: Optional[float] = None
    ats_report: Optional[str] = None


class ResumeResponseModel(ResumeCreateModel):
    id: str
    user_id: int
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
    user_id: int
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
    use_serpapi: Optional[bool] = False  # Flag to use SerpAPI for job search
    use_tavily: Optional[bool] = False   # Flag to use Tavily for job search
    google_api_key: Optional[str] = None
    serpapi_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    
    # Optional intermediate data to skip steps
    resume_text: Optional[str] = None
    extracted_skills: Optional[List[str]] = None
    skill_categories: Optional[Dict[str, List[str]]] = None
    job_description: Optional[str] = None


class CareerPilotResponse(BaseModel):
    # Resume
    resume_text: Optional[str] = None
    extracted_skills: Optional[List[str]] = None
    skill_categories: Optional[Dict[str, List[str]]] = None

    # Job
    job_id: Optional[str] = None
    job_description: Optional[str] = None
    job_skills: Optional[List[str]] = None
    job_metadata: Optional[Dict[str, Any]] = None

    # ATS Scores
    missing_skills: Optional[List[str]] = None
    skill_match_score: Optional[float] = None
    overall_fit_score: Optional[float] = None
    fit_explanation: Optional[str] = None
    ats_score: Optional[float] = None
    ats_report: Optional[str] = None

    # AI Outputs
    improved_resume: Optional[str] = None
    cover_letter: Optional[str] = None

    # Result
    application_id: Optional[str] = None
    timestamp: Optional[str] = None
    
    # Additional fields for search results
    recommended_jobs: Optional[List[Dict[str, Any]]] = None
    serpapi_error: Optional[str] = None
    serpapi_warning: Optional[str] = None


    class Config:
        extra = "allow"  # Allow extra fields that might be in the state


# ==========================================================
# API Key Management Schemas
# ==========================================================
class APIKeysUpdate(BaseModel):
    google_api_key: Optional[str] = None
    serpapi_api_key: Optional[str] = None


class APIKeysStatus(BaseModel):
    has_google_key: bool
    has_serpapi_key: bool


# ==========================================================
# Auth Schemas
# ==========================================================
class UserSignup(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    
    class Config:
        orm_mode = True
