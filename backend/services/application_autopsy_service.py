import re

GROWTH_BLUEPRINTS = {
    "docker": {
        "title": "Production Docker & Containerization Blueprint",
        "slug": "docker-microservice-blueprint",
    },
    "kubernetes": {
        "title": "Kubernetes Cluster Orchestration Blueprint",
        "slug": "kubernetes-orchestration-blueprint",
    },
    "fastapi": {
        "title": "High-Throughput Async FastAPI Architecture",
        "slug": "fastapi-async-blueprint",
    },
    "redis": {
        "title": "Distributed Caching & Redis Optimization",
        "slug": "redis-distributed-caching-blueprint",
    },
    "postgresql": {
        "title": "PostgreSQL Indexing & Performance Tuning",
        "slug": "postgresql-performance-blueprint",
    },
    "testing": {
        "title": "Automated Testing & CI/CD Pipeline Blueprint",
        "slug": "cicd-testing-blueprint",
    },
}


def run_application_autopsy(resume_text: str, job_description: str, rejection_feedback: str = "") -> dict:
    resume_lower = (resume_text or "").lower()
    jd_lower = (job_description or "").lower()

    fatal_blocker = "Missing required production framework"
    recommended_bp = GROWTH_BLUEPRINTS["docker"]

    # Identify critical JD requirement missing from resume
    for key, bp in GROWTH_BLUEPRINTS.items():
        if key in jd_lower and key not in resume_lower:
            fatal_blocker = f"Missing core requirement: {key.upper()} was mandated by the JD but absent on resume"
            recommended_bp = bp
            break

    return {
        "fatal_blocker": fatal_blocker,
        "why_it_disqualified": (
            "Automated ATS parsers scored the resume below keyword threshold, "
            "triggering automated recruiter reject filter."
        ),
        "recommended_blueprint": recommended_bp,
        "recovery_time_hours": 48,
        "actionable_fix_steps": [
            f"1. Complete the 48-hour {recommended_bp['title']} in CareerPilot Growth Studio.",
            "2. Push verified GitHub code repository with README and test suite.",
            "3. Click 'Verify Evidence' to permanently clear this gap from future applications.",
        ],
    }
