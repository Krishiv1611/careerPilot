import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers.application_router import router as application_router
from routers.auth_router import router as auth_router
from routers.discovery_router import router as discovery_router
from routers.github_router import router as github_router
from routers.growth_router import router as growth_router
from routers.job_router import router as job_router
from routers.match_router import router as match_router
from routers.profile_router import router as profile_router
from routers.resume_router import router as resume_router
from routers.resume_studio_router import router as resume_studio_router
from routers.today_router import router as today_router


app = FastAPI(
    title="CareerPilot API",
    version="2.0.0",
    description="Student-first job discovery, evidence matching, resume tailoring, and application tracking.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000",
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

(Path(__file__).resolve().parent / "data" / "resumes").mkdir(parents=True, exist_ok=True)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(discovery_router)
app.include_router(job_router)
app.include_router(match_router)
app.include_router(resume_studio_router)
app.include_router(github_router)
app.include_router(application_router)
app.include_router(growth_router)
app.include_router(today_router)


@app.get("/")
def root():
    return {"message": "CareerPilot API is running."}
