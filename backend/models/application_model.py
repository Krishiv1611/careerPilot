# backend/models/application_model.py

from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True)

    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)

    overall_fit_score = Column(Float, nullable=False)
    skill_match_score = Column(Float, nullable=True)
    missing_skills = Column(JSON, nullable=True)         # LIST
    fit_explanation = Column(Text, nullable=True)

    ats_score = Column(Float, nullable=True)             # Optional ATS score

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="applications")
    job = relationship("Job", back_populates="applications")



