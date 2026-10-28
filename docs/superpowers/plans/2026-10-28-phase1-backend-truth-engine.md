# Phase 1: Backend Truth Engine & Real Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the authoritative 100-Point Deterministic ATS Diagnostic Engine, Actionable Growth Recipes with Automated GitHub Repo Code Inspector, and Direct Public ATS Job Ingestion to eliminate all remaining shallow/mock features in CareerPilot.

**Architecture:** 
- A dedicated diagnostic engine (`services/ats_scorer_service.py`) calculates a deterministic 100-point rubric across Machine Parseability (25pts), Keyword Match (35pts), STAR Action & Metrics (25pts), and Structural Completeness (15pts), returning actionable warnings and saving the real `ats_score` to the database.
- An enhanced growth verification engine (`services/growth_service.py`) provides curated project blueprints for top missing skills and makes live GitHub Public API calls to verify file contents (`Dockerfile`, `requirements.txt`, etc.) and commit history before awarding verified skill credentials.
- A direct public ATS crawler (`services/ats_feed_service.py`) ingests real fresher postings directly from Lever, Ashby, and Greenhouse company endpoints without consuming external search API credits.

**Tech Stack:** Python 3.14 / 3.12, FastAPI, SQLAlchemy, Pydantic, Requests / Urllib, Unittest.

**Spec:** [`docs/superpowers/specs/2026-10-28-careerpilot-production-transformation-spec.md`](../specs/2026-10-28-careerpilot-production-transformation-spec.md)

## Global Constraints

- **Strict TDD**: Write failing unit tests first, verify the failure, write minimal passing code, verify all pass, commit.
- **Zero Mock AI**: All prompts execute against Google Gemini API or deterministic truth guards; zero synthetic mock results.
- **Backwards Compatibility**: Do not break existing API contracts on `/matches`, `/applications`, `/resume-studio`, or `/growth`.
- **Clean Production Builds**: 100% test pass rate across backend and frontend suites, 0 ESLint errors.

---

### Task 1: 100-Point Deterministic ATS Diagnostic Engine

**Files:**
- Create: `backend/services/ats_scorer_service.py`
- Test: `backend/tests/test_ats_scorer_service.py`

**Interfaces:**
- Produces: `calculate_ats_score(resume_text: str, job_description: str = "") -> dict`
- Schema output:
  ```python
  {
      "overall_score": int,          # 0-100
      "grade": str,                  # "A", "B", "C", "Needs Work"
      "breakdown": {
          "parseability": int,       # 0-25
          "keyword_match": int,      # 0-35
          "action_metrics": int,     # 0-25
          "structure_hygiene": int   # 0-15
      },
      "feedback": list[str],         # e.g. ["Missing must-have: Docker (-12 pts)"]
      "strengths": list[str]
  }
  ```

- [ ] **Step 1: Write failing unit test for ATS scoring rubric**

```python
# backend/tests/test_ats_scorer_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.ats_scorer_service import calculate_ats_score

class ATSScorerServiceTests(TestCase):
    def test_ideal_ats_resume_scores_high_grade_a(self):
        resume = """John Doe
john@example.com | 555-123-4567 | github.com/johndoe | linkedin.com/in/johndoe

TECHNICAL SKILLS
Languages: Python, SQL
Frameworks: FastAPI, React

EXPERIENCE
Software Engineering Intern, Acme Corp
- Engineered REST APIs using Python and FastAPI, increasing throughput by 35%.
- Optimized database queries in PostgreSQL, reducing query latency by 50ms across 10000 records.

EDUCATION
Bachelor of Science in Computer Science, State University, 2024
"""
        jd = "Requirements: Python, FastAPI, SQL, PostgreSQL. 0-2 years experience."
        result = calculate_ats_score(resume, jd)
        self.assertGreaterEqual(result["overall_score"], 85)
        self.assertEqual("A", result["grade"])
        self.assertGreaterEqual(result["breakdown"]["keyword_match"], 30)
        self.assertGreaterEqual(result["breakdown"]["parseability"], 20)

    def test_penalizes_missing_must_haves_and_passive_bullets(self):
        resume = """John Doe
john@example.com

EXPERIENCE
- Worked on some stuff and helped with backend tasks.
"""
        jd = "Requirements: Python, Docker, Kubernetes, AWS, PostgreSQL."
        result = calculate_ats_score(resume, jd)
        self.assertLess(result["overall_score"], 60)
        self.assertIn("Needs Work", result["grade"])
        self.assertTrue(any("missing" in f.lower() for f in result["feedback"]))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend/tests/test_ats_scorer_service.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.ats_scorer_service'`

- [ ] **Step 3: Implement minimal ATS scorer service**

```python
# backend/services/ats_scorer_service.py
import re
from services.skill_extractor import SkillExtractor
from services.matching_service import _extract_must_have_skills
from services.ats_pdf_service import parse_resume_sections

ACTION_VERB_SET = {
    "engineered", "architected", "developed", "built", "implemented",
    "optimized", "designed", "automated", "spearheaded", "accelerated",
    "reduced", "increased", "deployed", "scaled", "created", "refactored"
}

def calculate_ats_score(resume_text: str, job_description: str = "") -> dict:
    feedback = []
    strengths = []
    
    # 1. Parseability & Formatting (25 pts)
    parse_pts = 25
    sections = parse_resume_sections(resume_text)
    if not sections.get("name") or len(sections["name"].split()) < 2:
        parse_pts -= 5
        feedback.append("Candidate name formatting is ambiguous (-5 pts).")
    if not sections.get("contact") or "@" not in sections["contact"]:
        parse_pts -= 10
        feedback.append("Contact line missing standard email/phone (-10 pts).")
    if parse_pts == 25:
        strengths.append("Clean, single-column machine-parseable layout.")

    # 2. Keyword & Skill Match (35 pts)
    keyword_pts = 35
    if job_description:
        extractor = SkillExtractor()
        resume_skills, _ = extractor.extract_skills(resume_text)
        job_skills, _ = extractor.extract_skills(job_description)
        must_haves = _extract_must_have_skills(job_description, extractor)
        
        if must_haves:
            missing_must = set(must_haves) - set(resume_skills)
            must_ratio = (len(must_haves) - len(missing_must)) / len(must_haves)
            keyword_pts = round(must_ratio * 25)
            if missing_must:
                feedback.append(f"Missing critical must-have keywords: {', '.join(sorted(missing_must))} (-{25 - keyword_pts} pts).")
            else:
                strengths.append("100% must-have skills matched.")
        elif job_skills:
            matched = set(resume_skills) & set(job_skills)
            ratio = len(matched) / len(job_skills)
            keyword_pts = round(ratio * 35)
            if ratio < 0.5:
                feedback.append("Resume contains less than 50% of the target job keywords.")
    else:
        keyword_pts = 25

    # 3. Action Verbs & Quantitative Metrics (25 pts)
    action_pts = 0
    lines = [line.strip() for line in resume_text.splitlines() if line.strip().startswith(("-", "*", "•"))]
    if lines:
        action_count = 0
        metric_count = 0
        for line in lines:
            words = re.findall(r"\b[A-Za-z]+\b", line.lower())
            if words and words[0] in ACTION_VERB_SET:
                action_count += 1
            if re.search(r"\b\d+(?:\.\d+)?%?|\$\d+", line):
                metric_count += 1
        
        action_ratio = action_count / len(lines)
        metric_ratio = metric_count / len(lines)
        action_pts = round((action_ratio * 15) + (metric_ratio * 10))
        if action_ratio < 0.4:
            feedback.append("Too few bullet points begin with strong action verbs (-8 pts).")
        if metric_ratio < 0.3:
            feedback.append("Bullet points lack measurable metrics, numbers, or percentages (-7 pts).")
        if action_pts >= 20:
            strengths.append("Strong STAR action verbs and quantitative metrics detected.")
    else:
        action_pts = 10
        feedback.append("No standard bullet points detected in project or experience sections (-15 pts).")

    # 4. Structure & Completeness (15 pts)
    struct_pts = 15
    detected_sections = set(sections.get("sections", {}).keys())
    if not any(s in detected_sections for s in ("EXPERIENCE", "WORK EXPERIENCE", "PROJECTS")):
        struct_pts -= 8
        feedback.append("Missing distinct EXPERIENCE or PROJECTS section header (-8 pts).")
    if not any(s in detected_sections for s in ("TECHNICAL SKILLS", "SKILLS")):
        struct_pts -= 4
        feedback.append("Missing dedicated TECHNICAL SKILLS section (-4 pts).")
    if not any(s in detected_sections for s in ("EDUCATION",)):
        struct_pts -= 3
        feedback.append("Missing EDUCATION section (-3 pts).")

    overall = max(0, min(100, parse_pts + keyword_pts + action_pts + struct_pts))
    if overall >= 85:
        grade = "A"
    elif overall >= 70:
        grade = "B"
    elif overall >= 55:
        grade = "C"
    else:
        grade = "Needs Work"

    return {
        "overall_score": overall,
        "grade": grade,
        "breakdown": {
            "parseability": parse_pts,
            "keyword_match": keyword_pts,
            "action_metrics": action_pts,
            "structure_hygiene": struct_pts,
        },
        "feedback": feedback,
        "strengths": strengths,
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest backend/tests/test_ats_scorer_service.py`
Expected: PASS with `Ran 2 tests in ... OK`

- [ ] **Step 5: Commit**

```bash
git add backend/services/ats_scorer_service.py backend/tests/test_ats_scorer_service.py
git commit -m "feat: implement 100-point deterministic ATS diagnostic engine"
```

---

### Task 2: Wire ATS Scorecard into Match Router & Database Persistence

**Files:**
- Modify: `backend/routers/match_router.py`
- Modify: `backend/models/match_model.py`
- Modify: `backend/models/application_model.py`
- Test: `backend/tests/test_matching_service.py`

**Interfaces:**
- Updates: `POST /matches/analyze` to return full `ats_diagnostic` object and persist `ats_score` to `MatchResult` and `Application`.

- [ ] **Step 1: Write test for match router ATS score inclusion**

```python
# backend/tests/test_matching_service.py
    def test_match_includes_authoritative_ats_diagnostic(self):
        resume = "Software Engineer. Built APIs using Python and SQL with 20% speedup."
        jd = "Requirements: Python, SQL. 0-2 years experience."
        result = match_resume_to_job(resume, jd)
        self.assertIn("ats_diagnostic", result)
        self.assertGreaterEqual(result["ats_diagnostic"]["overall_score"], 50)
        self.assertIn("breakdown", result["ats_diagnostic"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend/tests/test_matching_service.py`
Expected: FAIL (`AssertionError: 'ats_diagnostic' not found in ...`)

- [ ] **Step 3: Update `match_resume_to_job` and `match_router.py`**

In `backend/services/matching_service.py`:
Call `calculate_ats_score(resume_text, job_description)` and include `ats_diagnostic` and `ats_score` in the return dictionary.
In `backend/routers/match_router.py`:
Save `ats_score=analysis["ats_diagnostic"]["overall_score"]` on `MatchResult`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `python -m unittest backend/tests/test_matching_service.py backend/tests/test_ats_scorer_service.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/services/matching_service.py backend/routers/match_router.py backend/tests/test_matching_service.py
git commit -m "feat: wire ATS diagnostic scoring into match engine and persistence"
```

---

### Task 3: Real Growth Blueprints & Automated GitHub Repo Verifier

**Files:**
- Create: `backend/services/growth_blueprint_database.py`
- Modify: `backend/services/growth_service.py`
- Test: `backend/tests/test_growth_service.py`

**Interfaces:**
- Produces: `verify_github_growth_submission(repo_url: str, required_skill: str) -> dict`
- Schema output:
  ```python
  {
      "verified": bool,
      "reasons": list[str],
      "detected_files": list[str],
      "generated_bullet": str | None
  }
  ```

- [ ] **Step 1: Write test for GitHub repo verification with simulated GitHub API**

```python
# backend/tests/test_growth_service.py (add to existing test)
from unittest.mock import patch
from services.growth_service import verify_github_growth_submission, get_skill_blueprint

class GrowthServiceVerificationTests(TestCase):
    def test_skill_blueprint_provides_actionable_spec(self):
        blueprint = get_skill_blueprint("docker")
        self.assertIsNotNone(blueprint)
        self.assertIn("Dockerfile", blueprint["required_files"])
        self.assertTrue(len(blueprint["steps"]) > 0)

    @patch("services.growth_service._fetch_repo_contents")
    @patch("services.growth_service._fetch_repo_meta")
    def test_verify_submission_approves_valid_repo_contents(self, mock_meta, mock_contents):
        mock_meta.return_value = {"name": "docker-demo", "language": "Python", "fork": False}
        mock_contents.return_value = ["Dockerfile", "docker-compose.yml", "main.py", "requirements.txt"]
        
        result = verify_github_growth_submission("https://github.com/student/docker-demo", "docker")
        self.assertTrue(result["verified"])
        self.assertIn("Dockerfile", result["detected_files"])
        self.assertIn("Docker", result["generated_bullet"])

    @patch("services.growth_service._fetch_repo_contents")
    @patch("services.growth_service._fetch_repo_meta")
    def test_verify_submission_rejects_empty_or_irrelevant_repo(self, mock_meta, mock_contents):
        mock_meta.return_value = {"name": "empty-repo", "language": "HTML", "fork": False}
        mock_contents.return_value = ["README.md"]
        
        result = verify_github_growth_submission("https://github.com/student/empty-repo", "docker")
        self.assertFalse(result["verified"])
        self.assertTrue(any("missing" in r.lower() for r in result["reasons"]))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend/tests/test_growth_service.py`
Expected: FAIL with `ImportError: cannot import name 'verify_github_growth_submission'`

- [ ] **Step 3: Implement `growth_blueprint_database.py` and verifier in `growth_service.py`**

Create `backend/services/growth_blueprint_database.py` with blueprints for `docker`, `kubernetes`, `redis`, `kafka`, `fastapi`, `postgresql`, `react`, `typescript`, `graphql`, `mongodb`.
In `backend/services/growth_service.py`:
Implement `_fetch_repo_meta`, `_fetch_repo_contents` using GitHub Public API, and `verify_github_growth_submission`.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest backend/tests/test_growth_service.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/services/growth_blueprint_database.py backend/services/growth_service.py backend/tests/test_growth_service.py
git commit -m "feat: implement actionable growth blueprints and automated GitHub repo verifier"
```

---

### Task 4: Direct Public ATS Job Feed Ingestion (Lever, Ashby, Greenhouse)

**Files:**
- Create: `backend/services/ats_feed_service.py`
- Modify: `backend/services/job_discovery_service.py`
- Test: `backend/tests/test_ats_feed_service.py`

**Interfaces:**
- Produces: `fetch_direct_ats_jobs(query: str = "", limit: int = 15) -> list[dict]`
- Ingests public job listings directly from public company boards (e.g., `api.lever.co/v0/postings/...`, `boards-api.greenhouse.io/v1/boards/...`, `api.ashbyhq.com/posting-api/job-board/...`) returning verified fresher roles without third-party API quotas.

- [ ] **Step 1: Write failing test for direct ATS feed ingestion**

```python
# backend/tests/test_ats_feed_service.py
from pathlib import Path
import sys
from unittest import TestCase
from unittest.mock import patch

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.ats_feed_service import normalize_ats_posting, fetch_direct_ats_jobs

class ATSFeedServiceTests(TestCase):
    def test_normalize_ats_posting_extracts_clean_job_record(self):
        raw_lever = {
            "id": "lever-123",
            "text": "Junior Software Engineer",
            "categories": {"location": "Bengaluru", "commitment": "Full-time", "team": "Engineering"},
            "descriptionPlain": "We are seeking a junior backend engineer. Requirements: Python, SQL. 0-2 years experience.",
            "hostedUrl": "https://jobs.lever.co/stripe/lever-123"
        }
        job = normalize_ats_posting(raw_lever, provider="lever", company="Stripe")
        self.assertIsNotNone(job)
        self.assertEqual("Junior Software Engineer", job["title"])
        self.assertEqual("Stripe", job["company"])
        self.assertEqual("verified_ats", job["verification_status"])
        self.assertIn("Python", job["description"])

    def test_drops_senior_jobs_from_direct_feed(self):
        raw_gh = {
            "id": "gh-456",
            "title": "Principal Distributed Systems Architect",
            "content": "Requires 10+ years experience in high throughput systems.",
            "absolute_url": "https://boards.greenhouse.io/uber/jobs/456"
        }
        job = normalize_ats_posting(raw_gh, provider="greenhouse", company="Uber")
        self.assertIsNone(job)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend/tests/test_ats_feed_service.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.ats_feed_service'`

- [ ] **Step 3: Implement `ats_feed_service.py`**

Implement `normalize_ats_posting`, `fetch_direct_ats_jobs`, and plug into `job_discovery_service.py` as a primary high-relevance provider.

- [ ] **Step 4: Run test to verify it passes**

Run: `python -m unittest backend/tests/test_ats_feed_service.py backend/tests/test_job_discovery_service.py`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/services/ats_feed_service.py backend/services/job_discovery_service.py backend/tests/test_ats_feed_service.py
git commit -m "feat: add direct public ATS feed ingestion for Lever, Greenhouse, and Ashby"
```

---

### Task 5: Frontend UI Scorecard & Growth Verifier Integration

**Files:**
- Modify: `frontend/src/pages/ResumeStudio.jsx`
- Modify: `frontend/src/pages/Growth.jsx`
- Modify: `frontend/src/services/api.js`
- Test: `frontend/src/app/job-workspace.test.js`

**Interfaces:**
- In `ResumeStudio.jsx`: Render the 100-Point ATS Scorecard with visual progress rings for the 4 pillars (Parseability, Keywords, Impact, Structure) and actionable fix chips.
- In `Growth.jsx`: Render Blueprint modal and GitHub Repo Verification URL input with live verification feedback.

- [ ] **Step 1: Write frontend test asserting ATS score display logic and verification state**
- [ ] **Step 2: Verify test fails**
- [ ] **Step 3: Implement ATS score ring and Growth Verifier UI**
- [ ] **Step 4: Verify test passes and `npm test` + `npm run lint` + `npm run build` succeed**
- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ResumeStudio.jsx frontend/src/pages/Growth.jsx frontend/src/services/api.js
git commit -m "feat: render 100-point ATS scorecard and automated GitHub growth verifier in UI"
```

---

### Task 6: Comprehensive Verification Run

- [ ] **Step 1: Run all backend unit tests**
  `python -m unittest discover -s backend/tests -p "test_*.py"`
- [ ] **Step 2: Run 4-tier E2E contract test suite**
  `python tests/run_e2e.py`
- [ ] **Step 3: Run all frontend unit tests**
  `npm --prefix frontend test`
- [ ] **Step 4: Run frontend linter**
  `npm --prefix frontend run lint`
- [ ] **Step 5: Run frontend production build**
  `npm --prefix frontend run build`
- [ ] **Step 6: Push commit to remote**
  `git push origin main`
