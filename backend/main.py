# backend/main.py

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()


from routers.resume_router import router as resume_router
from routers.job_router import router as job_router
from routers.application_router import router as application_router
from routers.careerpilot_router import router as careerpilot_router

from models.database import Base, engine


# ==========================================================
# 1. Create database tables
# ==========================================================
Base.metadata.create_all(bind=engine)


# ==========================================================
# 2. Initialize FastAPI app
# ==========================================================
app = FastAPI(
    title="CareerPilot AI Backend",
    version="1.0.0",
    description="Agentic Job Search + Resume Improvement System using LangGraph + Gemini"
)


# ==========================================================
# 3. CORS settings (adjust for production)
# ==========================================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # For development; restrict later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# 4. Ensure required folders exist
# ==========================================================
def ensure_directories():
    dirs = [
        "backend/data/resumes",
        "backend/data/vectorstore/chroma",
        "backend/data/jobs",
    ]

    for d in dirs:
        path = os.path.join(os.getcwd(), d)
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)

ensure_directories()


# ==========================================================
# 5. Register Routers
# ==========================================================
app.include_router(resume_router)
app.include_router(job_router)
app.include_router(application_router)
app.include_router(careerpilot_router)


# ==========================================================
# 6. Root endpoint
# ==========================================================
@app.get("/")
def root():
    return {"message": "CareerPilot AI Backend is running!"}
