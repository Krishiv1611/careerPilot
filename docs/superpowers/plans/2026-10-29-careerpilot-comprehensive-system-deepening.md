# CareerPilot Full Product Deepening & Comprehensive Hero Suite Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate all 4 Hero Features and Core Workflows into world-class, category-defining capabilities across the desktop web application:
1. **Hero 1 (The Recruiter's 6-Second X-Ray Mode)**: Add interactive 1-click "Replace Fluff with STAR" auto-remediation, F-pattern eye-tracking visual scan overlay, and 3-reviewer persona verdicts (Screener, Hiring Manager, Tech Lead).
2. **Hero 2 (The Resume Defense Stress-Tester)**: Add Claim Vulnerability Ratings (`High Risk`, `Medium Risk`, `Rock Solid`), technical interview defense blueprints with copyable code snippets (FastAPI, Docker, PostgreSQL, Redis), and practice answer evaluation.
3. **Hero 3 (The Job Reality & Red Flag Auditor)**: Wire universal discovery search auditing in `discovery_router.py`, add interactive health filters (`All`, `Healthy Roles ≥ 70`, `Cautions`), and rich 0-100 visual diagnostic meters.
4. **Hero 4 (The Application Autopsy & Gap Recovery Engine)**: Add Pre-Mortem Risk Audits for active applications, in-drawer live GitHub repository verification, and deep-linking into `Growth.jsx` via `/growth?skill=...`.
5. **Core Application Pack & Outreach Toolkit**: Add multi-channel outreach variants (LinkedIn Connection `< 300` chars, Alumni Casual `< 200` chars, Cold InMail/Email with Subject line).
6. **Launch Control Tower & Full Regression**: Multi-agent constraint evals, 230 E2E contract tests, 30+ frontend tests, ESLint, and Vite production build.

**Architecture:** A multi-agent hybrid architecture where specialized deterministic analyzers (Auditor, X-Ray, ATS Scorer) operate concurrently with structured generative blueprints (Stress-Tester, Autopsy, Multi-Channel Outreach). Grounded strictly in candidate resume text, target job descriptions, and verified GitHub evidence.

**Tech Stack:** Python (FastAPI, SQLAlchemy, Pydantic v2, ReportLab Platypus, Unittest), React 18, React Router v6, Tailwind CSS, Lucide React, Node.js test runner (`node --test`).

**Spec:** [`docs/superpowers/specs/2026-10-29-careerpilot-application-command-center-prd.md`](file:///d:/projects/careerPilot/docs/superpowers/specs/2026-10-29-careerpilot-application-command-center-prd.md)

## Global Constraints

- **Strict Truth-Guarding**: Zero hallucinated tools, metrics, or experiences. All fatal blockers and defense blueprints must ground exclusively in candidate code, confirmed skills, and real blueprints.
- **Strict Character Limits**: Recruiter LinkedIn connection notes must strictly measure `< 300` characters; Alumni notes `< 200` characters.
- **Pure Web Responsive**: Native desktop web application adhering strictly to the Modern Minimalist palette (`#36454f`, `#202a30`, `#708090`, `#d3d3d3`). Zero browser extensions.
- **Sub-Second Performance**: Live scoring, X-Ray scans, and reality audits recalculate in $< 50\text{ms}$.
- **Test Integrity**: Every task backed by unit tests following strict TDD (failing test first, verify failure, write minimal code, verify pass, commit).

---

## Task Decomposition

### Task 1: Hero 3 (Job Reality Auditor) Universal Ingestion & Health Filter in `SearchJobs.jsx`

**Files:**
- Modify: `backend/routers/discovery_router.py`
- Modify: `frontend/src/app/job-workspace.js`
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Test: `backend/tests/test_discovery_job_health.py`
- Test: `frontend/src/app/job-workspace.test.js`

**Interfaces:**
- In `backend/routers/discovery_router.py`: Embed `job_health` into all discovered search results in `_job_response`.
- In `frontend/src/app/job-workspace.js`: Export `filterJobsByHealth(jobs, filterMode: 'all' | 'healthy' | 'caution') -> list`.
- In `frontend/src/pages/SearchJobs.jsx`:
  - Health filter selector above job feed: `[ All Roles (N) ]`, `[ 🛡️ Healthy Only ≥70 (N) ]`, `[ ⚠ Cautions & Overload (N) ]`.
  - Prominent 0-100 visual score gauge with dynamic color badge (`emerald` $\ge 80$, `amber` $\ge 55$, `rose` $< 55$).
  - Callouts for ghost-job risk, junior tech stack overload, and burnout phrases.

- [ ] **Step 1: Write failing test in `backend/tests/test_discovery_job_health.py`**

```python
# backend/tests/test_discovery_job_health.py
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import MagicMock

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from routers.discovery_router import _job_response

class DiscoveryJobHealthTests(TestCase):
    def test_discovery_search_job_response_embeds_role_health_data(self):
        record = MagicMock()
        record.id = "disc-job-123"
        record.title = "Junior Backend Engineer"
        record.company = "Stripe"
        record.location = "Bengaluru"
        record.employment_type = "full-time"
        record.experience_level = "entry"
        record.skills = ["Python", "FastAPI"]
        record.description = "Mentorship provided, 40-hour work week, modern Python and PostgreSQL stack."
        record.salary_range = "12-18 LPA"
        record.url = "https://stripe.com/jobs/123"
        record.source = "lever"
        record.verification_status = "verified"
        record.fetched_at = None

        discovery_data = {"sources": ["lever"]}
        user_state = "discovered"

        res = _job_response(record, discovery_data, user_state)
        self.assertIn("job_health", res)
        self.assertIsInstance(res["job_health"], dict)
        self.assertGreaterEqual(res["job_health"]["role_health_score"], 80)
        self.assertEqual("High Quality", res["job_health"]["health_verdict"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_discovery_job_health`
Expected: FAIL with `AssertionError: 'job_health' not found in {...}`

- [ ] **Step 3: Wire `audit_job_reality` into `backend/routers/discovery_router.py`**

```python
from services.job_reality_service import audit_job_reality

def _job_response(record, discovery_data, user_state):
    health = audit_job_reality(
        record.title or "",
        record.description or "",
        company=record.company or ""
    )
    return {
        "id": record.id,
        "title": record.title,
        "company": record.company,
        "location": record.location,
        "employment_type": record.employment_type,
        "experience_level": record.experience_level,
        "skills": record.skills or [],
        "description": record.description,
        "salary_range": record.salary_range,
        "url": record.url,
        "source": record.source,
        "sources": discovery_data.get("sources") or [record.source],
        "verification_status": record.verification_status,
        "fetched_at": record.fetched_at,
        "user_state": user_state,
        "job_health": health,
    }
```

- [ ] **Step 4: Add `filterJobsByHealth` in `frontend/src/app/job-workspace.js` and test in `job-workspace.test.js`**

In `frontend/src/app/job-workspace.js`:
```javascript
export function filterJobsByHealth(jobs, filterMode = 'all') {
  if (!Array.isArray(jobs)) return [];
  if (filterMode === 'healthy') {
    return jobs.filter((j) => (j.job_health?.role_health_score ?? 100) >= 70);
  }
  if (filterMode === 'caution') {
    return jobs.filter((j) => (j.job_health?.role_health_score ?? 100) < 70);
  }
  return jobs;
}
```

In `frontend/src/pages/SearchJobs.jsx`:
- Add filter pills: `[ All Roles (${displayedJobs.length}) ]`, `[ 🛡️ Healthy Roles (${healthyCount}) ]`, `[ ⚠ Cautions (${cautionCount}) ]`.
- Render elevated `RoleHealthCard` with 0-100 visual gauge, ghost job warning box, junior tech overload counter, and healthy signals.

- [ ] **Step 5: Run tests and verify they pass**

Run: `python -m unittest backend.tests.test_discovery_job_health`
Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 6: Commit Task 1**

```bash
git add backend/routers/discovery_router.py backend/tests/test_discovery_job_health.py frontend/src/app/job-workspace.js frontend/src/app/job-workspace.test.js frontend/src/pages/SearchJobs.jsx
git commit -m "feat(jobs): universal discovery role health audit and health filtering in SearchJobs"
```

---

### Task 2: Hero 1 (Recruiter 6-Sec X-Ray) 1-Click Buzzword Auto-Remediation & Reviewer Archetypes

**Files:**
- Modify: `backend/services/recruiter_xray_service.py`
- Modify: `frontend/src/pages/ResumeStudio.jsx`
- Test: `backend/tests/test_recruiter_xray_service.py`

**Interfaces:**
- In `recruiter_xray_service.py`: Add `reviewer_personas`:
  ```python
  {
      "reviewer_personas": {
          "screener_verdict": str,     # 6-second keyword/formatting pass
          "hiring_manager_verdict": str, # Role-impact and production evidence assessment
          "tech_lead_verdict": str      # Code depth and systems architectural skepticism
      },
      "remediated_text_preview": str   # Automated replacement of detected buzzwords with active STAR alternatives
  }
  ```
- In `ResumeStudio.jsx`:
  - 1-Click "⚡ Auto-Remediate Fluff" button: Replaces detected filler words directly inside the active editor buffer and recalculates the score in real time.
  - Interactive Reviewer Persona tabs: `[ 🔍 Recruiter Screener ]`, `[ 💼 Hiring Manager ]`, `[ 💻 Tech Lead ]`.
  - Eye-tracking F-pattern overlay simulation.

- [ ] **Step 1: Write failing test in `backend/tests/test_recruiter_xray_service.py`**

```python
def test_recruiter_xray_provides_three_reviewer_personas_and_remediated_preview(self):
    resume = "I am a hardworking and passionate student. Experienced with Python, FastAPI, and Docker."
    jd = "Seeking Backend Engineer with FastAPI and Docker."
    result = analyze_recruiter_xray(resume, jd)
    self.assertIn("reviewer_personas", result)
    self.assertIn("screener_verdict", result["reviewer_personas"])
    self.assertIn("hiring_manager_verdict", result["reviewer_personas"])
    self.assertIn("tech_lead_verdict", result["reviewer_personas"])
    self.assertIn("remediated_text_preview", result)
    self.assertNotIn("hardworking", result["remediated_text_preview"].lower())
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_recruiter_xray_service`
Expected: FAIL with `KeyError: 'reviewer_personas'`

- [ ] **Step 3: Update `backend/services/recruiter_xray_service.py`**

Add `reviewer_personas` generation and `remediated_text_preview` by swapping detected fluff words with active evidence-based alternatives.

- [ ] **Step 4: Update `frontend/src/pages/ResumeStudio.jsx`**

- Add "⚡ Auto-Remediate Fluff" button calling in-place replacement on `editorText` and triggering debounced recalculation.
- Add tabs for the 3 reviewer personas (Recruiter, Hiring Manager, Tech Lead) in the X-Ray banner.

- [ ] **Step 5: Run tests and verify they pass**

Run: `python -m unittest backend.tests.test_recruiter_xray_service`
Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 6: Commit Task 2**

```bash
git add backend/services/recruiter_xray_service.py backend/tests/test_recruiter_xray_service.py frontend/src/pages/ResumeStudio.jsx
git commit -m "feat(xray): add 1-click fluff auto-remediation and 3-reviewer persona verdicts"
```

---

### Task 3: Hero 2 (Resume Defense Stress-Tester) Interactive Drill-Downs with Real Code Snippets & Claim Vulnerability

**Files:**
- Modify: `backend/services/interview_stress_test_service.py`
- Modify: `frontend/src/pages/Applications.jsx`
- Test: `backend/tests/test_interview_stress_test_service.py`

**Interfaces:**
- In `interview_stress_test_service.py`: Add `vulnerability_rating` (`High Risk`, `Medium Risk`, `Rock Solid`), `code_defense_snippet`, and `model_interview_answer` to each drill-down question.
  ```python
  {
      "claim": str,
      "question": str,
      "vulnerability_rating": "High Risk" | "Medium Risk" | "Rock Solid",
      "what_interviewer_tests": str,
      "candidate_defense_blueprint": str,
      "code_defense_snippet": str,    # Real syntax-highlighted code illustrating the defense
      "model_interview_answer": str
  }
  ```
- In `Applications.jsx`:
  - Interactive "Claim Vulnerability Badge" (Red pill for High-Risk claims with unverified metrics, Green pill for Rock Solid claims).
  - Collapsible "View Code Defense & Blueprint" toggle with copyable code snippets (e.g. Python async connection pool, EXPLAIN ANALYZE index query, Docker multi-stage build).
  - "Practice Self-Score" buttons: `[ 😟 Need Practice ]`, `[ 😐 Prepared ]`, `[ 🛡️ Ironclad ]`.

- [ ] **Step 1: Write failing test in `backend/tests/test_interview_stress_test_service.py`**

```python
def test_drill_down_includes_vulnerability_rating_and_code_snippet(self):
    resume = "Optimized PostgreSQL database queries reducing API latency by 45% using Redis."
    jd = "Backend Engineer with PostgreSQL and Redis."
    res = generate_resume_defense_matrix(resume, jd, "Stripe")
    self.assertGreater(len(res["drill_down_questions"]), 0)
    q = res["drill_down_questions"][0]
    self.assertIn("vulnerability_rating", q)
    self.assertIn("code_defense_snippet", q)
    self.assertIn("model_interview_answer", q)
    self.assertIn("EXPLAIN", q["code_defense_snippet"] + q["candidate_defense_blueprint"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_interview_stress_test_service`
Expected: FAIL with `KeyError: 'vulnerability_rating'`

- [ ] **Step 3: Update `backend/services/interview_stress_test_service.py`**

Implement `vulnerability_rating` (claims with numbers like `45%` without benchmark methodology are tagged `High Risk`), attach realistic `code_defense_snippet` (e.g. SQLAlchemy connection pool config, EXPLAIN ANALYZE SQL query, multi-stage Dockerfile), and provide `model_interview_answer`.

- [ ] **Step 4: Update `frontend/src/pages/Applications.jsx`**

Render vulnerability badges, code syntax blocks with copy button, and interactive practice confidence tracker.

- [ ] **Step 5: Run tests and verify they pass**

Run: `python -m unittest backend.tests.test_interview_stress_test_service`
Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 6: Commit Task 3**

```bash
git add backend/services/interview_stress_test_service.py backend/tests/test_interview_stress_test_service.py frontend/src/pages/Applications.jsx
git commit -m "feat(stress-test): add claim vulnerability ratings, real code defense snippets, and model answers"
```

---

### Task 4: Hero 4 (Application Autopsy) Pre-Mortem Mode, In-Drawer GitHub Verifier & `Growth.jsx` Deep Linking

**Files:**
- Modify: `backend/services/application_autopsy_service.py`
- Modify: `backend/routers/application_router.py`
- Modify: `frontend/src/pages/Growth.jsx`
- Modify: `frontend/src/pages/Applications.jsx`
- Test: `backend/tests/test_application_autopsy_service.py`

**Interfaces:**
- In `application_autopsy_service.py`: Add `mode` (`post_mortem` vs `pre_mortem`), `severity`, `missing_skill`, `growth_url` (`/growth?skill=...`).
- In `Growth.jsx`: Inspect `useSearchParams()`. When `?skill=...` is present, auto-open the `BlueprintModal` immediately.
- In `Applications.jsx`:
  - Allow running Autopsy on any card (Post-Mortem on Rejected/Ghosted, Pre-Mortem on active).
  - In `AutopsyDrawer`: Add in-drawer GitHub repo verification input with 1-click `verifyGitHubRepo` call that validates proof directly from the autopsy drawer!

- [ ] **Step 1: Write failing test in `backend/tests/test_application_autopsy_service.py`**

```python
def test_autopsy_supports_pre_mortem_and_growth_url(self):
    resume = "Frontend engineer with React."
    jd = "Backend Engineer: Must have production Docker and FastAPI experience."
    res = run_application_autopsy(resume, jd, status="applied")
    self.assertEqual("pre_mortem", res["mode"])
    self.assertIn("growth_url", res["recommended_blueprint"])
    self.assertIn("/growth?skill=", res["recommended_blueprint"]["growth_url"])
    self.assertIn("missing_skill", res)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_application_autopsy_service`
Expected: FAIL with `TypeError: run_application_autopsy() got unexpected keyword argument 'status'`

- [ ] **Step 3: Update `backend/services/application_autopsy_service.py` and `backend/routers/application_router.py`**

Update `run_application_autopsy` with `status="rejected"`, `growth_url`, and pass `app.status` from `application_router.py`.

- [ ] **Step 4: Add `useSearchParams` auto-open in `Growth.jsx` and in-drawer verification in `Applications.jsx`**

- In `Growth.jsx`: read `searchParams.get('skill')` and set `activeBlueprintSkill(skill)`.
- In `Applications.jsx`: add in-drawer GitHub repo verifier input and trigger `verifyGitHubRepo`.

- [ ] **Step 5: Run tests and verify they pass**

Run: `python -m unittest backend.tests.test_application_autopsy_service`
Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 6: Commit Task 4**

```bash
git add backend/services/application_autopsy_service.py backend/routers/application_router.py backend/tests/test_application_autopsy_service.py frontend/src/pages/Growth.jsx frontend/src/pages/Applications.jsx
git commit -m "feat(autopsy): add pre-mortem risk audit, in-drawer GitHub proof verifier, and Growth deep linking"
```

---

### Task 5: Core Application Pack Deepening & Multi-Channel Outreach Toolkit

**Files:**
- Modify: `backend/services/cover_letter_service.py`
- Modify: `backend/routers/resume_studio_router.py`
- Modify: `frontend/src/pages/Applications.jsx`
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Test: `backend/tests/test_cover_letter_service.py`

**Interfaces:**
- In `cover_letter_service.py`: Produce 3 tailored outreach channels:
  1. `linkedin_connection_note`: Strictly `< 300` characters.
  2. `alumni_casual_note`: Casual, low-friction note for alumni/peers strictly `< 200` characters.
  3. `cold_email_pitch`: Complete pitch with `subject` line, 2 tight paragraphs, and call to action.
- In `Applications.jsx` and `SearchJobs.jsx`:
  - Outreach toolkit tab switcher: `[ LinkedIn Note (<300) ]`, `[ Alumni Chat (<200) ]`, `[ Cold Email ]`.
  - 1-click copy with dynamic character countdown badges.

- [ ] **Step 1: Write failing test in `backend/tests/test_cover_letter_service.py`**

```python
def test_generates_three_distinct_outreach_channel_variants(self):
    pack = generate_tailored_cover_letter("Taylor Swift", "Python, FastAPI, Docker", "Backend Engineer", "Spotify", "FastAPI and Docker")
    self.assertIn("alumni_casual_note", pack)
    self.assertIn("cold_email_pitch", pack)
    self.assertIn("subject", pack["cold_email_pitch"])
    self.assertLess(len(pack["alumni_casual_note"]), 200)
    self.assertLess(len(pack["outreach_note_300"]), 300)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_cover_letter_service`
Expected: FAIL with `KeyError: 'alumni_casual_note'`

- [ ] **Step 3: Update `backend/services/cover_letter_service.py` and router**

Implement multi-channel outreach generator with strict character constraints.

- [ ] **Step 4: Update `ApplicationPackModal` in `Applications.jsx` and `SearchJobs.jsx`**

Add tabbed selector for the 3 outreach templates with 1-click copy and character counter badges.

- [ ] **Step 5: Run tests and verify they pass**

Run: `python -m unittest backend.tests.test_cover_letter_service`
Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 6: Commit Task 5**

```bash
git add backend/services/cover_letter_service.py backend/tests/test_cover_letter_service.py frontend/src/pages/Applications.jsx frontend/src/pages/SearchJobs.jsx
git commit -m "feat(application-pack): add multi-channel outreach toolkit (LinkedIn, Alumni, Cold Email)"
```

---

### Task 6: Launch Control Tower, System Evals & Full Regression Suite

**Files:**
- Modify: `backend/tests/test_agent_orchestration_evals.py`
- Run: Full backend unit tests
- Run: `python tests/run_e2e.py`
- Run: `npm --prefix frontend test`
- Run: `npm --prefix frontend run lint`
- Run: `npm --prefix frontend run build`

- [ ] **Step 1: Add new orchestration evals in `backend/tests/test_agent_orchestration_evals.py`**
- [ ] **Step 2: Run all 4 verification tiers**
  - Backend unit tests
  - 230/230 E2E contract tests
  - 29+ frontend tests
  - ESLint
  - Vite production build
- [ ] **Step 3: Push to GitHub `origin main`**

```bash
git push origin main
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-29-careerpilot-comprehensive-system-deepening.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, with fast iteration using `superpowers:subagent-driven-development`.
2. **Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach would you like to take?
