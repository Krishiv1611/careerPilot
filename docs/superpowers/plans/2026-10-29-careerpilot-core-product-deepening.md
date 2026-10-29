# CareerPilot Core Product Deepening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing CareerPilot web application into an indispensable daily tool by adding Universal Job Ingestion ("Paste & Analyze Any Job") and an Interactive In-Browser Resume Studio with live 100-Point ATS score recalculation and 1-click Harvard PDF export.

**Architecture:** 
- A dedicated custom job ingestion route (`POST /jobs/custom`) in `backend/routers/job_router.py` saves pasted job descriptions and runs the authoritative 100-point ATS diagnostic against the user's active resume.
- A live ATS score evaluation endpoint (`POST /resume-studio/score-live`), STAR bullet enhancer (`POST /resume-studio/enhance-bullet`), and direct ATS PDF compiler (`POST /resume-studio/export-pdf-direct`) in `backend/routers/resume_studio_router.py`.
- Frontend enhancements in `frontend/src/pages/SearchJobs.jsx` (Paste & Analyze Job modal) and `frontend/src/pages/ResumeStudio.jsx` (interactive live resume editor with real-time score recalculation and 1-click Harvard PDF download).

**Tech Stack:** Python 3.12/3.14 (FastAPI, SQLAlchemy, ReportLab, Pydantic), React 18, Tailwind CSS, Lucide icons, Node.js test runner.

---

### Task 1: Backend Custom Job Ingestion & Instant ATS Matching

**Files:**
- Modify: `backend/routers/job_router.py`
- Modify: `backend/services/matching_service.py`
- Test: `backend/tests/test_custom_job_ingestion.py`

**Interfaces:**
- Produces: `POST /jobs/custom`
  - Body: `{"title": str, "company": str, "description": str, "location": str | None = "Remote"}`
  - Returns: `{"job": dict, "match": dict, "ats_score": int, "ats_diagnostic": dict}`

- [ ] **Step 1: Write failing unit test for custom job ingestion**

```python
# backend/tests/test_custom_job_ingestion.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_discovery_service import is_fresher_job
from services.matching_service import match_resume_to_job

class CustomJobIngestionTests(TestCase):
    def test_custom_job_text_matches_and_generates_ats_diagnostic(self):
        resume = """John Doe
john@example.com | github.com/johndoe

TECHNICAL SKILLS
Python, SQL, FastAPI

EXPERIENCE
- Engineered REST APIs using Python and FastAPI with 30% latency reduction.
"""
        jd = "Requirements: Python, FastAPI, Docker. 0-2 years experience."
        result = match_resume_to_job(resume, jd, job_title="Backend Developer")
        
        self.assertIn("ats_diagnostic", result)
        self.assertGreaterEqual(result["ats_score"], 60)
        self.assertIn("docker", result["missing_must_haves"])
```

- [ ] **Step 2: Run test to verify it passes or check baseline**
  Run: `python -m unittest backend/tests/test_custom_job_ingestion.py`

- [ ] **Step 3: Implement `POST /jobs/custom` in `backend/routers/job_router.py`**
  - Accepts custom job payload.
  - Generates a UUID and persists to `Job` and `UserJob` with `source="Direct Paste"`.
  - Runs `match_resume_to_job` against the user's latest resume and saves `MatchResult`.
  - Returns created job and match analysis.

- [ ] **Step 4: Verify test passes and commit**

---

### Task 2: Live ATS Scoring & STAR Bullet Enhancer Service

**Files:**
- Create: `backend/services/bullet_enhancer_service.py`
- Modify: `backend/routers/resume_studio_router.py`
- Test: `backend/tests/test_bullet_enhancer_service.py`

**Interfaces:**
- Produces: `enhance_bullet_star(bullet: str, skill_context: list[str] | None = None) -> dict`
  - Output schema:
    ```python
    {
        "original": str,
        "enhanced": str,
        "action_verb": str,
        "improved_metrics": bool
    }
    ```
- Produces: `POST /resume-studio/score-live`
  - Body: `{"resume_text": str, "job_description": str}`
  - Returns: `calculate_ats_score(resume_text, job_description)`
- Produces: `POST /resume-studio/enhance-bullet`
  - Body: `{"bullet": str, "skill_context": list[str] | None = None}`
  - Returns: enhanced bullet with STAR framing without hallucinating unearned tools.
- Produces: `POST /resume-studio/export-pdf-direct`
  - Body: `{"content": str}`
  - Returns: StreamingResponse PDF bytes (using `generate_ats_pdf`).

- [ ] **Step 1: Write failing unit test for bullet enhancer**
- [ ] **Step 2: Implement `bullet_enhancer_service.py` and endpoints in `resume_studio_router.py`**
- [ ] **Step 3: Run test to verify it passes**
- [ ] **Step 4: Commit Task 2**

---

### Task 3: Frontend "Paste & Analyze Any Job" Modal in `SearchJobs.jsx`

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Test: `frontend/src/app/job-workspace.test.js`

**Interfaces:**
- In `api.js`: Add `addCustomJob({ title, company, description, location })`
- In `SearchJobs.jsx`:
  - Add "Paste & Analyze Any Job" button next to "Search jobs".
  - Clean Modal with:
    - Job Title (optional, defaults to "Software Engineer")
    - Company Name (optional, defaults to "Target Company")
    - Full Job Description textarea
    - "Analyze & Save to Workspace" button
  - When submitted: calls `addCustomJob`, prepends to job list, selects it immediately, and displays the 100-pt ATS score and Hard Blocker chips.
  - "Tailor in Resume Studio" 1-click action button that navigates directly to `/profile/tailor?job=<id>`.

- [ ] **Step 1: Update `api.js`**
- [ ] **Step 2: Implement modal in `SearchJobs.jsx`**
- [ ] **Step 3: Run frontend tests & lint**
- [ ] **Step 4: Commit Task 3**

---

### Task 4: Frontend Live-Editing Resume Studio with Real-Time ATS Scorecard

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/ResumeStudio.jsx`

**Interfaces:**
- In `api.js`: Add `scoreResumeLive(resumeText, jobDescription)`, `enhanceBullet(bullet, skills)`, `downloadDirectPdf(content)`
- In `ResumeStudio.jsx`:
  - Center Canvas features an interactive editable mode.
  - Direct textarea allows typing, deleting, and modifying bullets freely.
  - Debounced (250ms) call to `scoreResumeLive`: recalculates the 100-pt ATS score, letter grade, and 4 pillar bars in the left panel in real-time as the candidate types!
  - "Enhance Bullet (STAR)" button: user highlights or clicks a bullet to get an instant STAR rewrite suggestion.
  - "Download Harvard ATS PDF" button: calls `downloadDirectPdf` and downloads the single-column PDF.

- [ ] **Step 1: Update `api.js` with live scoring and direct export**
- [ ] **Step 2: Implement editable canvas and real-time score syncing in `ResumeStudio.jsx`**
- [ ] **Step 3: Verify frontend tests, ESLint, and Vite build pass**
- [ ] **Step 4: Commit Task 4**

---

### Task 5: Comprehensive Verification Run & Remote Push

- [ ] **Step 1: Run all backend unit tests**
  `python -m unittest backend/tests/test_*.py`
- [ ] **Step 2: Run 4-tier E2E contract test suite**
  `python tests/run_e2e.py`
- [ ] **Step 3: Run frontend unit tests**
  `npm --prefix frontend test`
- [ ] **Step 4: Run frontend linter**
  `npm --prefix frontend run lint`
- [ ] **Step 5: Run frontend production build**
  `npm --prefix frontend run build`
- [ ] **Step 6: Push commits to remote**
  `git push origin main`
