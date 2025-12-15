import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()

from routers.resume_router import router as resume_router
from routers.job_router import router as job_router
from routers.application_router import router as application_router
from routers.careerpilot_router import router as careerpilot_router
from routers.auth_router import router as auth_router
from routers.settings_router import router as settings_router
from routers.roadmap_router import router as roadmap_router
from routers.manual_analysis_router import router as manual_analysis_router

from models.database import Base, engine
from models.user_model import User # Import to ensure table creation

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
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# 4. Ensure required folders exist
# ==========================================================
def ensure_directories():
    # Get absolute path to backend directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    dirs = [
        os.path.join(base_dir, "data", "resumes"),
        os.path.join(base_dir, "data", "vectorstore", "chroma"),
        os.path.join(base_dir, "data", "jobs"),
    ]

    for path in dirs:
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)

ensure_directories()


# ==========================================================
# 5. Register Routers
# ==========================================================
app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(resume_router)
app.include_router(job_router)
app.include_router(application_router)
app.include_router(careerpilot_router)
app.include_router(roadmap_router)
app.include_router(manual_analysis_router)


# ==========================================================
# 6. Root endpoint
# ==========================================================
@app.get("/")
def root():
    return {"message": "CareerPilot AI Backend is running!"}
