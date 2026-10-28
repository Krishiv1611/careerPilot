"""Curated actionable project blueprints for top student resume gaps.

Each blueprint defines:
- title: Project name
- summary: Core architecture and objective
- required_files: Files that must exist in the GitHub repository (case-insensitive check)
- steps: Step-by-step implementation guide
- starter_snippet: Concrete starting code
- suggested_bullet: Quantified STAR resume bullet ready for ATS formatting
"""

BLUEPRINTS = {
    "docker": {
        "skill": "docker",
        "title": "Containerized Microservice with Multi-Stage Build & Compose",
        "summary": "Containerize a REST API using production multi-stage Dockerfile and docker-compose orchestration.",
        "required_files": ["Dockerfile", "docker-compose.yml"],
        "steps": [
            "Write a minimal multi-stage Dockerfile using python:3.12-slim or node:20-alpine.",
            "Create a docker-compose.yml file configuring the application and a persistent cache/database service.",
            "Add healthcheck endpoints and non-root USER execution for container security.",
            "Test build locally: docker compose up --build.",
        ],
        "starter_snippet": """FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .
USER 1000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]""",
        "suggested_bullet": "Containerized backend REST API using multi-stage Dockerfile and docker-compose, reducing container image size by 60% and enabling reproducible local dev orchestration.",
    },
    "kubernetes": {
        "skill": "kubernetes",
        "title": "Kubernetes Deployment & Ingress Manifests with Rolling Updates",
        "summary": "Deploy a multi-tier microservice to Kubernetes with Deployment, Service, and ConfigMap manifests.",
        "required_files": ["deployment.yaml", "service.yaml"],
        "steps": [
            "Define Deployment spec with readiness and liveness HTTP probes.",
            "Define ClusterIP or NodePort Service exposing application pods.",
            "Add ConfigMap / Secret manifests for externalized configuration.",
            "Configure RollingUpdate strategy with maxUnavailable: 0 for zero-downtime deployments.",
        ],
        "starter_snippet": """apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: api:latest
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /health
            port: 8000""",
        "suggested_bullet": "Architected declarative Kubernetes deployment manifests with liveness/readiness probes and rolling-update strategy, ensuring zero-downtime deployments.",
    },
    "redis": {
        "skill": "redis",
        "title": "High-Throughput In-Memory Caching & Rate Limiting Layer",
        "summary": "Implement Redis caching with TTL eviction and sliding window rate limiter.",
        "required_files": ["redis", "cache"],
        "steps": [
            "Set up Redis connection pool with automatic reconnection and fallback.",
            "Implement Cache-Aside pattern for expensive database queries with configurable TTL.",
            "Add token-bucket or sliding-window rate limiter middleware.",
            "Benchmark query latency with and without cache.",
        ],
        "starter_snippet": """import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

def get_cached_or_fetch(key: str, fetch_fn, ttl: int = 300):
    val = r.get(key)
    if val:
        return json.loads(val)
    data = fetch_fn()
    r.setex(key, ttl, json.dumps(data))
    return data""",
        "suggested_bullet": "Engineered Redis cache-aside layer with dynamic TTL and connection pooling, reducing 95th percentile database read latency by 75%.",
    },
    "kafka": {
        "skill": "kafka",
        "title": "Event-Driven Asynchronous Pipeline with Kafka Producer/Consumer",
        "summary": "Build an asynchronous decoupled pub/sub pipeline with consumer group rebalancing.",
        "required_files": ["producer", "consumer"],
        "steps": [
            "Implement a high-throughput event producer with batching and retry logic.",
            "Implement idempotent consumer group with explicit offset commits.",
            "Add dead-letter queue (DLQ) pattern for poison-pill message handling.",
            "Write end-to-end integration test demonstrating message processing.",
        ],
        "starter_snippet": """from kafka import KafkaProducer, KafkaConsumer
import json

producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)
producer.send('job-events', {'event': 'job_applied', 'timestamp': '2026-10-28'})""",
        "suggested_bullet": "Implemented event-driven Kafka messaging pipeline with consumer group balancing and dead-letter queue, processing asynchronous workloads reliably.",
    },
    "fastapi": {
        "skill": "fastapi",
        "title": "Production-Grade Async REST API with Pydantic Schema Validation",
        "summary": "Build production FastAPI service featuring JWT authentication, Dependency Injection, and OpenAPI docs.",
        "required_files": ["main.py", "requirements.txt"],
        "steps": [
            "Define Pydantic v2 request/response schemas with field validation.",
            "Implement dependency injection for database session lifecycle.",
            "Add OAuth2 / JWT bearer authentication middleware.",
            "Write automated unit tests using pytest and TestClient.",
        ],
        "starter_snippet": """from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr

app = FastAPI(title="Production Service")

class UserRegister(BaseModel):
    email: EmailStr
    username: str

@app.post("/register")
async def register(data: UserRegister):
    return {"status": "ok", "user": data.username}""",
        "suggested_bullet": "Engineered production async REST API using FastAPI and Pydantic v2, serving structured endpoints with auto-generated OpenAPI documentation.",
    },
    "postgresql": {
        "skill": "postgresql",
        "title": "Relational Data Modeling with Indexed Foreign Keys & Migrations",
        "summary": "Model relational database schema with Alembic migrations, composite indexes, and ACID transactions.",
        "required_files": ["alembic", "models"],
        "steps": [
            "Define normalized SQLAlchemy or SQL schema with foreign key cascades.",
            "Create database indexes on frequently queried foreign keys and filter columns.",
            "Set up Alembic migrations pipeline with upgrade and downgrade scripts.",
            "Run EXPLAIN ANALYZE on complex joins to verify index utilization.",
        ],
        "starter_snippet": """-- Migration script
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Saved',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);""",
        "suggested_bullet": "Designed relational schema in PostgreSQL with indexed composite queries and automated Alembic migrations, optimizing join execution plans.",
    },
    "react": {
        "skill": "react",
        "title": "Interactive Client Dashboard with State Management & Accessible UI",
        "summary": "Build a responsive React 18+ application with component architecture, hooks, and clean routing.",
        "required_files": ["package.json", "src"],
        "steps": [
            "Set up component tree with custom React hooks for async API state.",
            "Implement responsive Tailwind CSS layout with dark mode support.",
            "Add form validation and debounced search filters.",
            "Write component tests using React Testing Library.",
        ],
        "starter_snippet": """import React, { useState, useEffect } from 'react';

export function JobTracker() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch('/api/jobs').then(res => res.json()).then(setItems);
  }, []);
  return <div className="p-4">{items.length} Jobs Tracked</div>;
}""",
        "suggested_bullet": "Built responsive React web client featuring custom async hooks, optimistic UI updates, and accessibility standards.",
    },
    "typescript": {
        "skill": "typescript",
        "title": "Type-Safe Full-Stack Architecture with Strict Null Checks",
        "summary": "Implement strictly typed TypeScript architecture with generic utilities and runtime schema parsing (Zod).",
        "required_files": ["tsconfig.json", "package.json"],
        "steps": [
            "Configure tsconfig.json with strict: true and noImplicitAny: true.",
            "Define discriminated union types for application domain models.",
            "Integrate Zod runtime validators for safe external API boundary ingestion.",
            "Verify compile-time type safety with zero any casts.",
        ],
        "starter_snippet": """import { z } from 'zod';

export const JobSchema = z.object({
  id: z.string(),
  title: z.string(),
  salary: z.number().optional(),
});
export type Job = z.infer<typeof JobSchema>;""",
        "suggested_bullet": "Architected type-safe application layer in TypeScript with strict compile-time checks and Zod runtime schema validation.",
    },
}


def get_skill_blueprint(skill: str) -> dict | None:
    """Retrieve blueprint by skill name, matching case-insensitively or via alias."""
    skill_clean = skill.strip().lower()
    if skill_clean in BLUEPRINTS:
        return BLUEPRINTS[skill_clean]
    # Check aliases
    alias_map = {
        "postgres": "postgresql",
        "sql": "postgresql",
        "k8s": "kubernetes",
        "fast api": "fastapi",
        "ts": "typescript",
    }
    target = alias_map.get(skill_clean)
    if target and target in BLUEPRINTS:
        return BLUEPRINTS[target]
    return None
