# CareerPilot Production SaaS Audit and Implementation Plan

> **Superseded product direction (2026-08-09):** This audit remains useful as a record of technical and security findings, but its interview-first product strategy is no longer approved. The current product design is [CareerPilot Student Application OS](plans/2026-08-09-careerpilot-student-application-os-design.md), with the executable sequence in the [Student Application OS implementation plan](plans/2026-08-09-careerpilot-student-application-os-implementation.md).

Audit date: 2026-07-28  
Repository: `D:\projects\careerPilot`  
Audit type: static code review, architecture review, product-gap analysis, security review, dependency audit, and executable build/import checks

## 1. Executive decision

CareerPilot is a promising functional prototype, not a production SaaS yet. Its strongest existing asset is the beginning of an end-to-end workflow: resume ingestion, job discovery, JD analysis, content generation, roadmaps, applications, and a new interview flow. The correct strategy is to keep that product knowledge while replacing the prototype infrastructure underneath it.

The recommended product position is:

> **CareerPilot Interview OS** — an evidence-driven platform where candidates prepare and employers conduct structured AI-assisted voice and coding interviews.

The same assessment engine should serve two modes:

1. **Candidate practice:** private coaching using a resume, GitHub profile, portfolio, JD, and selected interview type.
2. **Recruiter assessment:** organization-owned interviews using an approved question plan, rubric, coding tasks, consent policy, and human-reviewed scorecard.

Job matching, application tracking, resume generation, and roadmaps should support this hero workflow. They should not remain disconnected AI demonstrations.

Do not rewrite the entire product at once and do not begin with microservices. Build a **modular monolith** for the API and business domains, one background worker, and two deliberately isolated services:

- a sandboxed code-execution service;
- a resume/PDF compilation service, which may initially run as a restricted worker queue.

### Release recommendation

CareerPilot should not accept payments or conduct real employer interviews in its current state. The minimum launch gate is completion of Phases 0 through 3 in this plan, including tenant isolation, a correct credit ledger, migrations, real tests, server-managed providers, safe uploads, removal of fabricated UI data, and evidence-based scoring.

## 2. What was verified

### Executable checks

| Check | Result | Meaning |
|---|---|---|
| Frontend production build | Pass | Vite can create a production bundle |
| Initial JavaScript bundle | 1,766.30 kB; 526.19 kB gzip | Too large; route-level splitting is required |
| Frontend ESLint | Fail: 16 errors, 1 warning | CI-quality frontend baseline does not pass |
| Backend Python compilation | Pass with five invalid-escape warnings | Syntax is valid, but cleanup is required |
| FastAPI import smoke test | Pass; 31 routes | The application imports with the current environment |
| Docker Compose schema | Pass | YAML is structurally valid, not operationally complete |
| Frontend production dependency audit | 0 reported vulnerabilities | No current production npm advisories were found |
| Python dependency audit | 165 known vulnerabilities in 28 packages | Dependency baseline is not safe for production |
| Automated tests | None found | Behavior and security regressions are unprotected |
| Database migrations | None found | Schema changes are unmanaged |

The Python audit reported affected packages including LangChain, LangGraph, LangSmith, Requests, urllib3, aiohttp, pypdf, Pillow, Starlette, ChromaDB, and transitive packages. Do not bulk-upgrade these blindly. First remove unused dependencies, then upgrade the smaller runtime set with tests.

### Current maturity score

| Area | Current | Launch target |
|---|---:|---:|
| Product clarity | 4/10 | 9/10 |
| Backend correctness | 3/10 | 8/10 |
| Tenant isolation | 2/10 | 10/10 |
| Security | 2/10 | 9/10 |
| AI evaluation quality | 2/10 | 8/10 |
| Interview experience | 2/10 | 8/10 |
| Billing and credits | 0/10 | 9/10 |
| Frontend trust and polish | 4/10 | 8/10 |
| Test coverage | 0/10 | 8/10 |
| Deployment and operations | 2/10 | 8/10 |
| Repository hygiene | 3/10 | 9/10 |

## 3. Critical findings

Severity definitions:

- **P0:** data exposure, unauthorized mutation, payment risk, or a blocker for any external launch;
- **P1:** major correctness, reliability, or trust problem;
- **P2:** maintainability, performance, UX, or scale problem;
- **P3:** cleanup and polish.

### 3.1 P0: tenant and authorization failures

1. Job creation, listing, deletion, and reindexing do not require authentication in `backend/routers/job_router.py`.
2. Roadmap creation fetches a resume by ID without checking that it belongs to the authenticated user in `backend/routers/roadmap_router.py`.
3. The main CareerPilot graph receives `user_id`, but the resume extractor resolves a file directly from a supplied resume ID and does not verify ownership.
4. Interview creation accepts resume and job IDs but neither verifies ownership nor resolves their text.
5. Jobs are globally mutable. In a two-sided SaaS, an applicant must never be able to delete recruiter-owned requisitions, and one organization must never mutate another organization’s data.
6. Chroma collections are shared. JD analysis performs similarity search across the entire `resume_chunks` collection without a `user_id`, `organization_id`, or `resume_id` filter. Matching chunks from another user can therefore enter the model context.

Required fix:

- introduce organization-aware authorization policies;
- make ownership filtering mandatory in repository methods;
- include `tenant_id` metadata in every vector;
- reject every cross-tenant lookup before invoking an AI model;
- add explicit IDOR tests for all object endpoints.

### 3.2 P0: secrets and authentication are prototype-grade

1. Gemini, SerpAPI, and Tavily keys are stored in browser `localStorage`.
2. The interview start endpoint places the Gemini key in the query string. Query strings commonly appear in proxy, access, browser-history, and monitoring logs.
3. JWT access tokens are stored in `localStorage`, increasing the consequence of an XSS issue.
4. `SECRET_KEY` is not validated at startup. Encryption code falls back to the literal `supersecretkey`.
5. There is no refresh-token rotation, logout revocation, email verification, password reset, compromised-password protection, login throttling, or MFA option.
6. There are no content-security, HSTS, clickjacking, referrer, or permissions-policy headers.

Required fix:

- remove BYOK and all provider-key UI;
- use server-side secrets through a managed secret store;
- use short-lived access sessions with secure, HTTP-only, same-site cookies or a carefully designed token rotation flow;
- validate all required security configuration at startup;
- add authentication and expensive-operation rate limits;
- implement security headers and a strict CSP;
- never pass secrets in URLs, logs, analytics, or task payloads.

### 3.3 P0: unsafe multi-user retrieval

`backend/services/embedding.py` persists Chroma data in a path derived by walking three directories upward. Locally this differs from the directories created by `backend/main.py`; inside the backend Docker image it can resolve to `/data/vectorstore/chroma`, outside the mounted `/app/data` path.

Beyond the path bug, a local Chroma store is the wrong production boundary for tenant-sensitive resume content. Move to PostgreSQL with `pgvector` for the initial production architecture. Store `tenant_id`, `owner_user_id`, `document_id`, `chunk_id`, model version, and source offsets with each embedding. Apply normal database authorization and backup policies.

### 3.4 P0: payment system is absent

There is no subscription, wallet, ledger, usage record, reservation, payment webhook, entitlement, organization budget, or idempotency implementation. A mutable integer balance is not sufficient.

No paid AI task may be launched until the platform can atomically:

1. validate entitlement;
2. calculate and display the maximum credit price;
3. reserve credits;
4. create an idempotent task;
5. execute asynchronously;
6. commit actual usage or release/refund the reservation;
7. reconcile the internal charge against provider cost;
8. handle provider and webhook retries without double charging.

The detailed model is in Section 8.

### 3.5 P1: interview setup does not pass the selected context

`frontend/src/pages/InterviewSetup.jsx` sends `resume_id` and `job_id`. `backend/routers/interview_router.py` does not fetch those records and instead starts the graph with `"No resume provided"` and `"No JD provided"` when raw text is absent. The displayed promise of a personalized interview is therefore false for the normal selection flow.

The “upload new resume” and “upload/paste JD” controls are visual placeholders without upload behavior. The “End Early” action only changes the route and does not complete or cancel the server session.

### 3.6 P1: the voice interview is a browser demo

The current implementation uses browser `SpeechRecognition` and `speechSynthesis`.

Consequences:

- browser support and transcription quality are inconsistent;
- no durable audio is captured;
- no server-side voice session exists;
- interruption, reconnect, latency, device selection, noise handling, consent, and transcript correction are missing;
- the server only receives final text;
- recruiter and candidate cannot join a real two-sided session;
- there is no WebRTC/WebSocket event protocol.

This is acceptable as a prototype mock, but the UI and product copy must not call it a production voice interview.

### 3.7 P0/P1: interview reports contain fabricated metrics

`frontend/src/pages/InterviewReport.jsx` calculates “Technical” and “Confidence” by adding random values to other scores. Reloading can change the report. This must be removed immediately.

The evaluator asks one LLM for an overall number, communication number, category, and prose. It has:

- no recruiter-approved rubric;
- no per-question criteria;
- no evidence references;
- no scoring calibration;
- no second-pass validation;
- no human review;
- no model/version/prompt trace;
- no confidence or “insufficient evidence” state;
- no distinction between practice feedback and employment assessment.

Do not score facial expressions, emotion, accent, gaze, disability signals, age, gender, race, or other protected/proxy attributes. “Confidence” inferred from voice should not be an employment score. Evaluate job-relevant, observable answer and work-product evidence only.

### 3.8 P1: ATS and fit scores are not trustworthy

The “ATS score” is a single LLM role-play prompt. It does not emulate a named ATS parser, validate parse order, inspect the source document’s layout, or measure JD-specific retrieval. It should be renamed **Resume Quality Review** until a deterministic scoring methodology is implemented.

The fit score has additional correctness problems:

- it relies on exact skill-list comparison;
- it can receive resume chunks from other users;
- it accepts an LLM’s uncalibrated score as the overall result;
- score scale varies between `0–1` in persistence and `0–100` in other outputs;
- it lacks must-have versus preferred requirements;
- it lacks seniority, location, employment type, authorization, salary, recency, and negative-preference gates;
- no evidence supports each matched requirement;
- no benchmark set measures ranking quality.

### 3.9 P1: skill extraction produces predictable false positives

`SkillExtractor.keyword_extract` checks whether each skill is a substring of the full text. The vocabulary contains single-letter skills such as `c` and `r`. These will match ordinary words. Multi-word boundaries and aliases are also incomplete.

Semantic extraction embeds every sentence and the entire skill vocabulary for every request, increasing cost and latency. Replace it with:

- normalized, boundary-aware dictionary matching;
- a versioned skill taxonomy;
- structured LLM extraction only for uncertain candidates;
- cached taxonomy embeddings;
- confidence and source spans;
- a test corpus with precision/recall targets.

### 3.10 P1: untrusted pickle artifacts execute at import-time workflows

`ResumeFieldPredictor` loads `best_model.pkl` and `tfidf.pkl` with Joblib. Pickle-compatible artifacts can execute arbitrary code when loaded. The model and dataset have no visible provenance, signature, model card, license record, or quality report. The category set is also narrow and outdated.

Do not load these artifacts in production. Either:

- remove resume-category prediction; or
- retrain a documented model, serialize to a safer format, verify artifact hashes, store it outside the application image, and publish quality/fairness metrics.

For the first launch, extracting a structured target role from candidate preferences is more useful than predicting one of a small number of historical resume classes.

### 3.11 P1: uploads are insufficiently controlled

Resume upload:

- checks only the filename suffix;
- has no size, page, decompression, or parser timeout limit;
- reads the entire file into memory;
- does not verify MIME signature;
- has no malware/quarantine workflow;
- stores documents on a local filesystem;
- can leave orphan files on downstream failure;
- processes the document synchronously in a web request;
- supports only PDF despite the desired DOCX/TXT/MD workflow.

Production flow:

1. create an upload intent with an object-store presigned URL;
2. enforce extension, MIME, magic bytes, size, and page limits;
3. store in a private quarantine bucket;
4. scan and parse in a restricted worker;
5. reject encrypted, malformed, oversized, or suspicious documents;
6. store normalized structured data and provenance;
7. delete the quarantined original according to the retention policy.

### 3.12 P1: prompt injection and data handling are uncontrolled

Resumes, JDs, web-search content, and company pages are untrusted data. Current prompts interpolate them directly alongside instructions. A malicious JD can attempt to override system instructions or exfiltrate other context.

Required controls:

- label and delimit untrusted content;
- keep policies in system/developer messages, not a flat prompt;
- use strict structured outputs validated by Pydantic;
- allow-list tools per task;
- never give content-processing models access to secrets;
- restrict outbound network access from workers;
- run generated code only in an isolated sandbox;
- add prompt-injection test cases;
- log model metadata and policy decisions without logging raw sensitive content by default.

### 3.13 P1: job search is ingestion, not matching

SerpAPI and Tavily are currently treated as result rankers:

- SerpAPI results receive score `1.0`;
- Tavily’s generic relevance score is exposed as if it were candidate fit;
- Tavily results are stored with “Unknown Company” and “Unknown Location”;
- discovered jobs are written directly to the main jobs table;
- deduplication is weak;
- there is no canonical company, job fingerprint, expiry, verification, or stale-link check;
- there are no user preference gates or calibrated reranking.

External search providers must only generate candidates. A real pipeline is:

`discover → fetch → validate → normalize → deduplicate → classify → apply hard filters → retrieve → rerank → explain → verify link → publish`.

### 3.14 P1: blocking AI work runs inside request handlers

Graph invocation, embeddings, parsing, search calls, PDF creation, and model inference run synchronously in FastAPI handlers. This will exhaust web workers during slow provider calls.

Use a task API:

- `POST /v1/tasks` creates an idempotent job and reserves credits;
- a worker executes it with timeouts, retries, and cancellation;
- `GET /v1/tasks/{id}` reports progress;
- Server-Sent Events or WebSocket pushes status;
- artifacts are stored separately;
- web processes remain stateless and short-lived.

### 3.15 P1: database lifecycle is unmanaged

`Base.metadata.create_all()` runs at application import. There is no Alembic history, rollback strategy, startup migration job, or schema compatibility policy. Models also mix naive and timezone-aware datetimes and lack useful constraints, cascade behavior, soft-deletion/retention metadata, status enums, and tenant indexes.

### 3.16 P1: dependency definition is duplicated and bloated

Dependencies are maintained in both root `pyproject.toml` and `backend/requirements.txt`, with different constraints. The root project claims Python `>=3.12`; the backend Docker image uses Python 3.10. The runtime includes many likely unused packages such as Streamlit, plotting libraries, notebook/data-science dependencies, multiple vector databases, and multiple model-provider clients.

Choose one Python source of truth. Recommended:

- root workspace `pyproject.toml`;
- locked `uv.lock`;
- optional groups: `api`, `worker`, `dev`, `ml-training`;
- a generated requirements export only when a deployment platform requires one.

### 3.17 P1: deployment definition is not a production stack

The Compose file includes only frontend and backend, while the backend requires PostgreSQL. It has:

- no PostgreSQL service;
- no Redis/task broker;
- no object store;
- no health checks;
- no migrations job;
- no worker;
- no resource limits;
- no secrets integration;
- a development bind mount;
- runtime frontend environment variables that Vite will not consume after build;
- unpinned image tags;
- containers running as root;
- no `.dockerignore`;
- no TLS/reverse-proxy policy.

The embedding persistence path also falls outside the intended mounted application data path inside the backend image.

### 3.18 P1: repository contains generated and research artifacts

Tracked files include:

- a 7.75 MB Chroma SQLite database;
- Chroma binary index files;
- a 3.1 MB resume dataset;
- pickle model artifacts;
- a research notebook;
- `backend/build_log.txt`.

The repository also has local `.venv` and `__pycache__` directories, though they are ignored. The `.venv` is approximately 1.48 GB, and the frontend directory is approximately 223 MB due primarily to local dependencies/build output.

Do not delete these blindly. First determine whether the dataset and model have a license and reproducible training source. Then:

- move legitimate research to a separate private ML repository or versioned artifact store;
- remove runtime-generated Chroma data from Git history through an intentional migration;
- remove build logs and starter assets;
- keep only reproducible fixtures containing no real personal data.

### 3.19 P1: product copy contains unsupported claims

The landing page displays `98% Match Accuracy`, `500+ Skills Tracked`, and `10k+ Jobs Analyzed` without supporting telemetry. The dashboard displays fixed “Recent Activity” and a fabricated “15% improvement” tip.

Replace these immediately with real empty states and event-driven metrics. Unsupported accuracy and hiring claims create trust and legal risk.

Privacy, Terms, and Contact links are `#`. The README claims an MIT `LICENSE` file exists, but no `LICENSE` file is present.

### 3.20 P2: frontend structure and accessibility

The frontend is page-centric and manually fetches data. It lacks:

- a query cache and mutation invalidation strategy;
- centralized typed API contracts;
- error boundaries;
- route-level code splitting;
- reusable task/progress UI;
- robust skeleton/empty/error states;
- organization and role navigation;
- mobile navigation;
- accessibility testing;
- focus-managed, keyboard-complete dialogs/selects;
- a stable design-token and component documentation workflow.

The custom select uses clickable `div` elements rather than native or accessible primitives. Browser alerts/confirms are used for product flows. The fixed navbar can overcrowd at medium widths.

## 4. Target product architecture

### 4.1 Product surfaces

#### Candidate workspace

- evidence profile: resumes, GitHub, portfolio, projects, achievements, verified claims;
- job preferences and exclusions;
- verified matches with explanations;
- application tracker;
- reusable application-answer vault;
- LaTeX resume studio;
- JD-specific roadmap;
- interview preparation and replay;
- credit wallet and usage.

#### Recruiter workspace

- organizations, teams, roles, permissions, and budgets;
- requisitions and structured JDs;
- candidate pipeline;
- assessment templates;
- question bank and coding challenges;
- interview scheduling/invitations;
- AI interviewer configuration;
- evidence-linked scorecards;
- reviewer comments and final decisions;
- integrations, webhooks, audit log, and billing.

#### Shared assessment engine

- interview plan;
- consent;
- real-time session events;
- audio/transcript pipeline;
- coding workspace;
- rubric and evidence;
- human review;
- candidate-safe feedback policy;
- task usage and credit settlement.

### 4.2 Runtime architecture

```text
React web application
        |
API gateway / reverse proxy
        |
FastAPI modular monolith
  |         |          |           |
Postgres  Redis     Object store   Provider gateway
pgvector  queue     resumes/audio  LLM/search/STT/TTS
             |
       Background worker
          |        |
   LaTeX compiler  Code sandbox service
```

Recommended initial stack:

- React + Vite;
- TanStack Query for server state;
- React Hook Form + Zod for form validation;
- FastAPI;
- SQLAlchemy 2 + Alembic;
- PostgreSQL + `pgvector`;
- Redis;
- a simple Python worker system with retries and scheduled tasks;
- S3-compatible private object storage;
- Stripe Billing;
- OpenTelemetry plus Sentry-compatible error reporting;
- WebSocket for live interview events;
- isolated Codebox-derived execution service, subject to its license and an independent security review;
- Tectonic for deterministic LaTeX compilation in a restricted container.

### 4.3 Clean repository structure

```text
careerPilot/
  apps/
    api/
      app/
        main.py
        core/
          config.py
          security.py
          logging.py
          telemetry.py
          errors.py
        db/
          base.py
          session.py
          migrations/
        modules/
          auth/
          organizations/
          billing/
          evidence/
          resumes/
          jobs/
          matching/
          applications/
          roadmaps/
          interviews/
          assessments/
          integrations/
          audit/
        ai/
          gateway.py
          policies.py
          prompts/
          schemas/
        shared/
      tests/
    worker/
      worker/
        tasks/
        providers/
        pipelines/
      tests/
    web/
      src/
        app/
        routes/
        features/
          auth/
          billing/
          resumes/
          jobs/
          applications/
          interviews/
          recruiter/
        components/
        lib/
        styles/
      tests/
    code-runner/
  packages/
    contracts/
    design-tokens/
  infra/
    docker/
    compose/
    deployment/
  docs/
    architecture/
    security/
    product/
  scripts/
  pyproject.toml
  uv.lock
  package.json
```

This is a target layout, not a request to move every file in one commit. Migrate one domain at a time with compatibility tests.

## 5. Domain and data model

All tenant-owned tables require `organization_id` or an explicit documented reason not to have it. Candidate-private objects also require `owner_user_id`.

### Identity and tenancy

- `users`
- `user_identities`
- `sessions`
- `email_verifications`
- `password_reset_tokens`
- `organizations`
- `organization_memberships`
- `roles`
- `invitations`
- `audit_events`

### Billing

- `plans`
- `subscriptions`
- `entitlements`
- `credit_wallets`
- `credit_ledger_entries`
- `credit_reservations`
- `task_catalog`
- `task_runs`
- `provider_usage_records`
- `payment_events`
- `organization_budgets`

### Evidence and resumes

- `evidence_profiles`
- `evidence_items`
- `evidence_sources`
- `documents`
- `document_versions`
- `document_chunks`
- `resume_profiles`
- `resume_versions`
- `resume_templates`
- `resume_render_jobs`
- `generated_artifacts`

Every generated claim should carry:

- source evidence IDs;
- source spans where applicable;
- generation model and prompt version;
- review status;
- user edits;
- last verification timestamp.

### Jobs and applications

- `companies`
- `job_requisitions`
- `job_sources`
- `job_source_snapshots`
- `job_requirements`
- `job_matches`
- `match_evidence`
- `applications`
- `application_events`
- `application_answers`
- `integration_connections`
- `integration_sync_runs`

Job requirements should distinguish:

- must-have versus preferred;
- skill and proficiency;
- minimum experience;
- location/remote policy;
- employment type;
- work authorization;
- compensation;
- education/certification only when genuinely required;
- freshness and application deadline.

### Interviews and assessments

- `assessment_templates`
- `assessment_sections`
- `rubrics`
- `rubric_criteria`
- `question_bank_items`
- `coding_challenges`
- `test_cases`
- `interview_plans`
- `interview_invitations`
- `interview_sessions`
- `interview_participants`
- `session_events`
- `transcript_segments`
- `code_submissions`
- `code_execution_events`
- `hint_events`
- `evidence_observations`
- `criterion_scores`
- `scorecards`
- `reviewer_decisions`
- `consent_records`

Store the interview as an append-only event stream. Derive the transcript and scorecard from events rather than mutating one JSON transcript field.

## 6. AI quality architecture

### 6.1 Provider gateway

Application code should request capabilities, not model names:

```text
generate_structured(task_type, schema, inputs, policy)
embed(content, purpose)
transcribe(audio_stream, language)
synthesize(text, voice_policy)
search_jobs(query, filters)
```

The gateway selects a provider/model, enforces budgets, redacts logs, records usage, validates output, applies retries, and supports a controlled fallback.

### 6.2 Prompt and output policy

Every AI task requires:

- versioned prompt;
- typed input;
- typed output;
- maximum context and output size;
- timeout and retry policy;
- safety/tool allow-list;
- tenant and data-classification metadata;
- evaluation dataset;
- fallback behavior;
- cost/credit mapping;
- trace ID;
- model/provider version record.

Do not expose raw chain-of-thought. Store concise score rationale and evidence references.

### 6.3 Matching pipeline

1. Parse candidate preferences and evidence.
2. Discover candidates through supported providers.
3. Fetch and snapshot the actual listing.
4. Validate that it is a live job.
5. Normalize company, title, location, seniority, compensation, and requirements.
6. Generate a stable fingerprint and deduplicate.
7. Apply hard filters.
8. Retrieve semantically relevant jobs.
9. Rerank using structured candidate/job features.
10. Generate an explanation backed by requirement-level evidence.
11. Calibrate scores against a labeled evaluation set.
12. Recheck link freshness before display.

Quality metrics:

- precision@5 and precision@10;
- duplicate rate;
- stale-link rate;
- hard-filter violation rate;
- explanation faithfulness;
- user save/apply/dismiss feedback;
- provider cost per accepted match.

### 6.4 Resume generation

1. Parse source documents into a canonical resume JSON schema.
2. Let the user correct extracted facts.
3. Build a JD-specific content plan referencing evidence IDs.
4. Generate proposed edits with a diff.
5. Require user approval for material claim changes.
6. Render approved JSON through a versioned Jinja/LaTeX template.
7. Compile with Tectonic in a no-network, resource-limited container.
8. Parse the PDF back to verify text order and missing content.
9. Run deterministic checks for page count, overflow, links, headings, fonts, and ATS reading order.
10. Store both the source version and artifact hash.

### 6.5 Roadmaps

Roadmaps should be concise and evidence-producing. Limit the default to three to five milestones. Each milestone needs:

- the exact JD gap;
- one deliverable;
- acceptance criteria;
- estimated effort;
- selected resources from a verified catalog;
- an optional practice assessment;
- a way to attach the resulting evidence to the profile.

Do not generate long generic course lists or unverified URLs from model memory.

### 6.6 Interview scoring

Recruiter assessment flow:

1. Parse the JD into competencies.
2. Generate a proposed plan and rubric.
3. Require recruiter approval.
4. Ask mandatory and adaptive questions within that plan.
5. Capture transcript/code/event evidence.
6. Score each criterion independently.
7. Attach evidence excerpts and code/test results.
8. Mark insufficient evidence rather than guessing.
9. Run a consistency validator.
10. Require human reviewer sign-off for employment decisions.

Practice mode may provide coaching. Recruiter mode should not coach during scored sections unless the approved assessment explicitly includes hints with a defined penalty.

## 7. Interview OS implementation

### 7.1 Candidate mode

- select resume, GitHub repositories, portfolio, and JD;
- choose behavioral, technical, system-design, coding, or mixed format;
- microphone/device check and consent;
- real-time captions and correction;
- adaptive follow-ups tied to the rubric;
- Codebox-backed editor for technical rounds;
- optional hints;
- replay aligned to transcript and code timeline;
- evidence-linked feedback;
- private practice score that is never shared without explicit consent.

### 7.2 Recruiter mode

- create requisition;
- generate or select an assessment template;
- add mandatory questions;
- select coding challenges and allowed languages;
- configure duration, hints, retakes, identity policy, and accessibility accommodations;
- invite candidates;
- monitor completion, not private practice activity;
- review evidence-linked scorecards;
- compare candidates only on the same approved rubric;
- export or sync a human-approved decision to an ATS.

### 7.3 Real-time protocol

Use WebSocket events such as:

- `session.joined`
- `consent.accepted`
- `audio.started`
- `transcript.partial`
- `transcript.final`
- `question.presented`
- `answer.completed`
- `editor.changed`
- `code.run.requested`
- `code.run.completed`
- `hint.requested`
- `section.completed`
- `session.paused`
- `session.completed`
- `evaluation.ready`

Every event receives an ID, monotonic sequence, server timestamp, actor, session ID, and idempotency key.

### 7.4 Code execution boundary

Never execute candidate code in the API or worker container.

Code runner requirements:

- isolated VM/microVM or hardened sandbox;
- no outbound network by default;
- read-only base image;
- non-root UID;
- CPU, memory, process, file, and wall-clock limits;
- output truncation;
- ephemeral filesystem;
- language allow-list and pinned toolchains;
- hidden tests inaccessible to the candidate;
- signed task payloads;
- audit events;
- automatic teardown;
- abuse detection and concurrency quotas.

Codebox can inform this service, but do not copy or deploy it until its current license, dependency security, isolation claims, and operational model have been reviewed.

## 8. Credit-based billing

### 8.1 User experience

Users buy CareerPilot credits. Normal users never bring provider keys.

Before each paid task, display:

- task name;
- inclusions;
- maximum credit charge;
- estimated duration;
- balance after completion;
- refund behavior.

Viewing, editing, or downloading an already generated artifact should not consume credits.

### 8.2 Ledger rules

Use an immutable, double-entry-style ledger. Never rely only on `wallet.balance`.

Ledger entry types:

- subscription grant;
- purchased top-up;
- promotion;
- reservation;
- reservation release;
- usage settlement;
- refund;
- expiration;
- admin adjustment;
- chargeback hold.

Each entry requires:

- wallet;
- amount and direction;
- currency type (`credit`);
- source;
- task/payment reference;
- idempotency key;
- creation actor;
- immutable timestamp;
- optional expiry lot.

### 8.3 Task charging flow

Transaction A:

1. verify entitlement and rate limit;
2. lock wallet;
3. check available balance;
4. create `task_run`;
5. reserve maximum credits;
6. commit;
7. enqueue through an outbox event.

Worker:

1. claim task;
2. execute provider calls;
3. record provider usage;
4. store artifacts;
5. mark success/failure.

Transaction B:

1. lock reservation;
2. settle actual charge up to displayed maximum;
3. release unused credits;
4. refund automatically on platform failure;
5. emit receipt/usage event.

### 8.4 Abuse and financial controls

- signed Stripe webhooks;
- webhook event deduplication;
- purchase idempotency;
- separate subscription, purchased, and promotional credit lots;
- promotional credits consumed first;
- organization spending caps;
- member-level budgets;
- task concurrency limits;
- fraud and chargeback holds;
- provider-cost anomaly alerts;
- daily reconciliation;
- admin adjustments requiring reason and audit event;
- no negative balance except an explicit controlled debt state.

### 8.5 Pricing policy

Keep a versioned task catalog. Prices should be based on measured p95 cost plus infrastructure, support, payment fees, failure/retry allowance, and target margin. Do not price directly from model tokens in the UI.

Example task categories:

- resume parse;
- resume quality review;
- JD match;
- verified job refresh;
- LaTeX resume render;
- roadmap;
- application answer;
- company brief;
- practice interview minute;
- recruiter interview minute;
- coding execution bundle;
- assessment evaluation.

## 9. Security and privacy baseline

### Identity

- Argon2id password hashing with defined parameters;
- minimum password strength and breached-password check;
- verified email;
- secure reset flow;
- short session lifetime with rotation;
- optional MFA;
- session/device management;
- generic authentication errors;
- login, signup, reset, and verification throttles.

### Authorization

- deny by default;
- organization membership and role checks;
- object ownership in repository queries;
- separate candidate-private and recruiter-owned resources;
- authorization unit and integration tests;
- admin impersonation only with reason, banner, and audit.

### Data

- TLS in transit;
- managed encryption at rest;
- private object buckets;
- per-tenant object prefixes;
- signed short-lived download URLs;
- PII classification;
- configurable retention;
- delete/export workflows;
- backup encryption and restore tests;
- no production PII in local development or test fixtures.

### Application

- strict input schemas and length limits;
- parameterized database access;
- MIME and magic-byte verification;
- parser and archive limits;
- SSRF-safe URL fetching;
- CSP, HSTS, frame, referrer, and permissions headers;
- dependency scanning and lockfiles;
- secret scanning;
- SAST;
- container image scanning;
- non-root containers;
- read-only filesystems where possible;
- egress restrictions for sandboxes/workers.

### AI and hiring safety

- explicit candidate consent;
- disclosure that AI assists rather than makes the final decision;
- job-related rubrics only;
- accessibility accommodations;
- no emotion, face, accent, or protected-trait inference;
- model/prompt/version traceability;
- bias and consistency evaluation;
- human appeal/review path;
- documented data use and retention;
- no training on customer data without explicit contractual consent.

Before selling recruiter assessments, obtain jurisdiction-specific legal review for employment, privacy, recording consent, accessibility, and automated decision requirements.

## 10. Frontend redesign plan

### Information architecture

Use role-aware shells:

Candidate:

- Overview
- Matches
- Applications
- Resumes
- Interview Lab
- Roadmap
- Credits

Recruiter:

- Requisitions
- Candidates
- Assessments
- Interviews
- Question Bank
- Analytics
- Team
- Billing

### Trust requirements

- remove all fake statistics and random score visuals;
- label estimates, verified facts, and AI suggestions differently;
- show why a match received its score;
- show evidence behind every interview criterion;
- show credit cost before execution;
- show task state, retry state, and refund state;
- provide real activity from the event log;
- include working Privacy, Terms, security, and contact pages.

### Engineering requirements

- generate a typed client from OpenAPI;
- use TanStack Query for server state;
- use route-level lazy loading;
- remove raw `fetch` duplication;
- centralize error handling and authentication renewal;
- implement error boundaries;
- use accessible headless primitives rather than clickable `div` controls;
- add keyboard/focus tests;
- meet WCAG 2.2 AA for core flows;
- add responsive recruiter tables and mobile candidate flows;
- keep the design system small and documented.

Performance budgets:

- initial route JavaScript below 250 kB gzip;
- no chart/PDF/code-editor packages in the initial route;
- LCP below 2.5 seconds at p75;
- INP below 200 ms at p75;
- CLS below 0.1.

## 11. Backend redesign plan

### API rules

- version endpoints under `/v1`;
- use plural resources;
- use UUID/ULID identifiers consistently;
- include pagination;
- return a stable error envelope with a request ID;
- use idempotency keys for task/payment mutations;
- use optimistic concurrency or version fields for collaborative resources;
- separate commands from long-running task status;
- never expose provider keys or raw internal exceptions;
- publish and test OpenAPI.

### Service boundaries

Keep route handlers thin:

`router → authorization → application service → domain/repository/provider`.

LangGraph should be used only where a persisted state machine adds value, especially the interview. Resume parsing, matching, billing, and CRUD should remain explicit application services.

### Reliability

- timeouts for every external call;
- retry only safe/transient failures;
- circuit breakers and provider health;
- task cancellation;
- dead-letter queue;
- transactional outbox;
- idempotent workers;
- connection-pool configuration;
- graceful shutdown;
- readiness and liveness endpoints;
- migration compatibility during rolling deploys.

## 12. Repository cleanup plan

### Remove after verification

- `main.py` root hello-world entry;
- `frontend/src/assets/react.svg`;
- `frontend/public/vite.svg`;
- generic `frontend/README.md`;
- `backend/build_log.txt`;
- unused settings/encryption endpoints after BYOK removal;
- unused imports and custom unfinished UI select;
- duplicate dependency definitions;
- generated Chroma database/index files;
- stale Docker comments and development bind mounts in production Compose.

### Move out of the runtime repository

- `backend/analysis/Resume_analyser.ipynb`;
- `backend/analysis/ResumeDataSet.csv`;
- `backend/analysis/best_model.pkl`;
- `backend/analysis/tfidf.pkl`.

Only move these after documenting source, license, reproducibility, and whether they contain personal data.

### Add

- `LICENSE` or correct the README;
- `.dockerignore` for every build context;
- `.env.example` at the correct scope with no secrets;
- contribution and security policies;
- architecture decision records;
- migrations;
- unit/integration/e2e/security tests;
- CI workflows;
- code ownership;
- dependency update policy;
- data retention and incident-response documentation.

## 13. Implementation phases

Time estimates assume a focused small team and are planning ranges, not promises.

### Phase 0 — Preserve and baseline (2–3 days)

Tasks:

- preserve the current uncommitted interview work on a dedicated branch/commit;
- record a known-good local setup;
- add CI for frontend lint/build and backend import/tests;
- add formatting and pre-commit checks;
- add `.dockerignore`;
- capture current API OpenAPI output;
- decide the one dependency source of truth;
- create architecture decision records for tenancy, billing, worker, storage, and vector database.

Exit criteria:

- no user work is lost;
- CI runs on every PR;
- build/import baselines are reproducible;
- the migration strategy is approved.

### Phase 1 — Stop-ship correctness and security (1–2 weeks)

Tasks:

- remove random interview metrics and fabricated dashboard/landing statistics;
- authenticate and authorize all job endpoints;
- add ownership checks to resume, roadmap, analysis, and interview flows;
- resolve selected resume/JD text server-side;
- remove provider keys from query strings;
- begin removal of BYOK UI and request fields;
- require secure server configuration at startup;
- add rate limiting;
- add upload size/MIME/magic/page limits;
- stop returning internal exception messages;
- add security headers;
- filter every vector query by tenant/document;
- replace or quarantine unsafe pickle loading;
- patch/remove vulnerable dependencies;
- add tests for each fixed vulnerability.

Exit criteria:

- cross-tenant access test suite passes;
- no key is stored in browser storage or sent in a URL;
- no fabricated score/stat remains;
- dependency audit has no unaccepted high/critical runtime findings;
- upload abuse cases are bounded.

### Phase 2 — SaaS foundation (2–4 weeks)

Tasks:

- introduce Alembic;
- add organizations, memberships, roles, invitations, and audit events;
- normalize timezones and identifiers;
- add object storage;
- add Redis and worker;
- replace local Chroma with `pgvector`;
- create task API and progress events;
- add provider gateway;
- create structured logging/tracing;
- implement health checks and production Compose;
- add transactional outbox;
- migrate existing user/resume/job/application data.

Exit criteria:

- web API is stateless;
- long work runs in workers;
- migrations work forward and backward in staging;
- tenant boundaries exist in database and retrieval layers;
- task retries are idempotent.

### Phase 3 — Credits and subscriptions (2–3 weeks)

Tasks:

- create task catalog, wallets, ledger, reservations, usage, and budgets;
- integrate Stripe Checkout/Billing/Customer Portal;
- add signed idempotent webhook processing;
- meter provider and infrastructure usage;
- implement task reserve/settle/refund;
- add candidate and organization credit pages;
- add low-balance warnings, spending caps, and receipts;
- build reconciliation and anomaly reports.

Exit criteria:

- concurrency tests cannot overspend a wallet;
- webhook retries cannot duplicate credits;
- failed platform tasks refund automatically;
- finance can reconcile provider cost, credits, and payments;
- every charged task shows price before execution.

### Phase 4 — Real matching and application workspace (3–5 weeks)

Tasks:

- define candidate preferences and exclusions;
- normalize and validate provider results;
- add job fingerprints, deduplication, and freshness;
- add requirement extraction;
- implement hard filters plus retrieval/reranking;
- attach requirement-level evidence and explanations;
- create application stages and immutable activity events;
- implement manual capture and a unique email-forwarding inbox first;
- add Outlook/Gmail synchronization only after OAuth, privacy, verification, and retention requirements are complete;
- add employer-authorized ATS connectors through official APIs and signed webhooks;
- build a labeled matching evaluation set.

Exit criteria:

- hard-filter violations are near zero;
- stale/duplicate rates meet published targets;
- user can explain every top match;
- application state is real, not inferred from unsupported scraping.

### Phase 5 — Evidence profile and LaTeX resume studio (3–5 weeks)

Tasks:

- canonical resume/evidence schema;
- multi-format safe parser;
- GitHub and portfolio evidence import;
- fact correction/review UI;
- evidence-backed application-answer vault;
- resume versioning and tracked changes;
- LaTeX templates and Tectonic sandbox;
- PDF parse-back and layout checks;
- truthful-generation regression tests.

Exit criteria:

- generated claims cite source evidence;
- user approves material changes;
- PDFs compile deterministically;
- text order passes ATS parse-back checks;
- no raw resume text is required as the system-of-record.

### Phase 6 — Candidate Interview Lab (4–6 weeks)

Tasks:

- interview templates and rubrics;
- real-time WebSocket session state;
- production STT/TTS provider gateway;
- microphone/device/consent flow;
- captions and transcript correction;
- behavioral/technical/system-design modes;
- Codebox-style coding workspace and sandbox;
- replay timeline;
- evidence-linked report;
- accessibility and reconnect behavior.

Exit criteria:

- interrupted sessions recover;
- audio/transcript retention follows consent;
- every score cites evidence or says insufficient evidence;
- code execution passes isolation/abuse tests;
- no protected/proxy characteristic is scored.

### Phase 7 — Recruiter assessment product (4–7 weeks)

Tasks:

- requisitions and candidate pipeline;
- JD-to-assessment proposal;
- recruiter-approved questions and rubrics;
- invitation/scheduling;
- mandatory and adaptive question policies;
- coding OA support;
- reviewer scorecards/comments;
- candidate comparison on shared rubric;
- ATS export/webhooks;
- organization analytics;
- audit and appeal workflow.

Exit criteria:

- recruiter can create and launch an assessment without developer help;
- candidate sees consent and accommodation options;
- human approval is required for final decisions;
- rubric calibration and reviewer agreement are measurable;
- full audit trail is exportable.

### Phase 8 — Production hardening and enterprise readiness (ongoing; initial 2–4 weeks)

Tasks:

- backup/restore drills;
- load, soak, chaos, and failover tests;
- SLO dashboards and alerting;
- penetration test;
- privacy impact assessment;
- incident response and breach runbooks;
- SSO/SAML, SCIM, advanced RBAC;
- retention/data residency controls;
- model/prompt governance;
- disaster recovery;
- support tooling and status page.

Exit criteria:

- staging passes release checklist;
- restore objectives are demonstrated;
- critical incident ownership is defined;
- security/legal launch review is signed off.

## 14. Test strategy

### Backend

- domain unit tests;
- repository authorization tests;
- API contract tests;
- migration tests;
- task idempotency/retry tests;
- credit-ledger property and concurrency tests;
- provider contract tests using recorded/redacted fixtures;
- prompt structured-output tests;
- matching evaluation suite;
- upload fuzz/limit tests;
- WebSocket session tests.

### Frontend

- component tests for forms and task states;
- accessibility tests;
- API mocking at the network boundary;
- Playwright journeys for candidate and recruiter;
- visual regression for key pages;
- mobile viewport tests;
- session expiry and recovery tests.

### Security

- IDOR matrix across every tenant object;
- authentication rate-limit tests;
- secret-leak scans;
- prompt-injection suite;
- malicious document corpus;
- sandbox escape/egress tests;
- webhook signature/replay tests;
- dependency/container scans.

### Minimum CI gates

- format and lint;
- type checking;
- unit/integration tests;
- frontend production build;
- OpenAPI compatibility;
- migration validation;
- secret scan;
- dependency scan;
- container scan;
- e2e smoke test against an ephemeral stack.

## 15. Observability and SLOs

Track:

- request count, latency, error rate;
- task queue depth and age;
- provider latency/error/fallback;
- credit reservations, settlements, refunds, and reconciliation differences;
- STT/TTS latency;
- interview reconnects and incomplete sessions;
- code runner utilization and terminations;
- match freshness/duplicate/filter metrics;
- document parse failures;
- tenant authorization denials;
- cost per successful task.

Initial SLO candidates:

- API availability: 99.9%;
- non-AI API p95: below 500 ms;
- task status propagation: below 2 seconds;
- no lost/double credit settlement;
- recovery point objective: 15 minutes;
- recovery time objective: 4 hours;
- critical security alert acknowledgement: 15 minutes.

Do not promise these publicly until they have been measured.

## 16. First backlog in execution order

1. Preserve the dirty working tree.
2. Remove random/fake report and marketing data.
3. Add authentication/authorization to jobs and fix all resume ownership paths.
4. Fix tenant filtering in retrieval.
5. Resolve interview resume/JD text from authorized records.
6. Remove query-string API keys.
7. Replace BYOK with a server provider gateway.
8. Reduce and patch the Python dependency set.
9. Add Alembic and stop `create_all()` at import.
10. Add tests and make lint/build/test mandatory.
11. Add worker/task model.
12. Add organizations and RBAC.
13. Implement the credit ledger and Stripe.
14. Replace Chroma with `pgvector`.
15. Build structured evidence/resume data.
16. Implement verified job matching.
17. Add LaTeX compilation.
18. Replace browser voice demo with a durable session protocol.
19. Add sandboxed coding assessments.
20. Add recruiter assessment and human-review workflows.

## 17. Explicit non-goals for the first paid release

- fully autonomous hiring decisions;
- emotion, face, gaze, accent, personality, or “culture fit” scoring;
- unsupported scraping or automated applications on platforms that prohibit it;
- dozens of shallow job-board integrations;
- general-purpose remote code execution;
- microservices for every domain;
- custom model training before a real labeled dataset exists;
- fake accuracy claims;
- enterprise data-residency promises before the infrastructure supports them.

## 18. Definition of “premium production SaaS”

CareerPilot is ready to call premium when:

- the hero interview workflow is complete on both candidate and recruiter sides;
- every meaningful score is evidence-linked and reproducible;
- credits charge reliably and refund failures;
- users never manage provider keys;
- tenant isolation is proven by tests;
- generated resumes are real compiled documents with version history;
- job matches are verified, filtered, deduplicated, and explained;
- all displayed activity and metrics are real;
- long-running work is durable and observable;
- security, privacy, accessibility, and human-review controls are part of the product rather than future notes;
- CI, migrations, backups, monitoring, and incident processes are operational.

## 19. Application Update Hub

### 19.1 Honest product promise

CareerPilot should promise:

> Track applications from one workspace using connected inboxes, calendars, supported ATS integrations, and verified activity evidence.

It should not promise “connect every job board directly.” Most candidate-facing job boards do not expose a general public API that lets any third party read a user’s application status. Some status programs are restricted to approved ATS partners, and employer ATS APIs require authorization from the employer that owns the tenant.

Every update must therefore show its source:

- **ATS verified:** received from an employer-authorized ATS API or signed webhook;
- **Email detected:** extracted from a message the candidate authorized CareerPilot to process;
- **Calendar detected:** derived from an authorized interview invitation;
- **Candidate confirmed:** entered or approved by the candidate;
- **CareerPilot inferred:** a suggestion awaiting confirmation, never presented as fact.

Silence must never become a rejection. A closed public job must not automatically mark an existing application rejected.

### 19.2 Connector rollout

#### Level 0 — manual and forwarded evidence

Launch these first because they work across employers without broad mailbox access:

- manual application creation;
- “Save to CareerPilot” browser-extension action;
- per-user forwarding address such as `applications+token@inbox.careerpilot.ai`;
- upload of an application confirmation or status message;
- optional `.ics` interview-event import;
- source URL and screenshot/receipt attachment.

The browser extension should operate only after an explicit click. It may capture the current confirmation, title, company, location, URL, ATS name, external ID, and timestamp. It must not continuously inspect browsing history, automate submissions, bypass platform controls, or scrape authenticated pages in the background.

#### Level 1 — candidate-authorized communication connectors

1. **Outlook/Microsoft 365:** use delegated OAuth and the least privileged permission that supplies the required data. Microsoft Graph supports message change notifications and delta synchronization. Store the opaque delta link and recover from missed or removed subscriptions through reconciliation.
2. **Gmail:** use OAuth and Gmail mailbox watches through Cloud Pub/Sub, followed by history synchronization. Gmail read scopes are restricted; a public app may require OAuth verification and, when restricted-scope data is transmitted or stored, a security assessment. Begin with forwarding if those requirements are not complete.
3. **Calendars:** connect only when the user requests interview scheduling. Extract company, role, time, attendees, meeting link, and reschedule/cancellation events. Do not import unrelated events.

Data-minimization options:

- let users connect a dedicated CareerPilot folder or label;
- support sender and domain allow-lists;
- inspect headers and snippets before requesting full content;
- store extracted events and minimal evidence rather than an entire mailbox copy;
- let users exclude and immediately delete a message;
- provide connection-level retention controls.

#### Level 2 — employer-authorized ATS connectors

These are recruiter-product connectors and the highest-quality application-status source:

| Connector | Initial capability | Sync method |
|---|---|---|
| Greenhouse | candidates, applications, stages, interviews, assessment links | signed webhooks plus supported Harvest reconciliation |
| Lever | opportunities, application creation, stage/archive/hired changes | signed webhooks plus Data API reconciliation |
| Ashby | applications, candidates, interviews, application updates | webhooks plus Developer API reconciliation |
| Workable | candidates, jobs, stage moves | candidate/job webhooks plus scoped API reconciliation |
| Customer ATS | custom enterprise connector | signed outbound webhook or customer-scoped API |

Use the current supported API generation. Greenhouse has announced retirement of Harvest v1/v2 after 2026-08-31, so new implementation must target the supported replacement rather than a retiring version.

Employer connectors require:

- organization-administrator authorization;
- documented scopes and data flow;
- encrypted tenant-specific credentials;
- external-to-canonical status mapping;
- signed webhook verification;
- idempotent delivery handling;
- initial backfill and periodic reconciliation;
- disconnect, revoke, and delete behavior;
- connector health and last-success status;
- audit history for mapping and credential changes.

#### Level 3 — restricted partner networks

- **LinkedIn:** treat Apply Connect as a partnership milestone. It can send jobs, receive applications, and deliver applicant statuses, but access is restricted to approved developers and requires certification.
- **Indeed:** treat Indeed Apply and Disposition Sync as ATS/partner integrations. CareerPilot would receive applications for employer customers and send normalized status changes under Indeed’s partner terms. This is not a general candidate-account status-reading API.

Do not place LinkedIn or Indeed logos in a “Connected” marketplace until approval and production access have actually been granted.

### 19.3 Canonical event model

Replace a mutable status-only record with a source-attributed timeline.

Add:

- `connector_definitions`
- `integration_connections`
- `integration_credentials`
- `sync_cursors`
- `sync_runs`
- `webhook_deliveries`
- `external_application_links`
- `application_events`
- `application_event_evidence`
- `status_mappings`
- `sync_conflicts`
- `notification_preferences`

Canonical status set:

```text
saved
preparing
submitted
submission_confirmed
under_review
assessment_requested
assessment_completed
interview_scheduled
interview_completed
offer_received
offer_accepted
rejected
withdrawn
hired
job_closed
unknown
```

An application event should contain:

- tenant and candidate owner;
- application ID;
- canonical event type;
- provider event type and provider record ID;
- occurred-at and received-at timestamps;
- source channel and connection ID;
- confidence and evidence reference;
- classifier/rules version when inferred;
- confirmation actor and time;
- idempotency fingerprint;
- immutable raw-payload hash;
- supersession/conflict metadata.

The current status is a projection of this history, not the only stored representation.

### 19.4 Ingestion architecture

```text
Provider webhook / email watch / forwarding inbox / browser capture
                              |
                       Connector gateway
                              |
                    Verify, decrypt, normalize
                              |
                     Durable ingestion queue
                              |
                 Deduplicate and link application
                              |
                  Classify canonical event/status
                              |
              Auto-accept or request user confirmation
                              |
               Append event and refresh projections
                              |
                Notify user and trigger next action
```

Rules:

1. Verify the webhook, store its delivery envelope, enqueue processing, and return quickly.
2. Assume deliveries can be duplicated, delayed, and out of order.
3. Prefer provider event IDs for idempotency; otherwise use a stable fingerprint.
4. Treat a push notification as a signal to synchronize, not necessarily the source of truth.
5. Advance a cursor only after the complete page or batch commits.
6. Send failed records to a dead-letter and replay workflow.
7. Use provider-specific mappings and monotonic transition rules, with explicit reopen/transfer exceptions.
8. Keep raw payload retention short and encrypted; normalized events follow the customer retention policy.

### 19.5 AI classification policy

The classifier may extract company, job title, external IDs, confirmation, recruiter contact, assessment deadline, interview schedule changes, offer/rejection language, and requested user action. It must return structured evidence spans and confidence.

- High-confidence, low-risk events may be appended automatically.
- Medium-confidence events appear in “Review detected update.”
- Rejection, offer, withdrawal, or linking conflicts require stricter thresholds and visible evidence.
- Low-confidence messages remain unlinked and do not change an application.
- Prompt content is untrusted data and cannot invoke tools or expose other messages.

### 19.6 Application Hub frontend

Candidate list:

```text
Applications                              Gmail: syncing · 2m ago
[All] [Needs action] [Interview] [Offer]  Outlook: not connected

Role / Company       Stage          Next action          Source
Backend · Acme       Interview      Prepare by Aug 8     ATS verified
ML Engineer · Nova   Assessment     Complete by Aug 5    Email detected
Frontend · Orbit     Submitted      Follow up Aug 10     Candidate confirmed
```

Application details should include:

- source-attributed timeline;
- documents and answers used;
- recruiter contacts;
- upcoming actions and deadlines;
- interview-preparation shortcut;
- status correction and conflict controls;
- “why CareerPilot detected this” evidence;
- connector and last-sync health.

The recruiter integration page should show ATS health, unmapped stages, failed webhooks, candidate-notification policy, and CareerPilot results sent back to the ATS.

### 19.7 Premium application intelligence

Features worth paying for:

- automatic application timelines from authorized sources;
- deadline and interview detection;
- one-click JD-specific preparation when an interview appears;
- follow-up reminders based on real events;
- evidence-backed follow-up draft generation;
- stale-application review rather than invented statuses;
- funnel analytics by source, role, resume version, and match tier;
- resume/version attribution to interviews and offers;
- recruiter response-time and conversion insights;
- duplicate application detection;
- application document and answer vault;
- organization-wide ATS sync and candidate notifications.

Background sync should be a subscription entitlement with fair-use limits, not a credit charge for every webhook or email. Credits should be reserved for expensive AI work such as interviews, deep analysis, resume generation, research, and assessment evaluation.

### 19.8 Security and connector tests

Security gates:

- OAuth authorization code flow with PKCE where supported;
- exact redirect-URI allow-list;
- refresh tokens encrypted using a managed KMS envelope key;
- tokens never returned to the browser after connection;
- tenant-scoped credential access and least-privilege scopes;
- webhook signature verification and replay window;
- body-size limits and connector-specific backoff;
- secret/PII redaction from logs;
- revoke, disconnect, and data-deletion flows;
- provider-terms review before release;
- security assessment for restricted mailbox scopes.

Test duplicate and out-of-order delivery, missing event IDs, revoked credentials, invalid signatures, partial pagination, missed push events, rate limiting, application transfer, custom stage maps, same-company duplicates, unrelated-email false positives, email/ATS conflicts, disconnect during sync, and retention deletion.

### 19.9 Delivery sequence

1. Canonical events and manual tracker.
2. Forwarding inbox and confirmation queue.
3. Explicit browser capture.
4. Outlook connector and delta reconciliation.
5. Gmail connector after verification/security readiness.
6. Greenhouse employer connector.
7. Lever employer connector.
8. Ashby and Workable connectors.
9. Customer webhook/API connector kit.
10. LinkedIn and Indeed partner applications when recruiter traction justifies certification.

## 20. Source-driven simplification: the plan we should actually execute

This section records how the TalentSync product pages and the linked VIRTUAL CODE video change the implementation order. It is the preferred delivery plan for a small team. Earlier sections remain the production and security target; they are not a requirement to build every enterprise feature before launch.

### 20.1 What to borrow from the references

TalentSync presents a useful product flow:

```text
Capture -> Structure -> Analyze -> Generate -> Decide
```

CareerPilot should reuse that clarity, not reproduce an eight-stage ML pipeline. The valuable ideas are:

- one structured candidate profile that powers resume variants, matching, interview preparation, outreach, and recruiter review;
- context and evidence instead of keyword counts alone;
- candidate and recruiter experiences built on the same underlying data;
- visible next actions, not a page full of generated text;
- resume suggestions shown as changes with reasons;
- a simple dashboard that moves the user into a workflow quickly.

The linked video advertises interview, resume, feedback, and roadmap agents, but Part 1 primarily implements authentication, Redis-backed sessions, frontend setup, a dashboard, a resume agent/scorer, and a resume builder. Its useful lesson is the feature grouping. CareerPilot should not copy its MERN rewrite, API gateway, Firebase authentication, MongoDB, Redis sessions, and microservices setup.

CareerPilot already has React, FastAPI, PostgreSQL, authentication, resume analysis, jobs, and an interview prototype. Rewriting those foundations would delay the paid product without improving user value.

### 20.2 Simplified architecture decision

Use a modular monolith:

```text
React/Vite web app
        |
FastAPI application
        |
PostgreSQL + pgvector
        |
One worker + Redis only for slow/retryable jobs
        |
Object storage and external AI/search/speech/code APIs
```

Rules:

- keep one FastAPI deployment and one React deployment;
- keep PostgreSQL as the source of truth;
- use `pgvector` instead of a shared local Chroma database;
- introduce one Redis queue only for PDF generation, long analysis, email sync, and interview report jobs;
- use LangGraph only for the interview state machine;
- call Codebox/Judge0 through a small HTTP client instead of building a sandbox first;
- use one server-side AI gateway and never accept provider keys from the browser;
- add a service boundary only when it requires independent isolation, such as untrusted code execution;
- do not add Kubernetes, Kafka, domain event buses, CQRS, or a separate service per agent for the first paid release.

Keep the repository easy to navigate:

```text
backend/
  main.py
  config.py
  db.py
  models/
  schemas/
  routers/
  services/
    ai.py
    resume.py
    matching.py
    interview.py
    billing.py
    tracking.py
    integrations/
  workers/
  tests/

frontend/src/
  app/
  api/
  components/
    ui/
    layout/
  features/
    auth/
    resume/
    jobs/
    applications/
    interview/
    recruiter/
    billing/
  pages/
```

Move files gradually when editing them. Do not perform a large folder-only rewrite before product work.

### 20.3 The six paid product slices

#### Slice 1: trustworthy account, tenant, and credits

Build organization membership, role checks, server-side secrets, short-lived access with secure refresh cookies, and a small immutable credit ledger. Stripe checkout buys a plan or a top-up. Expensive tasks reserve credits, settle actual usage, and refund failed runs. Normal browsing, saving, syncing, and viewing results do not consume credits.

Minimum tables: `organizations`, `memberships`, `credit_accounts`, `credit_ledger`, `task_runs`, and `subscriptions`.

#### Slice 2: evidence profile and resume studio

Parse a resume once into a versioned `CandidateProfile` containing work history, projects, education, skills, links, and source evidence. Reuse that structure everywhere.

The first resume pipeline is three explicit functions:

```text
extract_document -> build_candidate_profile -> analyze_against_jd
```

Return deterministic checks separately from AI advice. Show original text, suggested text, reason, and accept/reject. Generate a real PDF from structured JSON through one curated LaTeX template using Tectonic, then parse the PDF back to verify it is readable. Add more templates only after the first one is reliable.

#### Slice 3: real job matching and application workspace

Treat SerpAPI and Tavily as discovery sources, not the final ranker:

```text
discover -> normalize -> deduplicate -> verify -> hard filter -> score -> explain
```

Hard filters cover location, remote preference, employment type, experience range, visa constraints when known, freshness, and excluded companies. The score combines skill/experience evidence, semantic similarity, and user preferences. Every match displays why it fits, what is missing, source, posting age, and verification time.

Start application tracking with manual capture and a unique forwarding email. Add Outlook after the event model and confirmation queue work. Gmail, browser extension capture, and ATS connectors remain later integrations.

#### Slice 4: shared interview and coding engine

This is the hero feature. Candidate practice and recruiter assessment must use the same engine:

```text
JD + rubric + optional resume/GitHub
              |
      assessment template
              |
  voice questions + coding task
              |
 transcript/code runs/hints/evidence
              |
 evidence-linked scorecard + human review
```

The first version can be turn-based: record an answer, transcribe it, generate the next question, and play the response. This is easier to debug and audit than full-duplex real-time voice. Add streaming after the complete session flow is reliable.

Recruiters can paste a JD, edit generated competencies/questions, optionally add their own questions and coding tests, invite a candidate, and review a scorecard. Candidates can paste a JD and use the same assessment privately as practice.

For coding, embed a simple editor and call Codebox/Judge0 for execution. Store code snapshots, runs, test results, hints requested, and timestamps. Do not score typing speed, face, gaze, accent, emotion, or other protected/proxy characteristics. Do not claim to replace the hiring decision; the product prepares evidence and a recommendation for human review.

Minimum tables: `assessment_templates`, `competencies`, `questions`, `coding_tasks`, `interview_sessions`, `interview_turns`, `code_runs`, `rubric_scores`, and `review_decisions`.

#### Slice 5: concise JD roadmap

A roadmap is generated only after comparing a profile with a target JD. Limit it to the top three evidence-backed gaps. Each gap gets one outcome, one resource or exercise, one proof artifact, and a target date. Link directly into interview practice or a coding task. Avoid generic multi-month course lists.

#### Slice 6: professional role-aware frontend

Use a light operational workspace and a dark distraction-free interview room. Candidate navigation should be Overview, Matches, Applications, Resume Studio, Interview Lab, Roadmap, and Credits. Recruiter navigation should be Requisitions, Candidates, Assessments, Interviews, Question Bank, Analytics, Team, and Billing.

The signature interview screen should synchronize the current question, transcript, code editor, test runs, hints, and rubric evidence. Remove random scores, fake activity, unsupported counters, and decorative charts that do not help a decision.

### 20.4 Easy implementation sequence

Each sprint must end in one demonstrable user outcome:

1. **Stabilize:** protect every route, tenant-scope every query, remove browser API keys, remove random scores, fix lint/build, add migrations and smoke tests.
2. **Profile:** create `CandidateProfile`, resume versioning, evidence offsets, and deterministic document checks.
3. **Resume Studio:** add tracked suggestions, accept/reject, one LaTeX template, Tectonic compilation, and PDF verification.
4. **Matching:** normalize SerpAPI/Tavily results, deduplicate, hard-filter, score, explain, and save a job.
5. **Applications:** add the manual pipeline, timeline, next action, documents used, and forwarding inbox.
6. **Interview core:** create templates, rubrics, sessions, real resume/JD loading, turn persistence, and deterministic report calculations.
7. **Voice:** add recorded-answer upload, STT, generated next question, TTS, retries, consent, and transcript correction.
8. **Coding:** add editor, Codebox/Judge0 client, test cases, run history, hints, and evidence-linked technical scoring.
9. **Recruiter MVP:** add organization roles, JD-to-assessment draft, question editing, invitations, review, and exportable scorecard.
10. **Credits and launch:** add Stripe, reservations/refunds, usage UI, plan limits, audit logs, monitoring, backups, accessibility, and end-to-end tests.

### 20.5 Build now, later, and skip

| Build now | Build after users pay | Skip for the first release |
|---|---|---|
| One FastAPI app | Streaming/full-duplex voice | MERN rewrite |
| One React app | Gmail restricted-scope sync | Microservice per AI agent |
| PostgreSQL + pgvector | Greenhouse/Lever/Ashby/Workable | API gateway for one backend |
| One worker when needed | More LaTeX templates | Self-hosted code sandbox |
| One AI provider plus fallback | Team analytics and benchmarks | Kafka/Kubernetes |
| Turn-based voice interview | Enterprise SSO/SCIM | Emotion/gaze/accent scoring |
| Codebox/Judge0 API | LinkedIn/Indeed partner programs | Unsupported job-platform scraping |
| Manual + forwarding tracker | Browser capture extension | Credits for passive sync/viewing |

### 20.6 Definition of the first payable release

The release is payable only when a real user can:

1. upload a resume and obtain a structured, editable evidence profile;
2. paste a JD and receive explainable matches, a verified ATS/readability report, and a concise roadmap;
3. compile and download a valid job-specific LaTeX resume;
4. complete a JD-specific voice and coding interview with persistent evidence and a non-random report;
5. create the same assessment as a recruiter, invite a candidate, and review the evidence;
6. track an application and receive a source-attributed update without an invented status;
7. buy credits, see the exact cost before starting, and receive an automatic refund when a task fails.

If any result cannot show its source, inputs, calculation version, and uncertainty, it should be labeled as a draft rather than presented as a verified score.

### 20.7 No-mock product rule

Nothing visible in the paid product may pretend to work. A feature is either complete, explicitly labeled as a preview, or hidden behind a server-controlled feature flag.

Prohibited in production:

- random or hard-coded scores, charts, counters, activity, testimonials, candidates, jobs, and application events;
- buttons that only show a toast or open an unfinished page;
- upload controls that do not persist and use the uploaded document;
- integrations shown as connected without a verified provider connection;
- simulated progress bars unrelated to a real task;
- generated job URLs, employers, application statuses, qualifications, or interview evidence;
- silently falling back to sample data when an API fails;
- claiming an AI result is an ATS score, verified match, or hiring decision without a defined calculation and evidence;
- displaying future functionality in normal navigation as if it is available.

Every visible feature must have:

1. a real authenticated backend endpoint;
2. tenant-scoped persisted data;
3. loading, empty, success, partial-failure, and error states;
4. source and freshness information where external data is involved;
5. deterministic identifiers and idempotency for paid/background work;
6. authorization and input validation;
7. usage/cost recording where credits are consumed;
8. logs and operational monitoring;
9. at least one integration test and one end-to-end happy-path test;
10. honest UI copy describing uncertainty and limitations.

The current interview prototype must not ship until:

- selected resume and JD records are actually loaded;
- upload controls create persisted records;
- questions, answers, transcripts, code runs, hints, and report evidence survive a refresh;
- all report dimensions come from a versioned rubric calculation;
- retries and interrupted sessions work;
- the candidate can inspect or correct the transcript;
- the recruiter can see why each score was assigned;
- browser or provider failure produces a recoverable error, not a fabricated result.

The current job and resume features must not ship until:

- every job card has an actual source URL, provider, fetched time, and verification state;
- expired, duplicated, and unverifiable jobs are removed or visibly labeled;
- match explanations cite candidate and JD evidence;
- ATS/readability checks distinguish deterministic checks from AI suggestions;
- resume suggestions show the source text and never invent experience;
- generated LaTeX compiles, produces a readable PDF, and is stored as a version.

The application hub must not ship until every status shows whether it was candidate-confirmed, email-detected, or ATS-verified. Silence must never become a rejection or any other invented state.

Demo mode is allowed only as a separate workspace with a persistent Demo data banner, synthetic identities, disabled billing, and no mixing with real customer analytics. Screenshots and marketing demos must use that same labeled environment.

Release rule: no real backend, no persisted result, or no evidence means the feature is not shown.

### 20.8 Profile-wise and company-wise roadmaps

Roadmap has two modes powered by the same candidate profile and evidence model.

#### Profile roadmap

Use the candidate's structured profile, target role, preferred location, experience level, available weekly time, and target date. Compare current evidence with a versioned role-skill framework.

It should answer:

- which target roles are realistic now;
- the top three evidence gaps;
- which existing skills and projects already transfer;
- which resume/GitHub evidence is weak or missing;
- the next project, coding exercise, interview, or resume improvement to complete;
- how readiness changed after verified work.

Profile roadmap items are not generic course recommendations. Every item contains an outcome, reason, evidence gap, action, proof requirement, effort estimate, due date, and linked CareerPilot activity.

#### Company roadmap

Use a candidate profile plus company, role, and preferably the exact JD. Company research must come from live, attributable sources and show retrieval time. When a fact or interview pattern cannot be verified, label it as anecdotal or unknown.

The company roadmap combines:

1. profile-to-JD gaps;
2. company product/domain knowledge;
3. verified engineering or role expectations;
4. likely competency areas from the JD;
5. a company-specific voice and coding assessment;
6. resume and project evidence that should be emphasized;
7. questions the candidate should ask the interviewer.

Do not claim that a company uses a particular interview round, technology, question, or scoring method unless the source supports it. Public interview reports are preparation hints, not guaranteed process facts.

#### Shared implementation

Keep the code explicit:

    build_profile_gap(profile_id, target_role)
    research_company(company, role, jd)
    create_roadmap(gaps, research, constraints)
    verify_roadmap_progress(roadmap_id)

Minimum tables:

- roadmaps;
- roadmap_items;
- roadmap_evidence;
- roadmap_progress_events;
- company_research_snapshots.

Each roadmap item stores type, priority, gap, reason, action, proof requirement, estimate, due date, status, source references, and linked feature route. Progress is updated by real evidence such as a passed coding task, completed interview, accepted resume change, added project, or user-confirmed external result. Clicking a checkbox alone does not increase verified readiness.

Frontend:

    Roadmap
      My Profile
        Target role | Readiness | Top gaps | This week

      Target Company
        Company | Role | JD | Research freshness
        Fit gaps | Preparation plan | Company interview practice

Limit the initial plan to three current priorities and one next action. Recalculate only when the profile, target JD, company research, or verified evidence changes.
