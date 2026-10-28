from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint

from .database import Base


class GrowthPriority(Base):
    __tablename__ = "growth_priorities"
    __table_args__ = (
        UniqueConstraint("user_id", "skill", name="uq_growth_priorities_user_skill"),
    )

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill = Column(String, nullable=False)
    job_count = Column(Integer, nullable=False, default=1)
    next_action = Column(Text, nullable=False)
    completion_rule = Column(Text, nullable=False)
    blueprint_title = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active")
    completion_source = Column(String, nullable=True)
    evidence_url = Column(Text, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
