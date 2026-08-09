from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text

from .database import Base


class GitHubEvidence(Base):
    __tablename__ = "github_evidence"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_version_id = Column(String, ForeignKey("resume_versions.id"), nullable=False, index=True)
    repository = Column(String, nullable=False)
    evidence = Column(JSON, nullable=False)
    approval_status = Column(String, nullable=False, default="pending")
    student_contribution = Column(Text, nullable=True)
    approved_wording = Column(Text, nullable=True)
    approved_skills = Column(JSON, nullable=False, default=list)
    outcome = Column(Text, nullable=True)
    proposal_version_id = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
