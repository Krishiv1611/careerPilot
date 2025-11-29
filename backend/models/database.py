# backend/models/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ==========================================================
# Ensure database folder exists
# ==========================================================
# Get the directory of the current file (backend/models)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up one level to backend/
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
BASE_PATH = os.path.join(BACKEND_DIR, "data", "database")

if not os.path.exists(BASE_PATH):
    os.makedirs(BASE_PATH, exist_ok=True)

DB_FILE = os.path.join(BASE_PATH, "careerpilot.db")

# ==========================================================
# Database Connection Logic (PostgreSQL ONLY)
# ==========================================================
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set. This application requires PostgreSQL.")

# Handle "postgres://" vs "postgresql://" for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URL = DATABASE_URL

# ==========================================================
# SQLAlchemy Engine & Session
# ==========================================================
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ==========================================================
# DB Dependency (used in routers)
# ==========================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()





