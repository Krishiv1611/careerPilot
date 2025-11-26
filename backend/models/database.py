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
# SQLite Connection URL
# ==========================================================
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

# ==========================================================
# SQLAlchemy Engine & Session
# ==========================================================
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}  # needed for SQLite
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





