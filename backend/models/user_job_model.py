from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from .database import Base


class UserJob(Base):
    __tablename__ = "user_jobs"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_user_jobs_user_job"),
    )

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    state = Column(String, nullable=False, default="discovered")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
