import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. This application requires PostgreSQL.")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

is_postgresql = DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+")
sqlite_test_override = (
    DATABASE_URL.startswith("sqlite:")
    and os.getenv("CAREERPILOT_ALLOW_SQLITE_FOR_TESTS", "false").lower() == "true"
)
if not is_postgresql and not sqlite_test_override:
    raise ValueError(
        "CareerPilot runtime requires PostgreSQL. "
        "SQLite is allowed only for isolated tests with CAREERPILOT_ALLOW_SQLITE_FOR_TESTS=true."
    )

SQLALCHEMY_DATABASE_URL = DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
