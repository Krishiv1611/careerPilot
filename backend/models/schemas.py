from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ResumeResponseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: int
    user_name: str | None = None
    raw_text: str
    extracted_skills: list[str] | None = None
    skill_categories: dict[str, list[str]] | None = None
    resume_category: str | None = None
    career_track_suggestions: list[dict[str, Any]] = Field(default_factory=list)
    experience: str | None = None
    education: str | None = None
    original_filename: str | None = None
    file_type: str = "pdf"
    stored_filename: str | None = None
    created_at: datetime


class JobResponseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    company: str
    location: str | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    skills: list[str] | None = None
    description: str | None = None
    salary_range: str | None = None
    url: str | None = None
    posted_date: date | None = None
    source: str | None = None
    verification_status: str = "stored"
    fetched_at: datetime | None = None
    user_state: str | None = None
    job_health: dict[str, Any] | None = None


class ApplicationCreateModel(BaseModel):
    job_id: str
    resume_id: str | None = None
    resume_version_id: str | None = None
    confirmed: bool = False


class ApplicationStatusUpdateModel(BaseModel):
    status: str
    next_action: str | None = None
    notes: str | None = None
    deadline: datetime | None = None
    follow_up_at: datetime | None = None


class ApplicationDetailsUpdateModel(BaseModel):
    next_action: str | None = None
    notes: str | None = None
    deadline: datetime | None = None
    follow_up_at: datetime | None = None


class ApplicationResponseModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: int
    resume_id: str | None = None
    resume_version_id: str | None = None
    job_id: str
    status: str
    status_source: str
    next_action: str | None = None
    deadline: datetime | None = None
    follow_up_at: datetime | None = None
    notes: str | None = None
    timeline: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
