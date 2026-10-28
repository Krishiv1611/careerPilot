# CareerPilot Production Transformation: Strategy, Architecture & Roadmap

**Date:** 2026-10-28  
**Document Type:** Strategic Product Specification & Architectural Blueprint  
**Status:** Approved via `/grill-me` Interactive Design Tree  
**Primary Objective:** Elevate CareerPilot from a full-stack portfolio prototype into an indispensable, daily-active Application Co-Pilot for students and fresh graduates.

---

## 1. Brutally Honest Codebase Audit: What Was Mocked, Shallow, or Vulnerable

### 1.1 Orphaned Features & Dead Ends
1. **Orphaned `ats_score` Column**:
   - `backend/models/application_model.py` had an `ats_score = Column(Float, nullable=True)`, but **no service calculated it**, no API endpoint returned it, and the frontend never displayed it.
2. **Shallow Growth Plan (`growth_service.py`)**:
   - `build_growth_plan()` merely counted recurring missing skills and formatted a generic string: `"Build or verify one small project using {skill}..."`
   - `complete_growth_priority()` accepted **any arbitrary string URL** without checking if the GitHub repo existed, belonged to the candidate, had commits, or actually implemented the required technology.
3. **Enterprise GitHub App Barrier (`github_mcp_service.py`)**:
   - Connecting GitHub evidence required setting up a full GitHub App with RSA private keys, app slugs, and installation tokens (`GITHUB_APP_PRIVATE_KEY`, `GITHUB_MCP_URL`). 99% of students cannot set this up, causing the feature to fail.
4. **Fragile API Dependency in Job Discovery (`job_discovery_service.py`)**:
   - Completely reliant on SerpAPI (100 free queries/month) and Tavily (1000 queries/month). Once free quotas exhaust, job search yields 0 jobs.
5. **No Actual Application Assistance**:
   - CareerPilot previously acted as a glorified spreadsheet with a resume rewriter. When a student clicked a job link, they were tossed into a tedious 20-page Workday/Lever form and left to type everything manually.

### 1.2 UX & Loophole Breakdown
- **The "Homework" Problem**: A tool that requires manual status updates ("Move to Applied", "Move to Interview") is abandoned within 3 days. Students forget to update statuses when they receive confirmation emails.
- **The Stale Job Problem**: Aggregated Google Jobs search links often lead to expired 30-day-old postings or third-party scraper spam boards (Monster, Shine, ClickCity).
- **The ATS Black Box**: Students get rejected by ATS software (Workday, Taleo, Greenhouse) without knowing why: wrong date format, tables that break OCR, non-standard section titles, or missing must-have keywords.

---

## 2. Core Strategic Transformation: The End-to-End Application Co-Pilot

To make CareerPilot an indispensable product, we focus on four core pillars:

```
[Candidate Core Profile & Tailored Resume]
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│  Phase 1: Truth-Guarded Engine & Real Proof            │
│  - 100-Point Deterministic ATS Diagnostic Engine       │
│  - Actionable Growth Recipes + GitHub Repo Verifier    │
│  - Direct ATS Feed Aggregation (Ashby, Lever, GH APIs) │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Phase 2: Chrome Extension Co-Pilot                    │
│  - Manifest V3 SidePanel + Content Script             │
│  - Instant On-Page Job Description Analysis & Score    │
│  - 1-Click Form Autofill for Lever, Greenhouse, Workday│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│  Phase 3: Automated Pipeline & Sync                    │
│  - Confirmation Page Tab Sniffer (Auto-sets "Applied") │
│  - Inbound Email Parser (Interviews & Status Changes)  │
│  - Real-Time Daily Priority Dashboard                  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Pillar Specifications

### 3.1 Pillar 1: The 100-Point Deterministic ATS Diagnostic Engine

Replaces the orphaned `ats_score` with an authoritative, explainable audit across four distinct 25-35 point dimensions:

1. **Machine Parseability & Format Safety (25 Points)**:
   - Single-column standard flow check (no dual-column tables or text boxes that confuse Taleo/Workday).
   - Standard uppercase section header recognition (`EXPERIENCE`, `EDUCATION`, `SKILLS`, `PROJECTS`).
   - Clean contact metadata (RFC-compliant email, phone, location, no weird unicode symbols).
2. **Job Description Keyword & Skill Density (35 Points)**:
   - Must-have hard skills coverage: $\frac{\text{Matched Must-Haves}}{\text{Total Must-Haves}} \times 25$.
   - Preferred/bonus skills coverage: $\frac{\text{Matched Preferred}}{\text{Total Preferred}} \times 10$.
3. **Action Verbs & Quantitative Impact (25 Points)**:
   - Action Verb Ratio: Percentage of bullets beginning with strong verbs (Engineered, Architected, Designed).
   - Metric Density: Points awarded for quantifiable results (%, numbers, latency, throughput, scale).
4. **Structural Completeness & Hygiene (15 Points)**:
   - Presence of essential sections: Education, Technical Skills, Projects/Experience.
   - Bullet length and density hygiene (no run-on paragraphs > 4 lines).

**Output**: Returns an overall score (0-100), grade (A: 90+, B: 75-89, C: 60-74, Needs Work: <60), plus specific actionable warnings:
- e.g., *"Missing critical must-have keyword: Docker (-12 pts)"*
- *"Section 'Work History' should be renamed to 'EXPERIENCE' for Taleo ATS compatibility (-5 pts)"*
- *"Only 1 of 4 project bullets includes measurable quantitative impact (-8 pts)"*

---

### 3.2 Pillar 2: Actionable Growth Recipes & Automated GitHub Verifier

Replaces generic text strings with concrete project blueprints and code verification:

1. **Structured Weekend Project Recipes**:
   - For every major tech stack (Docker, Kubernetes, Redis, Kafka, FastAPI, GraphQL, React):
     - Architecture blueprint
     - Minimum required file tree (e.g. for Docker: `Dockerfile`, `docker-compose.yml`, multi-stage build instructions)
     - Test criteria (e.g., container builds and exposes port 8000)
2. **Automated GitHub Repo Inspector**:
   - Candidate submits a GitHub repo URL (e.g., `https://github.com/user/docker-fastapi-demo`).
   - CareerPilot calls the GitHub Public API to inspect:
     - Repo exists and is public
     - Primary repository language matches the target skill
     - Target configuration files exist (`Dockerfile`, `redis.conf`, etc.)
     - Minimum commit history exists (not a blank empty repo)
   - Once verified, CareerPilot awards a **"Verified Project Badge"**, marks the growth priority as completed, and auto-generates a STAR resume bullet point ready to add to the resume!

---

### 3.3 Pillar 3: Manifest V3 Chrome Extension Co-Pilot

A purpose-built Chrome Extension residing in the browser SidePanel:

1. **On-Page ATS & Career Site Detection**:
   - Detects when student is on:
     - Lever (`jobs.lever.co/*`)
     - Greenhouse (`boards.greenhouse.io/*`)
     - Workday (`*.myworkdayjobs.com/*`)
     - Ashby (`jobs.ashbyhq.com/*`)
     - LinkedIn Job View (`linkedin.com/jobs/view/*`)
2. **SidePanel Live Match & Evidence Analysis**:
   - Content script extracts the job title, company name, and full description directly from the DOM.
   - SidePanel calculates the real-time ATS match score against the student's active resume.
   - Highlights Hard Blockers and Missing Skills before the student wastes time applying.
3. **1-Click DOM Autofill**:
   - Pre-fills standard candidate fields: Full Name, Email, Phone, LinkedIn URL, GitHub URL, Portfolio.
   - Automatically populates Education and Experience inputs on supported multi-step ATS forms.
   - Generates tailored answers for common screening questions ("Why do you want to work here?", "Describe your experience with Python").
4. **Instant Application Save & Tracking**:
   - 1-click "Save to CareerPilot" directly from the side panel.

---

### 3.4 Pillar 4: Dual-Mode Application Tracker

Eliminates manual status tracking:

1. **Confirmation Tab Sniffer (Extension)**:
   - Watches for standard ATS submission redirect URLs and confirmation headings:
     - `*/thanks*`, `*/confirmation*`, `*/applied*`
     - DOM markers: *"Thank you for your application"*, *"Application submitted"*, *"We've received your application"*
   - Automatically posts an event to CareerPilot: updates status from `Preparing` $\to$ `Applied` with current timestamp and auto-logs confirmation details.
2. **Inbound Email Sync (Optional IMAP / Gmail Parser)**:
   - Reads candidate's application inbox for sender patterns (`*@greenhouse.io`, `*@lever.co`, `*@myworkdayjobs.com`).
   - Keyword classifier detects:
     - Assessment Invites (*"HackerRank"*, *"Codesignal"*, *"Take-home test"*) $\to$ Sets status to `Assessment`.
     - Interview Invites (*"Invitation to interview"*, *"Schedule time with our team"*) $\to$ Sets status to `Interview`.
     - Rejection notices (*"decided to pursue other candidates"*, *"not moving forward"*) $\to$ Sets status to `Rejected`.

---

## 4. Phased Implementation Roadmap

```mermaid
flowchart TD
    subgraph Phase 1 [Phase 1: Backend Truth Engine & Verified Proof]
        P1_1[Deterministic 100-Point ATS Scoring Engine] --> P1_2[Actionable Growth Blueprints & GitHub Repo Verifier]
        P1_2 --> P1_3[Direct ATS API Job Ingestion Lever/Ashby/GH]
    end

    subgraph Phase 2 [Phase 2: Chrome Extension Co-Pilot]
        P2_1[Manifest V3 Extension & SidePanel UI] --> P2_2[DOM Job Description Extractor & Live Match]
        P2_2 --> P2_3[1-Click ATS Form Autofiller Lever/GH/Workday]
    end

    subgraph Phase 3 [Phase 3: Automated Pipeline & Sync]
        P3_1[Extension Tab Submission Sniffer] --> P3_2[Inbound Email Job Status Classifier]
        P3_2 --> P3_3[Unified Daily Action Command Center]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
```

---

## 5. Verification & Testing Gate

Every phase must satisfy:
1. **Zero Mock AI**: All prompts execute against Google Gemini API or deterministic truth guards.
2. **TDD Strictness**: Failing test cases created first for every rubric, verifier, and parser before code is written.
3. **Production Build Integrity**: 100% test pass rate across backend and frontend suites, 0 ESLint errors, clean bundle compilation.
