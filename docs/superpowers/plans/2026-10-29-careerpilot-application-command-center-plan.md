# CareerPilot Application Command Center & Tailoring Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CareerPilot into an All-In-One Application Command Center by implementing Universal Job Link Ingestion, the 4-in-1 Application Bundle (ATS Harvard PDF + Tailored Cover Letter + Screening Answers + Outreach), and an evidence-grounded Role Interview Prep Simulator directly inside the core web application.

**Architecture:** 
- Universal scraper (`services/job_scraper_service.py`) parses any job URL (Lever, Greenhouse, Workday, Ashby, LinkedIn) into standard Job models with clean text-paste fallback.
- Cover letter engine (`services/cover_letter_service.py`) synthesizes authentic candidate project evidence into a high-conversion 3-paragraph letter.
- Role interview simulator (`services/interview_prep_service.py`) analyzes job requirements and candidate resume evidence to generate technical questions, behavioral questions with model STAR answers, and questions for the interviewer.
- Unified bundle API (`POST /resume-studio/application-bundle`) packages all four application assets.
- Rich frontend modals and drawers in `SearchJobs.jsx` and `Applications.jsx` provide frictionless access.

**Tech Stack:** Python 3.12/3.14 (FastAPI, SQLAlchemy, Pydantic, BeautifulSoup4/urllib, ReportLab), React 18, Tailwind CSS, Lucide icons, Node.js test runner.

**Spec:** [`docs/superpowers/specs/2026-10-29-careerpilot-application-command-center-prd.md`](../specs/2026-10-29-careerpilot-application-command-center-prd.md)

## Global Constraints

- **Strict TDD**: Write failing unit tests first, verify the failure, write minimal passing code, verify all pass, commit.
- **Zero Mock AI**: All cover letters, screening answers, and interview prep questions run through deterministic truth guards or Google Gemini API; zero ungrounded synthetic text.
- **Single Source of Truth**: All ingested jobs, bundles, and interview prep records persist to SQLite/PostgreSQL through existing SQLAlchemy models.
- **Backwards Compatibility**: Do not break any existing contracts on `/jobs`, `/matches`, `/applications`, `/growth`, or `/resume-studio`.
- **Clean Production Builds**: 100% test pass rate across backend and frontend suites, 0 ESLint errors.

---

### Task 1: Universal Job Link Ingestor & Scraper Service

**Files:**
- Create: `backend/services/job_scraper_service.py`
- Modify: `backend/routers/job_router.py`
- Test: `backend/tests/test_job_scraper_service.py`

**Interfaces:**
- Produces: `scrape_job_posting(url: str, fallback_html: str = "") -> dict`
  - Output schema:
    ```python
    {
        "title": str,
        "company": str,
        "location": str,
        "description": str,
        "source": str,
        "url": str
    }
    ```
- Produces: `POST /jobs/ingest-url`
  - Body: `{"url": str, "fallback_text": str | None = None}`
  - Returns: Job record + initial ATS match result.

- [ ] **Step 1: Write failing unit test for job scraper**

```python
# backend/tests/test_job_scraper_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_scraper_service import parse_job_html_content

class JobScraperServiceTests(TestCase):
    def test_parses_lever_html_structure(self):
        html = """
        <html>
        <head><title>Stripe - Backend Engineer</title></head>
        <body>
            <div class="posting-headline"><h2>Backend Engineer</h2></div>
            <div class="posting-categories"><div class="location">Bengaluru</div></div>
            <div class="section-wrapper page-full-width">
                <p>We are looking for a backend engineer with Python and SQL experience. 0-2 years experience.</p>
            </div>
        </body>
        </html>
        """
        result = parse_job_html_content("https://jobs.lever.co/stripe/123", html)
        self.assertEqual("Backend Engineer", result["title"])
        self.assertEqual("Stripe", result["company"])
        self.assertEqual("Bengaluru", result["location"])
        self.assertIn("Python", result["description"])

    def test_parses_greenhouse_html_structure(self):
        html = """
        <html>
        <head><title>Airbnb Careers</title></head>
        <body>
            <h1 class="app-title">Software Engineer, Infrastructure</h1>
            <div class="company-name">Airbnb</div>
            <div class="location">Remote</div>
            <div id="content">Requirements: Python, AWS, Docker. 0-1 years.</div>
        </body>
        </html>
        """
        result = parse_job_html_content("https://boards.greenhouse.io/airbnb/jobs/456", html)
        self.assertEqual("Software Engineer, Infrastructure", result["title"])
        self.assertEqual("Airbnb", result["company"])
        self.assertIn("Docker", result["description"])
```

- [ ] **Step 2: Run test to verify it fails**
  Run: `python -m unittest backend/tests/test_job_scraper_service.py`
  Expected: FAIL (`ModuleNotFoundError: No module named 'services.job_scraper_service'`)

- [ ] **Step 3: Implement `job_scraper_service.py` and `POST /jobs/ingest-url`**
  - Implement HTML parsing with meta tags (`og:title`, `og:site_name`), title tag splitting, and selector extraction.
  - Implement HTTP GET with standard user-agent and 4s timeout in `scrape_job_posting`.
  - Add `POST /jobs/ingest-url` to `backend/routers/job_router.py`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `python -m unittest backend/tests/test_job_scraper_service.py`
  Expected: PASS

- [ ] **Step 5: Commit Task 1**
  ```bash
  git add backend/services/job_scraper_service.py backend/routers/job_router.py backend/tests/test_job_scraper_service.py
  git commit -m "feat: implement universal job link ingestor with platform-specific HTML parsing"
  ```

---

### Task 2: Truth-Guarded Cover Letter Generation Engine

**Files:**
- Create: `backend/services/cover_letter_service.py`
- Modify: `backend/routers/resume_studio_router.py`
- Test: `backend/tests/test_cover_letter_service.py`

**Interfaces:**
- Produces: `generate_tailored_cover_letter(candidate_name: str, resume_text: str, job_title: str, company: str, job_description: str) -> dict`
- Output schema:
  ```python
  {
      "subject": str,
      "full_text": str,
      "hook_paragraph": str,
      "evidence_paragraph": str,
      "closing_paragraph": str,
      "referenced_skills": list[str]
  }
  ```

- [ ] **Step 1: Write failing unit test for cover letter generator**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `cover_letter_service.py`**
  - Extracts verified candidate skills matching the job description using `matching_service._evidence_map`.
  - Constructs a concise 3-paragraph letter:
    - Paragraph 1: Direct application declaration with genuine enthusiasm for the company's product/mission.
    - Paragraph 2: Explicit demonstration of 2 verified skills/projects with quantitative results from resume.
    - Paragraph 3: Professional closing with availability and portfolio link.
  - Guarantees 0 ungrounded claims or hallucinated roles.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit Task 2**

---

### Task 3: Role Interview Prep Simulator Engine

**Files:**
- Create: `backend/services/interview_prep_service.py`
- Create: `backend/routers/interview_router.py`
- Modify: `backend/main.py`
- Test: `backend/tests/test_interview_prep_service.py`

**Interfaces:**
- Produces: `generate_interview_prep_kit(job_title: str, company: str, job_description: str, resume_text: str) -> dict`
- Output schema:
  ```python
  {
      "role_summary": str,
      "technical_questions": list[{
          "question": str,
          "category": str,
          "why_they_ask": str,
          "star_answer_blueprint": str
      }],
      "behavioral_questions": list[{
          "question": str,
          "competency": str,
          "star_answer_blueprint": str
      }],
      "questions_for_interviewer": list[str]
  }
  ```
- Produces: `GET /interview-prep/{application_id}` (or `POST /interview-prep/generate`)

- [ ] **Step 1: Write failing unit test for interview prep kit**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `interview_prep_service.py` and `interview_router.py`**
  - Inspects required skills in JD (e.g. Python, SQL, Docker, Redis) and generates targeted technical questions with model STAR answers referencing the student's actual resume evidence.
  - Generates behavioral questions (handling bugs, prioritization, cross-team collaboration).
  - Generates intelligent questions to ask the interviewer.
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit Task 3**

---

### Task 4: Complete 4-in-1 Application Bundle API Endpoint

**Files:**
- Modify: `backend/routers/resume_studio_router.py`
- Test: `backend/tests/test_application_bundle_api.py`

**Interfaces:**
- Produces: `POST /resume-studio/application-bundle`
  - Body: `{"job_id": str, "resume_id": str | None = None}`
  - Returns:
    ```python
    {
        "job": dict,
        "ats_score": int,
        "ats_diagnostic": dict,
        "tailored_resume_version_id": str,
        "cover_letter": dict,
        "screening_answers": list[dict],
        "outreach": dict
    }
    ```

- [ ] **Step 1: Write failing test asserting complete bundle output**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement `generate_application_bundle` in `resume_studio_router.py`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit Task 4**

---

### Task 5: Frontend Universal Job Ingestor in `SearchJobs.jsx`

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Test: `frontend/src/app/job-workspace.test.js`

**Interfaces:**
- In `api.js`: Add `ingestJobUrl(url, fallbackText)`
- In `SearchJobs.jsx`:
  - Add "Paste Job Link / Add Custom Job" header button.
  - Interactive Ingestion Modal with URL input and optional text fallback drawer.
  - Displays instant loading spinner $\to$ auto-selects the scraped job in the workspace with its 100-pt ATS score.

- [ ] **Step 1: Write test for URL ingestion state update**
- [ ] **Step 2: Implement UI modal and API call in `SearchJobs.jsx`**
- [ ] **Step 3: Verify frontend tests and linter pass**
- [ ] **Step 4: Commit Task 5**

---

### Task 6: Frontend 4-in-1 Application Bundle & Role Interview Prep in `Applications.jsx`

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/Applications.jsx`
- Modify: `frontend/src/pages/SearchJobs.jsx`

**Interfaces:**
- In `api.js`: Add `getApplicationBundle(jobId)` and `getInterviewPrep(applicationId)`
- In `Applications.jsx`:
  - Add "Application Bundle" button on each Kanban card: opens modal with 4 tabs:
    1. ATS Harvard PDF (preview & download)
    2. Tailored Cover Letter (view, copy, download `.txt`)
    3. Screening Answers Drawer (interactive accordion with 1-click copy)
    4. Recruiter Outreach Toolkit (LinkedIn note & Cold Email)
  - Add "Interview Prep" button on Kanban cards (for `Preparing`, `Applied`, `Assessment`, `Interview`): opens modal with:
    - 5 Technical Q&As with Model STAR Answers
    - 3 Behavioral Q&As
    - Questions for the Interviewer
- In `SearchJobs.jsx`:
  - Add "Application Bundle" quick-action button directly in the job details pane.

- [ ] **Step 1: Implement Application Bundle and Interview Prep modals in `Applications.jsx`**
- [ ] **Step 2: Implement Application Bundle button in `SearchJobs.jsx`**
- [ ] **Step 3: Verify `npm test`, `npm run lint`, and `npm run build` pass**
- [ ] **Step 4: Commit Task 6**

---

### Task 7: Comprehensive Regression Verification & Remote Push

- [ ] **Step 1: Run all backend unit tests**
  `python -m unittest backend/tests/test_*.py`
- [ ] **Step 2: Run 4-tier E2E contract test suite**
  `python tests/run_e2e.py`
- [ ] **Step 3: Run all frontend unit tests**
  `npm --prefix frontend test`
- [ ] **Step 4: Run frontend linter**
  `npm --prefix frontend run lint`
- [ ] **Step 5: Run frontend production build**
  `npm --prefix frontend run build`
- [ ] **Step 6: Push commits to remote**
  `git push origin main`
