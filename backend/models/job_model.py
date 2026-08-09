# backend/models/job_model.py

from sqlalchemy import Column, String, Text, Date, DateTime, JSON
from sqlalchemy.orm import relationship
from .database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)

    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=True)

    employment_type = Column(String, nullable=True)
    experience_level = Column(String, nullable=True)

    skills = Column(JSON, nullable=True)         # LIST
    description = Column(Text, nullable=True)

    salary_range = Column(String, nullable=True)
    url = Column(String, nullable=True)
    posted_date = Column(Date, nullable=True)
    source = Column(String, nullable=True) # e.g. "Google Jobs", "Tavily", "Internal"
    verification_status = Column(String, nullable=False, default="stored")
    fetched_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship (job → applications)
    applications = relationship("Application", back_populates="job")





