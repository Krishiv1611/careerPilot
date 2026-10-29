import re

DRILL_DOWN_TEMPLATES = [
    {
        "trigger": r"optimized|reduced|improved|latency|throughput",
        "question": "You claim you optimized performance. What exact profiling tool (e.g. cProfile, pg_stat_statements) did you use to isolate the bottleneck? How did you isolate network overhead from query execution time?",
        "what_tests": "Whether the metric is genuine or AI-hallucinated without measurement instrumentation.",
        "defense": "Specify your baseline latency, the profiling tool used, the architectural bottleneck (e.g. unindexed foreign keys or N+1 query), and the exact EXPLAIN ANALYZE remediation.",
        "code_snippet": (
            "-- Benchmark query plan before and after composite indexing\n"
            "EXPLAIN (ANALYZE, BUFFERS, TIMING)\n"
            "SELECT u.id, u.email, o.total_cents, o.created_at\n"
            "FROM users u\n"
            "JOIN orders o ON o.user_id = u.id\n"
            "WHERE u.status = 'active'\n"
            "  AND o.created_at >= NOW() - INTERVAL '30 days'\n"
            "ORDER BY o.created_at DESC\n"
            "LIMIT 50;\n\n"
            "-- Remediation: Eliminate sequential table scans with composite B-tree index\n"
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_created\n"
            "ON orders (user_id, created_at DESC)\n"
            "INCLUDE (total_cents);"
        ),
        "model_answer": (
            "We observed our p99 API latency degraded to 420ms under peak load. Using pg_stat_statements "
            "and Datadog APM distributed traces, we isolated 78% of request duration to sequential scans on "
            "the unindexed orders table. Running EXPLAIN (ANALYZE, BUFFERS) confirmed high shared read block counts. "
            "We deployed a CONCURRENTLY created composite index on (user_id, created_at DESC), transforming the "
            "plan into an Index Only Scan and reducing p99 latency to 230ms (a 45% reduction) at 1,500 RPS."
        ),
    },
    {
        "trigger": r"docker|container|microservices",
        "question": "In your containerized microservices, how did you handle multi-stage builds and secret management? How did your containers communicate across local and deployed networks?",
        "what_tests": "Production readiness vs simple 'docker run' tutorial knowledge.",
        "defense": "Explain multi-stage Dockerfile layers for minimal image size, non-root user permissions, and environment variable injection via secrets.",
        "code_snippet": (
            "# Multi-stage production build for minimal attack surface\n"
            "FROM python:3.11-slim AS builder\n"
            "WORKDIR /app\n"
            "RUN apt-get update && apt-get install -y --no-install-recommends build-essential \\\n"
            "    && rm -rf /var/lib/apt/lists/*\n"
            "COPY requirements.txt .\n"
            "RUN pip install --no-cache-dir --prefix=/install -r requirements.txt\n\n"
            "# Final lean runtime image with non-root security context\n"
            "FROM python:3.11-slim AS runner\n"
            "WORKDIR /app\n"
            "RUN addgroup --system --gid 1001 appgroup && \\\n"
            "    adduser --system --uid 1001 --ingroup appgroup appuser\n"
            "COPY --from=builder /install /usr/local\n"
            "COPY --chown=appuser:appgroup ./app /app\n"
            "USER appuser\n"
            "EXPOSE 8000\n"
            "ENTRYPOINT [\"uvicorn\", \"main:app\", \"--host\", \"0.0.0.0\", \"--port\", \"8000\", \"--workers\", \"4\"]"
        ),
        "model_answer": (
            "In production, we implemented multi-stage Docker builds to decouple compiler dependencies from the "
            "shipping artifact, shrinking our image size from 1.1GB to 142MB. The runtime container executes as "
            "an unprivileged non-root user (UID 1001) with a read-only root filesystem. Secrets and credentials "
            "are injected dynamically via AWS Secrets Manager and IAM task execution roles rather than baked into layers."
        ),
    },
    {
        "trigger": r"fastapi|rest api|endpoints",
        "question": "How did you manage database connection pooling and asynchronous request concurrency under load in your FastAPI service?",
        "what_tests": "Concurrency comprehension and async/await event loop mechanics.",
        "defense": "Cite SQLAlchemy async sessions, connection pool limits, and how blocking I/O was offloaded to background threads or Celery.",
        "code_snippet": (
            "from fastapi import FastAPI, Depends\n"
            "from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession\n\n"
            "DATABASE_URL = 'postgresql+asyncpg://app_user:secret@pg-primary:5432/production_db'\n\n"
            "# Production-grade async connection pool setup\n"
            "engine = create_async_engine(\n"
            "    DATABASE_URL,\n"
            "    pool_size=20,          # Persistent connection pool\n"
            "    max_overflow=10,        # Burst capacity under peak spike\n"
            "    pool_timeout=30.0,      # Max wait time before shedding load\n"
            "    pool_recycle=1800,      # Recycle every 30m to mitigate dropped TCP sockets\n"
            "    pool_pre_ping=True,     # Heartbeat probe to discard dead connections\n"
            ")\n"
            "AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)\n\n"
            "async def get_db_session() -> AsyncSession:\n"
            "    async with AsyncSessionLocal() as session:\n"
            "        yield session"
        ),
        "model_answer": (
            "To prevent connection pool starvation during spike traffic, we configured SQLAlchemy's create_async_engine "
            "with asyncpg, pool_size=20, and max_overflow=10. We activated pool_pre_ping=True to purge silent TCP disconnects "
            "from AWS NLB idle timeouts. Any blocking CPU work like token hashing was offloaded via asyncio.to_thread, ensuring "
            "the ASGI event loop maintained an event latency under 12ms."
        ),
    },
    {
        "trigger": r"postgresql|sql|database",
        "question": "What index type did you choose for your PostgreSQL tables (B-tree, Hash, GIN), and how did EXPLAIN ANALYZE confirm query execution plan improvements?",
        "what_tests": "Deep relational database internals vs surface-level ORM usage.",
        "defense": "Walk through EXPLAIN ANALYZE cost output, sequential scan elimination, and composite indexing tradeoffs.",
        "code_snippet": (
            "-- Profile execution cost, buffer cache hits, and scan types\n"
            "EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\n"
            "SELECT o.id, o.amount, o.status, o.created_at\n"
            "FROM customer_orders o\n"
            "WHERE o.tenant_id = 'c8b4f17a-5e28-4e89-9a84'\n"
            "  AND o.status = 'PENDING'\n"
            "ORDER BY o.created_at ASC\n"
            "LIMIT 100;\n\n"
            "-- Targeted partial index matching query predicate exactly\n"
            "CREATE INDEX CONCURRENTLY idx_orders_active_pending\n"
            "ON customer_orders (tenant_id, created_at ASC)\n"
            "WHERE status = 'PENDING';"
        ),
        "model_answer": (
            "We used EXPLAIN (ANALYZE, BUFFERS) to diagnose high execution times on order reconciliation queries. "
            "The explain plan demonstrated that 95% of row scans were filtered out because completed orders dominated the "
            "50-million-row table. Rather than indexing the entire table, we built a partial index filtered specifically on "
            "WHERE status = 'PENDING'. This slashed index storage overhead by 92% and reduced query execution time from "
            "1.4 seconds to 3.8 milliseconds."
        ),
    },
    {
        "trigger": r"kubernetes|k8s|orchestration",
        "question": "How did you define your Kubernetes resource requests, limits, and liveness/readiness probes to prevent cascading OOMKilled crashes?",
        "what_tests": "Real cluster operations vs copying boilerplate Helm charts.",
        "defense": "Describe how you benchmarked pod memory usage under synthetic load, set soft requests vs hard limits, and configured probe initial delays.",
        "code_snippet": (
            "apiVersion: apps/v1\n"
            "kind: Deployment\n"
            "metadata:\n"
            "  name: api-service\n"
            "spec:\n"
            "  replicas: 4\n"
            "  template:\n"
            "    spec:\n"
            "      containers:\n"
            "      - name: api\n"
            "        image: api-service:v2.4.0\n"
            "        resources:\n"
            "          requests:\n"
            "            cpu: \"250m\"\n"
            "            memory: \"512Mi\"\n"
            "          limits:\n"
            "            cpu: \"1000m\"\n"
            "            memory: \"1Gi\"\n"
            "        livenessProbe:\n"
            "          httpGet:\n"
            "            path: /healthz\n"
            "            port: 8000\n"
            "          initialDelaySeconds: 15\n"
            "          periodSeconds: 10\n"
            "        readinessProbe:\n"
            "          httpGet:\n"
            "            path: /ready\n"
            "            port: 8000\n"
            "          initialDelaySeconds: 5\n"
            "          periodSeconds: 5"
        ),
        "model_answer": (
            "We established resource requests based on 95th-percentile synthetic load testing, specifying 250m CPU and "
            "512Mi memory per pod, while capping limits at 1000m and 1Gi to prevent noisy neighbors while guarding against "
            "OOMKilled evictions. We separated the /healthz liveness probe from the /ready readiness probe: readiness validates "
            "downstream database connectivity before ingesting ingress traffic, preventing 502 Bad Gateway responses during deployment rollouts."
        ),
    },
    {
        "trigger": r"redis|cache|caching",
        "question": "When caching with Redis, what TTL eviction policy and cache invalidation pattern (cache-aside, write-through) did you implement to handle stale reads and thundering herds?",
        "what_tests": "Distributed caching consistency and stampede failure mitigation.",
        "defense": "Detail your cache invalidation hooks, probabilistic early expiration to avoid thundering herds, and Redis key namespacing.",
        "code_snippet": (
            "import math\n"
            "import random\n"
            "import redis.asyncio as redis\n\n"
            "redis_client = redis.from_url('redis://redis-cluster:6379/0', decode_responses=True)\n\n"
            "async def get_with_probabilistic_recompute(key: str, ttl: int, beta: float = 1.0, fetch_func=None):\n"
            "    pipe = redis_client.pipeline()\n"
            "    pipe.get(key)\n"
            "    pipe.get(f'{key}:compute_time')\n"
            "    data, compute_time_val = await pipe.execute()\n"
            "    \n"
            "    compute_time = float(compute_time_val) if compute_time_val else 0.1\n"
            "    # XFetch probabilistic early renewal algorithm prevents thundering herd\n"
            "    if data:\n"
            "        remaining_ttl = await redis_client.ttl(key)\n"
            "        if remaining_ttl > 0 and -(compute_time * beta * math.log(random.random())) > remaining_ttl:\n"
            "            fresh_data = await fetch_func()\n"
            "            await redis_client.setex(key, ttl, fresh_data)\n"
            "            return fresh_data\n"
            "        return data\n"
            "    \n"
            "    fresh_data = await fetch_func()\n"
            "    await redis_client.setex(key, ttl, fresh_data)\n"
            "    return fresh_data"
        ),
        "model_answer": (
            "To defend against cache stampedes and thundering herds on hot keys, we adopted the XFetch probabilistic "
            "early expiration algorithm. When a cached item approaches expiration, background workers preemptively refresh "
            "the key based on calculation duration and random decay. Furthermore, all keys follow strict namespacing "
            "(app:tenant:v1:resource:id) with explicit TTLs to prevent memory leaks under volatile-lru eviction."
        ),
    },
]

DEFAULT_DRILL_DOWN = {
    "claim": "General engineering project experience",
    "question": "Walk me through the single most difficult bug you encountered in this project. What was the hypothesis, how did you verify it, and what did you learn?",
    "what_interviewer_tests": "Systematic debugging method, root cause analysis, and engineering resilience.",
    "candidate_defense_blueprint": "Use the STAR framework: Situation -> Root Cause Hypothesis -> Instrument with logs & traces -> Isolated Fix -> Regression test.",
    "code_defense_snippet": (
        "import logging\n"
        "import pytest\n\n"
        "logger = logging.getLogger('service.core')\n\n"
        "def test_reproduce_and_verify_regression_fix():\n"
        "    # 1. Setup exact boundary state reproducing edge bug\n"
        "    corrupted_payload = {'user_id': 404, 'currency': 'USD', 'items': []}\n"
        "    \n"
        "    # 2. Assert safe degraded behavior without unhandled 500 error\n"
        "    response = process_checkout_payload(corrupted_payload)\n"
        "    assert response.status_code == 422\n"
        "    assert response.error_code == 'EMPTY_CART_REJECTED'\n"
    ),
    "model_interview_answer": (
        "When resolving our hardest production bug—a race condition resulting in duplicate ledger credits—I first isolated "
        "the trigger using distributed trace IDs. I constructed an isolated unit test reproducing the concurrent write conflict. "
        "After confirming the failure, I implemented row-level SELECT FOR UPDATE locking with idempotency keys. Finally, I added a "
        "regression test in CI/CD and monitored metrics for zero duplicate events over the next 30 days."
    ),
}


def determine_vulnerability_rating(claim: str) -> str:
    """Classify the vulnerability of a resume claim to aggressive technical grilling.

    Claims with big uncontextualized metrics (e.g. 'reduced latency by 45%') are rated High Risk.
    Claims referencing architectural or distributed systems are rated Medium Risk.
    Claims backed by explicit verification or standard bounded practice are rated Rock Solid.
    """
    text = (claim or "").lower()

    # High Risk: Uncontextualized percentages, multipliers, or big numbers without methodology
    has_metrics = bool(re.search(r"\d+%\b|\d+x\b|\b\d+\s*(?:ms|s|sec|seconds?|min|k|m|million|billion|rps|req\/s)\b|\b(?:by|over|to)\s+\d+", text))
    has_perf_claims = bool(re.search(r"optim|reduc|slash|boost|increas|decreas|cut|speed|accelerat|improv", text))

    if has_metrics or (has_perf_claims and bool(re.search(r"\d+", text))):
        return "High Risk"

    # Rock Solid: Explicit verification, testing suites, observability, or standard documentation
    has_verification = bool(re.search(r"unit test|integration test|pytest|ci\/cd|observability|datadog|prometheus|grafana|type hints?|openapi|lint", text))
    if has_verification:
        return "Rock Solid"

    # Medium Risk: Infrastructure / architecture / distributed systems claims requiring deep defense
    has_arch = bool(re.search(r"docker|container|microservice|kubernetes|k8s|redis|cache|fastapi|async|postgres|sql|database|queue|kafka", text))
    if has_arch:
        return "Medium Risk"

    return "Rock Solid"


def generate_resume_defense_matrix(resume_text: str, job_description: str, company: str = "") -> dict:
    text = resume_text or ""
    text_lower = text.lower()
    questions = []

    for template in DRILL_DOWN_TEMPLATES:
        if re.search(template["trigger"], text_lower):
            # Find context line
            lines = [l.strip() for l in text.splitlines() if re.search(template["trigger"], l.lower())]
            claim = lines[0] if lines else "Resume technical capability claim"
            vulnerability = determine_vulnerability_rating(claim)

            # If High Risk, enrich question if general
            question = template["question"]
            if vulnerability == "High Risk" and not any(k in question.lower() for k in ["profiling", "baseline", "exact"]):
                question = f"Regarding this claim: '{claim}', what was the unoptimized baseline, exact instrumentation method, and sample size used to verify this metric?"

            questions.append({
                "claim": claim,
                "question": question,
                "vulnerability_rating": vulnerability,
                "what_interviewer_tests": template["what_tests"],
                "candidate_defense_blueprint": template["defense"],
                "code_defense_snippet": template["code_snippet"],
                "model_interview_answer": template["model_answer"],
            })

    if not questions:
        fallback_claim = DEFAULT_DRILL_DOWN["claim"]
        questions.append({
            "claim": fallback_claim,
            "question": DEFAULT_DRILL_DOWN["question"],
            "vulnerability_rating": determine_vulnerability_rating(fallback_claim),
            "what_interviewer_tests": DEFAULT_DRILL_DOWN["what_interviewer_tests"],
            "candidate_defense_blueprint": DEFAULT_DRILL_DOWN["candidate_defense_blueprint"],
            "code_defense_snippet": DEFAULT_DRILL_DOWN["code_defense_snippet"],
            "model_interview_answer": DEFAULT_DRILL_DOWN["model_interview_answer"],
        })

    return {
        "interrogation_level": "Aggressive Senior Technical Screen",
        "company": company or "Target Company",
        "drill_down_questions": questions[:5],
        "defense_confidence_score": 85 if len(questions) >= 3 else 65,
    }
