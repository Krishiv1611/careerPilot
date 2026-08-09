from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from .database import Base


class GitHubConnection(Base):
    __tablename__ = "github_connections"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    installation_id = Column(String, nullable=False, unique=True)
    account_login = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
