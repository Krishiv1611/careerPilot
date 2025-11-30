# backend/models/roadmap_model.py

from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    
    # Content will store the structured roadmap (list of steps/milestones)
    content = Column(JSON, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="roadmaps")
    job = relationship("Job") # One-way relationship to Job is sufficient for now
