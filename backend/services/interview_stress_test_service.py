import re

DRILL_DOWN_TEMPLATES = [
    {
        "trigger": r"optimized|reduced|improved|latency|throughput",
        "question": "You claim you optimized performance. What exact profiling tool (e.g. cProfile, pg_stat_statements) did you use to isolate the bottleneck? How did you isolate network overhead from query execution time?",
        "what_tests": "Whether the metric is genuine or AI-hallucinated without measurement instrumentation.",
        "defense": "Specify your baseline latency, the profiling tool used, the architectural bottleneck (e.g. unindexed foreign keys or N+1 query), and the exact remediation.",
    },
    {
        "trigger": r"docker|container|microservices",
        "question": "In your containerized microservices, how did you handle multi-stage builds and secret management? How did your containers communicate across local and deployed networks?",
        "what_tests": "Production readiness vs simple 'docker run' tutorial knowledge.",
        "defense": "Explain multi-stage Dockerfile layers for minimal image size, non-root user permissions, and environment variable injection via secrets.",
    },
    {
        "trigger": r"fastapi|rest api|endpoints",
        "question": "How did you manage database connection pooling and asynchronous request concurrency under load in your FastAPI service?",
        "what_tests": "Concurrency comprehension and async/await event loop mechanics.",
        "defense": "Cite SQLAlchemy async sessions, connection pool limits, and how blocking I/O was offloaded to background threads or Celery.",
    },
    {
        "trigger": r"postgresql|sql|database",
        "question": "What index type did you choose for your PostgreSQL tables (B-tree, Hash, GIN), and how did EXPLAIN ANALYZE confirm query execution plan improvements?",
        "what_tests": "Deep relational database internals vs surface-level ORM usage.",
        "defense": "Walk through EXPLAIN ANALYZE cost output, sequential scan elimination, and composite indexing tradeoffs.",
    },
    {
        "trigger": r"kubernetes|k8s|orchestration",
        "question": "How did you define your Kubernetes resource requests, limits, and liveness/readiness probes to prevent cascading OOMKilled crashes?",
        "what_tests": "Real cluster operations vs copying boilerplate Helm charts.",
        "defense": "Describe how you benchmarked pod memory usage under synthetic load, set soft requests vs hard limits, and configured probe initial delays.",
    },
    {
        "trigger": r"redis|cache|caching",
        "question": "When caching with Redis, what TTL eviction policy and cache invalidation pattern (cache-aside, write-through) did you implement to handle stale reads and thundering herds?",
        "what_tests": "Distributed caching consistency and stampede failure mitigation.",
        "defense": "Detail your cache invalidation hooks, probabilistic early expiration to avoid thundering herds, and Redis key namespacing.",
    },
]


def generate_resume_defense_matrix(resume_text: str, job_description: str, company: str = "") -> dict:
    text = resume_text or ""
    text_lower = text.lower()
    questions = []

    for template in DRILL_DOWN_TEMPLATES:
        if re.search(template["trigger"], text_lower):
            # Find context line
            lines = [l.strip() for l in text.splitlines() if re.search(template["trigger"], l.lower())]
            claim = lines[0] if lines else "Resume technical capability claim"
            questions.append({
                "claim": claim,
                "question": template["question"],
                "what_interviewer_tests": template["what_tests"],
                "candidate_defense_blueprint": template["defense"],
            })

    if not questions:
        questions.append({
            "claim": "General engineering project experience",
            "question": "Walk me through the single most difficult bug you encountered in this project. What was the hypothesis, how did you verify it, and what did you learn?",
            "what_interviewer_tests": "Systematic debugging method and engineering resilience.",
            "candidate_defense_blueprint": "Use the STAR framework: Situation -> Root Cause Hypothesis -> Instrument with logs -> Fix -> Regression test.",
        })

    return {
        "interrogation_level": "Aggressive Senior Technical Screen",
        "company": company or "Target Company",
        "drill_down_questions": questions[:5],
        "defense_confidence_score": 85 if len(questions) >= 3 else 65,
    }
