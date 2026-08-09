# backend/models/application_model.py

from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    resume_id = Column(String, ForeignKey("resumes.id"), nullable=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)

    status = Column(String, nullable=False, default="Saved")
    status_source = Column(String, nullable=False, default="user")
    next_action = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    follow_up_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    timeline = Column(JSON, nullable=False, default=list)

    overall_fit_score = Column(Float, nullable=True)
    skill_match_score = Column(Float, nullable=True)
    missing_skills = Column(JSON, nullable=True)         # LIST
    fit_explanation = Column(Text, nullable=True)

    ats_score = Column(Float, nullable=True)             # Optional ATS score

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="applications")
    job = relationship("Job", back_populates="applications")



