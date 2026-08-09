# backend/models/resume_model.py

from sqlalchemy import Column, String, Text, DateTime, JSON, Integer, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_name = Column(String, nullable=True)
    raw_text = Column(Text, nullable=False)

    extracted_skills = Column(JSON, nullable=True)       # LIST
    skill_categories = Column(JSON, nullable=True)       # DICT
    
    ats_score = Column(Float, nullable=True)
    ats_report = Column(Text, nullable=True)

    resume_category = Column(String, nullable=True)
    career_track_suggestions = Column(JSON, nullable=False, default=list)

    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    original_filename = Column(String, nullable=True)
    file_type = Column(String, nullable=False, default="pdf")
    stored_filename = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship (resume → applications)
    applications = relationship("Application", back_populates="resume")


