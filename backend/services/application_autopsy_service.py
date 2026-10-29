import re

GROWTH_BLUEPRINTS = {
    "docker": {
        "title": "Production Docker & Containerization Blueprint",
        "slug": "docker-microservice-blueprint",
        "growth_url": "/growth?skill=docker",
    },
    "kubernetes": {
        "title": "Kubernetes Cluster Orchestration Blueprint",
        "slug": "kubernetes-orchestration-blueprint",
        "growth_url": "/growth?skill=kubernetes",
    },
    "fastapi": {
        "title": "High-Throughput Async FastAPI Architecture",
        "slug": "fastapi-async-blueprint",
        "growth_url": "/growth?skill=fastapi",
    },
    "redis": {
        "title": "Distributed Caching & Redis Optimization",
        "slug": "redis-distributed-caching-blueprint",
        "growth_url": "/growth?skill=redis",
    },
    "postgresql": {
        "title": "PostgreSQL Indexing & Performance Tuning",
        "slug": "postgresql-performance-blueprint",
        "growth_url": "/growth?skill=postgresql",
    },
    "testing": {
        "title": "Automated Testing & CI/CD Pipeline Blueprint",
        "slug": "cicd-testing-blueprint",
        "growth_url": "/growth?skill=testing",
    },
}


def run_application_autopsy(
    resume_text: str,
    job_description: str,
    rejection_feedback: str = "",
    status: str = "rejected",
) -> dict:
    resume_lower = (resume_text or "").lower()
    jd_lower = (job_description or "").lower()

    status_clean = (status or "rejected").strip().lower()
    is_rejected = status_clean in ("rejected", "withdrawn", "ghosted")
    mode = "post_mortem" if is_rejected else "pre_mortem"
    severity = "CRITICAL" if is_rejected else "HIGH"

    missing_skill = "docker"
    recommended_bp = dict(GROWTH_BLUEPRINTS["docker"])

    # Identify critical JD requirement missing from resume
    for key, bp in GROWTH_BLUEPRINTS.items():
        if key in jd_lower and key not in resume_lower:
            missing_skill = key
            recommended_bp = dict(bp)
            break

    severity_tag = "FATAL" if is_rejected else ("HIGH_RISK" if missing_skill in jd_lower else "MODERATE_RISK")

    if mode == "post_mortem":
        fatal_blocker = f"Missing core requirement: {missing_skill.upper()} was mandated by the JD but absent on resume"
        why_it_disqualified = (
            rejection_feedback
            if rejection_feedback
            else "Automated ATS parsers scored the resume below keyword threshold, triggering automated recruiter reject filter."
        )
    else:
        fatal_blocker = f"Pre-Mortem Risk: {missing_skill.upper()} is mandated by the JD but absent from your resume"
        why_it_disqualified = (
            "Pre-mortem risk detected: High probability of automated ATS or recruiter rejection due to missing mandatory qualification before technical screen."
        )

    recommended_bp["growth_url"] = f"/growth?skill={missing_skill}"

    return {
        "mode": mode,
        "severity": severity,
        "severity_tag": severity_tag,
        "missing_skill": missing_skill,
        "fatal_blocker": fatal_blocker,
        "why_it_disqualified": why_it_disqualified,
        "recommended_blueprint": recommended_bp,
        "recovery_time_hours": 48,
        "actionable_fix_steps": [
            f"1. Complete the 48-hour {recommended_bp['title']} in CareerPilot Growth Studio.",
            "2. Push verified GitHub code repository with README and test suite.",
            "3. Click 'Verify Evidence' to permanently clear this gap from future applications.",
        ],
    }
