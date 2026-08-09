from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String

from .database import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    target_roles = Column(JSON, nullable=False, default=list)
    preferred_locations = Column(JSON, nullable=False, default=list)
    employment_types = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
