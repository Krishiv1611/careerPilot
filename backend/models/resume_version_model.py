from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text

from .database import Base


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resume_id = Column(String, ForeignKey("resumes.id"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True, index=True)

    job_description = Column(Text, nullable=False)
    base_content = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    changes = Column(JSON, nullable=False, default=list)
    approval_status = Column(String, nullable=False, default="draft")
    source_version_id = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    requirements = Column(JSON, nullable=False, default=list)
    matched_skills = Column(JSON, nullable=False, default=list)
    missing_skills = Column(JSON, nullable=False, default=list)
    evidence_map = Column(JSON, nullable=False, default=dict)
    project_suggestions = Column(JSON, nullable=False, default=list)
    prompt_history = Column(JSON, nullable=False, default=list)
    template_mode = Column(String, nullable=False, default="clean_pdf")
    created_at = Column(DateTime, default=datetime.utcnow)
