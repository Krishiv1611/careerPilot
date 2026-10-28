from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String

from .database import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    eligible = Column(Boolean, nullable=False)
    eligibility_status = Column(String, nullable=False)
    eligibility_reasons = Column(JSON, nullable=False, default=list)
    coverage_percent = Column(Float, nullable=False)
    requirements = Column(JSON, nullable=False, default=list)
    matched_skills = Column(JSON, nullable=False, default=list)
    missing_skills = Column(JSON, nullable=False, default=list)
    must_have_skills = Column(JSON, nullable=False, default=list)
    missing_must_haves = Column(JSON, nullable=False, default=list)
    hard_blockers = Column(JSON, nullable=False, default=list)
    preferred_gaps = Column(JSON, nullable=False, default=list)
    ats_score = Column(Float, nullable=True)
    ats_diagnostic = Column(JSON, nullable=True, default=dict)
    evidence_map = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
