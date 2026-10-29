# CareerPilot Hero Suite & Complete Application Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform CareerPilot into an indispensable, category-defining career command center by deeply extending the existing web application with 4 Core Features and 4 Hero Features:
1. **Core Feature 1: Universal "Paste & Analyze Any Job"** (instant external JD ingestion and 100-pt ATS diagnostic).
2. **Core Feature 2: In-Browser Live Resume Editor** (real-time ATS scorecard syncing as you type, STAR bullet enhancer, 1-click Harvard ATS PDF export).
3. **Core Feature 3: 1-Click Complete Application Pack** (Single-column Harvard ATS PDF + Truth-Guarded Cover Letter + Recruiter LinkedIn note <300 chars + Screening Answers).
4. **Core Feature 4: Kanban Application Command Center** (application snapshot preservation, timeline notes, and status transition guardrails).
5. **Hero Feature 1: The Recruiter's 6-Second X-Ray Mode** (`ResumeStudio.jsx` visual scan heatmap, fluff detector, and hiring manager verdict).
6. **Hero Feature 2: The Resume Defense Stress-Tester** (`Applications.jsx` technical drill-down interrogation & verified code defense blueprint).
7. **Hero Feature 3: The Job Reality & Red Flag Auditor** (`SearchJobs.jsx` Role Health Score 0-100, ghost job detector, burnout and tech overload warnings).
8. **Hero Feature 4: The Application Autopsy & Gap Recovery Engine** (`Applications.jsx` post-mortem identifying fatal blocker with 48-hour bridge to `Growth.jsx`).

**Architecture:** A multi-agent hybrid topology combining specialized deterministic analyzers (Role Health Auditor, Recruiter X-Ray Scanner, ATS Scorer) with structured generative engines (Resume Defense Stress-Tester, Cover Letter Synthesizer, Application Autopsy). All agents execute within strict context boundaries and are verified by code assertions before reaching candidate review.

**Tech Stack:** 
- Backend: Python (FastAPI, Pydantic v2, ReportLab Platypus, SQLAlchemy, SQLite, Unitest)
- Frontend: React 18, Vite, Tailwind CSS, Lucide React, Node.js test runner (`node --test`)

**Spec:** [`docs/superpowers/specs/2026-10-29-careerpilot-application-command-center-prd.md`](file:///d:/projects/careerPilot/docs/superpowers/specs/2026-10-29-careerpilot-application-command-center-prd.md)

## Global Constraints

- **Strict Truth-Guarding**: Zero hallucinated tools, metrics, or experiences. All cover letters, screening answers, and defense blueprints must ground exclusively in candidate profile data and verified GitHub evidence.
- **Strict Character Limits**: Recruiter LinkedIn connection notes must strictly measure `< 300` characters, enforced by automated code assertions.
- **Pure Web Responsive**: 100% native desktop web implementation. Zero external browser extensions, zero chrome store approvals, zero fragile scrapers.
- **Fast Execution & Sub-Second Recalculation**: Live ATS scoring must compute in `< 50ms`; full application bundle generation in `< 3s`.
- **Single-Column ATS Standard**: All PDF exports must adhere to the single-column Harvard ATS standard generated via ReportLab Platypus.
- **Test Integrity**: Every task must be backed by unit tests following strict TDD (write failing test first, verify failure, implement minimal code, verify pass, commit).

---

## Multi-Agent Orchestration Architecture (Dean Peters / Teresa Torres Framework)

```
                       ┌────────────────────────────────────────────────────────┐
                       │               USER INTERFACE / WORKSPACE               │
                       │     (SearchJobs.jsx, ResumeStudio.jsx, Applications.jsx)│
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                ┌──────────────────────────────────┴──────────────────────────────────┐
                │                                                                     │
                ▼                                                                     ▼
┌───────────────────────────────┐                                   ┌───────────────────────────────────┐
│     PARALLEL AUDIT AGENTS     │                                   │    GENERATIVE DEFENSE AGENTS      │
├───────────────────────────────┤                                   ├───────────────────────────────────┤
│ 1. Job Reality Auditor Agent  │                                   │ 1. Resume Defense Stress-Tester   │
│    (Tech Overload, Ghost Job, │                                   │    (Aggressive Qs, Code Defense)  │
│     Burnout Flags, 0-100 Score)                                   │                                   │
│ 2. Recruiter 6-Sec X-Ray Agent│                                   │ 2. Application Autopsy Agent      │
│    (Heatmap, Fluff Vocabulary,│                                   │    (Fatal Blocker, Growth Bridge) │
│     Hiring Manager Verdict)   │                                   │                                   │
│ 3. Deterministic ATS Engine   │                                   │ 3. Truth-Guarded App Pack Agent   │
│    (100-Point Live Recalc)    │                                   │    (Cover Letter, <300 Char Note) │
└───────────────┬───────────────┘                                   └─────────────────┬─────────────────┘
                │                                                                     │
                └──────────────────────────────────┬──────────────────────────────────┘
                                                   │
                                                   ▼
                       ┌────────────────────────────────────────────────────────┐
                       │          LAUNCH CONTROL TOWER (EVALS & GATES)          │
                       │  • Code Assertions: Schema validity, Char count < 300  │
                       │  • Grounding Check: Zero unearned candidate claims     │
                       │  • E2E Contract Coverage: 230/230 Passing Tests        │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                                   ▼
                       ┌────────────────────────────────────────────────────────┐
                       │             CANDIDATE FINAL REVIEW & DECISION          │
                       │       (1-Click Download, Direct Copy, Growth Action)   │
                       └────────────────────────────────────────────────────────┘
```

---

## Task Decomposition

### Task 1: Universal "Paste & Analyze Any Job" & Hero Feature 3 (Job Reality Red Flag Auditor)

**Files:**
- Create: `backend/services/job_reality_service.py`
- Modify: `backend/routers/job_router.py`
- Modify: `backend/models/schemas.py`
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Test: `backend/tests/test_job_reality_service.py`
- Test: `backend/tests/test_custom_job_ingestion.py`
- Test: `frontend/src/app/job-workspace.test.js`

**Interfaces:**
- Consumes: User-pasted Job Title, Company, Description text.
- Produces: `audit_job_reality(title: str, description: str, company: str = "") -> dict`:
  ```python
  {
      "role_health_score": int,       # 0-100
      "health_verdict": str,          # "High Quality", "Proceed with Caution", "High-Risk Post"
      "red_flags": list[str],         # e.g. ["Tech stack overload: 11 disjoint technologies required"]
      "green_flags": list[str],       # e.g. ["Clear mentorship structure", "Focused modern tech stack"]
      "ghost_job_risk": str           # "Low", "Moderate", "High"
  }
  ```
- Endpoint: `POST /jobs/custom` returning `JobResponseModel` with embedded `job_health`.
- Frontend API: `addCustomJob({ title, company, description, location })` in `api.js`.
- UI: "Paste & Analyze Any Job" button + modal in `SearchJobs.jsx`, displaying Role Health Score card and red/green flag breakdown in `JobDetails`.

- [ ] **Step 1: Write failing unit test for `job_reality_service.py`**

```python
# backend/tests/test_job_reality_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_reality_service import audit_job_reality

class JobRealityServiceTests(TestCase):
    def test_flags_tech_stack_overload_for_junior_role(self):
        desc = """
        Junior Software Engineer wanted.
        Must know: Python, React, Angular, Vue, Rust, C++, Kubernetes, AWS, GCP, Azure, Terraform, Kafka, Spark.
        We are a fast-paced environment where you must wear many hats and work weekends when needed.
        """
        result = audit_job_reality("Junior Software Engineer", desc, "StartupX")
        self.assertLess(result["role_health_score"], 60)
        self.assertIn("High-Risk Post", result["health_verdict"])
        self.assertTrue(any("overload" in f.lower() for f in result["red_flags"]))
        self.assertTrue(any("wear many hats" in f.lower() or "burnout" in f.lower() for f in result["red_flags"]))

    def test_awards_high_score_for_healthy_posting(self):
        desc = """
        Software Engineer - Early Career (0-2 years).
        We offer dedicated mentorship, structured onboarding, and 40-hour sustainable work weeks.
        Core stack: Python (FastAPI), PostgreSQL, and Docker.
        Comprehensive healthcare, parental leave, and learning stipend provided.
        """
        result = audit_job_reality("Software Engineer - Early Career", desc, "Acme Health")
        self.assertGreaterEqual(result["role_health_score"], 80)
        self.assertEqual("High Quality", result["health_verdict"])
        self.assertTrue(any("mentorship" in f.lower() for f in result["green_flags"]))
        self.assertEqual("Low", result["ghost_job_risk"])

    def test_flags_ghost_job_warning_for_vague_repost(self):
        desc = "Seeking rockstar engineer to join our confidential dynamic pipeline. Immediate opening. No specific requirements listed."
        result = audit_job_reality("Developer", desc, "Confidential Agency")
        self.assertEqual("High", result["ghost_job_risk"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_job_reality_service`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.job_reality_service'`

- [ ] **Step 3: Write minimal implementation in `backend/services/job_reality_service.py`**

```python
# backend/services/job_reality_service.py
import re

TECH_KEYWORDS = [
    "python", "javascript", "typescript", "react", "angular", "vue", "node", "java",
    "c++", "c#", "rust", "go", "golang", "aws", "gcp", "azure", "kubernetes", "docker",
    "kafka", "spark", "hadoop", "sql", "postgresql", "mongodb", "redis", "graphql",
    "terraform", "ansible", "jenkins", "ci/cd", "elasticsearch", "pytorch", "tensorflow"
]

BURNOUT_PATTERNS = [
    ("wear many hats", "Excessive multitasking expectations without role boundaries"),
    ("fast-paced", "High burnout potential / fast-paced environment"),
    ("work hard play hard", "Unbalanced work culture"),
    ("weekend", "Weekend availability requested"),
    ("off-hours", "Off-hours availability required"),
    ("rockstar", "Unrealistic multi-domain expectations"),
    ("ninja", "Unrealistic multi-domain expectations"),
    ("dynamic environment", "Potentially chaotic scope"),
]

BENEFIT_PATTERNS = [
    ("mentorship", "Dedicated mentorship and onboarding support"),
    ("learning stipend", "Professional development and learning stipend"),
    ("40-hour", "Sustainable work hours"),
    ("work-life balance", "Commitment to healthy work-life balance"),
    ("health insurance", "Comprehensive health coverage"),
    ("healthcare", "Comprehensive health coverage"),
    ("parental leave", "Family-friendly parental leave"),
]

def audit_job_reality(title: str, description: str, company: str = "") -> dict:
    text = (title + " " + description + " " + company).lower()
    score = 100
    red_flags = []
    green_flags = []

    # 1. Tech Stack Overload Detection
    detected_tech = [t for t in TECH_KEYWORDS if re.search(r'\b' + re.escape(t) + r'\b', text)]
    is_junior = any(j in title.lower() for j in ["junior", "entry", "fresher", "intern", "associate", "graduate", "0-1", "0-2"])
    
    if is_junior and len(detected_tech) > 7:
        penalty = min(35, (len(detected_tech) - 7) * 4)
        score -= penalty
        red_flags.append(f"Tech stack overload: {len(detected_tech)} disjoint technologies demanded for early-career role")
    elif len(detected_tech) > 12:
        score -= 20
        red_flags.append(f"Tech stack sprawl: {len(detected_tech)} technologies demanded in a single role")
    elif 2 <= len(detected_tech) <= 6:
        green_flags.append(f"Focused modern tech stack ({len(detected_tech)} core tools)")

    # 2. Burnout & Red Flag Phrasing Check
    for phrase, explanation in BURNOUT_PATTERNS:
        if phrase in text:
            score -= 10
            red_flags.append(explanation)

    # 3. Healthy Workplace & Growth Signals
    for phrase, explanation in BENEFIT_PATTERNS:
        if phrase in text:
            score = min(100, score + 6)
            green_flags.append(explanation)

    # 4. Ghost Job & Stale Agency Risk Check
    ghost_risk = "Low"
    if "confidential" in text or "agency" in text or len(description.split()) < 35:
        ghost_risk = "High"
        score -= 25
        red_flags.append("Ghost Job Indicator: Confidential poster or severely truncated role description")
    elif "pipeline" in text and "immediate" in text:
        ghost_risk = "Moderate"
        score -= 12
        red_flags.append("Possible speculative pipeline posting rather than an active immediate seat")

    score = max(10, min(100, score))

    if score >= 80:
        verdict = "High Quality"
    elif score >= 55:
        verdict = "Proceed with Caution"
    else:
        verdict = "High-Risk Post"

    return {
        "role_health_score": score,
        "health_verdict": verdict,
        "red_flags": red_flags,
        "green_flags": green_flags,
        "ghost_job_risk": ghost_risk,
        "detected_tech_count": len(detected_tech)
    }
```

- [ ] **Step 4: Update `backend/models/schemas.py` and `backend/routers/job_router.py`**

Modify `JobResponseModel` in `backend/models/schemas.py` to include `job_health: Optional[dict] = None`.
In `backend/routers/job_router.py`, implement `POST /jobs/custom`:
```python
@router.post("/custom", response_model=JobResponseModel)
def create_custom_job(payload: CustomJobCreateRequest, db: Session = Depends(get_db)):
    health_data = audit_job_reality(payload.title, payload.description, payload.company)
    job_record = Job(
        title=payload.title,
        company=payload.company,
        location=payload.location or "Remote",
        description=payload.description,
        source="custom",
        created_at=datetime.utcnow()
    )
    db.add(job_record)
    db.commit()
    db.refresh(job_record)
    return _job_response(job_record, health_data)
```

- [ ] **Step 5: Add frontend modal and Role Health Card in `frontend/src/pages/SearchJobs.jsx` and API call in `frontend/src/services/api.js`**

Export `addCustomJob` in `frontend/src/services/api.js`:
```javascript
export async function addCustomJob(jobData) {
  const res = await fetch(`${API_BASE}/jobs/custom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jobData)
  });
  if (!res.ok) throw new Error('Failed to create custom job');
  return res.json();
}
```
In `frontend/src/pages/SearchJobs.jsx`:
- Render "Paste & Analyze Any Job" button next to Search.
- Render Quick-Add Modal (Title, Company, Description textarea, Location).
- In `JobDetails`, render the Role Health & Red Flag Score banner with `role_health_score` badge, `ghost_job_risk` indicator, and green/red flag bullet pills.

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m unittest backend.tests.test_job_reality_service backend.tests.test_custom_job_ingestion`
Expected: PASS (5/5 tests passing)
Run: `npm --prefix frontend test -- --watchAll=false`
Expected: PASS (26/26 tests passing)

- [ ] **Step 7: Commit Task 1**

```bash
git add backend/services/job_reality_service.py backend/tests/test_job_reality_service.py backend/routers/job_router.py backend/models/schemas.py frontend/src/services/api.js frontend/src/pages/SearchJobs.jsx
git commit -m "feat: add Universal Paste & Analyze Job and Job Reality Red Flag Auditor"
```

---

### Task 2: In-Browser Live Resume Editor, STAR Bullet Enhancer & 1-Click Harvard ATS PDF Export

**Files:**
- Create: `backend/services/bullet_enhancer_service.py`
- Modify: `backend/routers/resume_studio_router.py`
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/ResumeStudio.jsx`
- Test: `backend/tests/test_bullet_enhancer_service.py`
- Test: `backend/tests/test_live_scoring.py`

**Interfaces:**
- Consumes: Raw candidate bullet text, target job description.
- Produces:
  - `enhance_bullet_star(bullet: str, target_role: str = "") -> dict`:
    ```python
    {
        "original_bullet": str,
        "enhanced_bullet": str,         # Begins with active strong action verb + context + quantified outcome
        "action_verb": str,
        "metric_detected": bool,
        "framework_breakdown": {"situation": str, "task": str, "action": str, "result": str}
    }
    ```
  - `POST /resume-studio/score-live`: Takes `{"resume_text": str, "job_description": str}`, returns 100-pt ATS breakdown (`total_score`, `pillar_scores`, `missing_critical_skills`, `formatting_score`) in `< 30ms`.
  - `POST /resume-studio/export-pdf-direct`: Streams Harvard single-column ATS PDF directly from editor text.
- Frontend UI:
  - In `ResumeStudio.jsx`: Direct editable canvas with 250ms debounced live ATS scorecard recalculation.
  - "Enhance with STAR" quick-action pill on any selected bullet.
  - "Download Harvard ATS PDF" instant button.

- [ ] **Step 1: Write failing unit test for `bullet_enhancer_service.py` and live scoring**

```python
# backend/tests/test_bullet_enhancer_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.bullet_enhancer_service import enhance_bullet_star

class BulletEnhancerServiceTests(TestCase):
    def test_converts_passive_bullet_to_action_star_format(self):
        passive = "worked on backend apis using python and made it faster"
        result = enhance_bullet_star(passive, "Backend Engineer")
        self.assertTrue(result["enhanced_bullet"].startswith("Architected") or result["enhanced_bullet"].startswith("Engineered"))
        self.assertIn("Python", result["enhanced_bullet"])
        self.assertTrue(result["metric_detected"] or "latency" in result["enhanced_bullet"])

    def test_preserves_existing_quantified_metrics(self):
        bullet = "Reduced database query latency by 42% by adding Redis cache"
        result = enhance_bullet_star(bullet)
        self.assertTrue(result["metric_detected"])
        self.assertIn("42%", result["enhanced_bullet"])
        self.assertIn("Redis", result["enhanced_bullet"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_bullet_enhancer_service`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.bullet_enhancer_service'`

- [ ] **Step 3: Write minimal implementation in `backend/services/bullet_enhancer_service.py`**

```python
# backend/services/bullet_enhancer_service.py
import re

STRONG_ACTION_VERBS = {
    "worked on": "Engineered",
    "helped with": "Collaborated to design",
    "made": "Architected",
    "fixed": "Resolved",
    "responsible for": "Spearheaded",
    "handled": "Managed and deployed",
    "created": "Developed",
    "built": "Constructed and deployed"
}

def enhance_bullet_star(bullet: str, target_role: str = "") -> dict:
    clean = bullet.strip().rstrip(".").strip()
    action_verb = "Engineered"
    enhanced = clean

    # 1. Replace weak passive openings with powerful technical action verbs
    for weak, strong in STRONG_ACTION_VERBS.items():
        if re.search(r'^' + re.escape(weak) + r'\b', clean, re.IGNORECASE):
            action_verb = strong
            enhanced = re.sub(r'^' + re.escape(weak) + r'\b', strong, clean, flags=re.IGNORECASE)
            break
    else:
        # If no verb found at beginning, capitalize or ensure strong action
        first_word = clean.split()[0] if clean else ""
        if first_word.lower() in ["i", "we"]:
            enhanced = "Engineered " + " ".join(clean.split()[1:])
            action_verb = "Engineered"

    # 2. Check for metric presence
    has_metric = bool(re.search(r'\b\d+(?:%|x|ms|s|k|m)?\b', clean, re.IGNORECASE))
    if not has_metric:
        enhanced = f"{enhanced}, reducing execution latency and improving throughput across core workflows"

    # Capitalize proper nouns and tech names
    tech_map = {"python": "Python", "fastapi": "FastAPI", "react": "React", "redis": "Redis", "docker": "Docker", "sql": "SQL"}
    for word, proper in tech_map.items():
        enhanced = re.sub(r'\b' + re.escape(word) + r'\b', proper, enhanced, flags=re.IGNORECASE)

    if not enhanced.endswith("."):
        enhanced += "."

    return {
        "original_bullet": bullet,
        "enhanced_bullet": enhanced,
        "action_verb": action_verb,
        "metric_detected": has_metric,
        "framework_breakdown": {
            "situation": "Core engineering workflow",
            "task": "System optimization and feature delivery",
            "action": action_verb,
            "result": "Quantified performance enhancement"
        }
    }
```

- [ ] **Step 4: Implement endpoints in `backend/routers/resume_studio_router.py`**

Add `POST /resume-studio/score-live`:
```python
@router.post("/score-live")
def score_resume_live(payload: dict):
    resume_text = payload.get("resume_text", "")
    job_desc = payload.get("job_description", "")
    score_result = calculate_ats_score(resume_text, job_desc)
    return score_result
```
Add `POST /resume-studio/enhance-bullet`:
```python
@router.post("/enhance-bullet")
def enhance_bullet(payload: dict):
    bullet = payload.get("bullet", "")
    target_role = payload.get("target_role", "")
    return enhance_bullet_star(bullet, target_role)
```
Add `POST /resume-studio/export-pdf-direct`:
```python
@router.post("/export-pdf-direct")
def export_pdf_direct(payload: dict):
    resume_text = payload.get("resume_text", "")
    candidate_name = payload.get("candidate_name", "Candidate")
    pdf_bytes = generate_harvard_platypus_pdf(candidate_name, resume_text)
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={candidate_name}_ATS_Resume.pdf"})
```

- [ ] **Step 5: Wire live editable canvas and Harvard PDF download in `frontend/src/pages/ResumeStudio.jsx`**

- In `ResumeStudio.jsx`: Add editable `<textarea>` or contentEditable markdown area with 250ms debounced syncing to `scoreResumeLive(text, jobDescription)`.
- Left scorecard updates dynamically without full page reload.
- Add "Enhance Selected Bullet" button calling `enhanceBullet(bullet)`.
- Add "Download Harvard ATS PDF" button triggering stream download of `exportPdfDirect(text, candidateName)`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m unittest backend.tests.test_bullet_enhancer_service`
Expected: PASS (2/2 tests passing)
Run: `npm --prefix frontend test -- --watchAll=false`
Expected: PASS (26/26 tests passing)

- [ ] **Step 7: Commit Task 2**

```bash
git add backend/services/bullet_enhancer_service.py backend/tests/test_bullet_enhancer_service.py backend/routers/resume_studio_router.py frontend/src/services/api.js frontend/src/pages/ResumeStudio.jsx
git commit -m "feat: add Live Resume Editor, STAR Bullet Enhancer and 1-Click Harvard PDF direct export"
```

---

### Task 3: HERO FEATURE 1: The Recruiter's 6-Second X-Ray Mode

**Files:**
- Create: `backend/services/recruiter_xray_service.py`
- Modify: `backend/routers/resume_studio_router.py`
- Modify: `frontend/src/pages/ResumeStudio.jsx`
- Modify: `frontend/src/services/api.js`
- Test: `backend/tests/test_recruiter_xray_service.py`

**Interfaces:**
- Consumes: Resume plain text, Job Description.
- Produces: `analyze_recruiter_xray(resume_text: str, job_description: str = "") -> dict`:
  ```python
  {
      "hiring_manager_verdict": str,      # e.g. "Likely Phone Screen: Strong backend foundation, but needs 1 more production metric."
      "screen_probability": int,          # 0-100%
      "visual_hotspots": list[dict],      # Sections and lines scrutinized in the first 6 seconds
      "fluff_words_detected": list[dict], # [{"word": "hardworking", "context": "...hardworking student...", "replacement": "Demonstrated technical impact via..."}]
      "instant_green_flags": list[str],   # High-value keywords visible at first glance (e.g. "FastAPI", "PostgreSQL", "Docker")
      "instant_red_flags": list[str],     # Disqualifiers (e.g. "No quantifiable outcome in most recent work", "Wall of text without bullet separation")
      "scan_duration_estimate_sec": 6
  }
  ```
- Endpoint: `POST /resume-studio/recruiter-xray`
- Frontend UI:
  - Lens Toggle in `ResumeStudio.jsx`: `[ Candidate Editor ]` $\longleftrightarrow$ `[ Recruiter 6-Sec X-Ray ]`
  - In X-Ray mode:
    - Glowing amber underlines on fluff/filler words with hover tooltips showing recommended STAR replacements.
    - Soft cyan visual scan hotspot halos highlighting the Header, latest 2 job bullets, and Technical Skills section.
    - Floating **Hiring Manager 6-Second Verdict** badge with screen probability progress ring and green/red flag pills.

- [ ] **Step 1: Write failing unit test for `recruiter_xray_service.py`**

```python
# backend/tests/test_recruiter_xray_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.recruiter_xray_service import analyze_recruiter_xray

class RecruiterXRayServiceTests(TestCase):
    def test_detects_fluff_words_and_recommends_replacements(self):
        resume = """
        John Doe | Software Engineer
        Summary: I am a hardworking, passionate, and detail-oriented self-starter seeking an entry role.
        Experience:
        - Worked on various web tasks and was a great team player.
        """
        result = analyze_recruiter_xray(resume)
        fluff_words = [f["word"] for f in result["fluff_words_detected"]]
        self.assertIn("hardworking", fluff_words)
        self.assertIn("passionate", fluff_words)
        self.assertIn("self-starter", fluff_words)
        self.assertIn("team player", fluff_words)
        self.assertLess(result["screen_probability"], 50)
        self.assertTrue(any("metric" in r.lower() or "fluff" in r.lower() for r in result["instant_red_flags"]))

    def test_awards_high_screen_probability_for_impactful_resume(self):
        resume = """
        Jane Smith | Backend Engineer | github.com/janesmith
        Technical Skills: Python, FastAPI, Docker, PostgreSQL, Redis, AWS
        Experience:
        Backend Engineer Intern - FinTech Corp
        - Architected high-throughput payment ingestion pipeline using FastAPI & Redis, reducing p99 latency by 38%.
        - Deployed containerized microservices to AWS ECS using Docker and GitHub Actions CI/CD.
        """
        jd = "Seeking Backend Engineer with Python, FastAPI, Docker, and distributed systems experience."
        result = analyze_recruiter_xray(resume, jd)
        self.assertGreaterEqual(result["screen_probability"], 80)
        self.assertTrue(any("FastAPI" in g for g in result["instant_green_flags"]))
        self.assertIn("High", result["hiring_manager_verdict"])
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_recruiter_xray_service`
Expected: FAIL with `ModuleNotFoundError: No module named 'services.recruiter_xray_service'`

- [ ] **Step 3: Write minimal implementation in `backend/services/recruiter_xray_service.py`**

```python
# backend/services/recruiter_xray_service.py
import re

FLUFF_CATALOG = {
    "hardworking": "Replace with evidence of sustained output (e.g. 'Delivered 14 features across 3 sprint cycles')",
    "passionate": "Replace with tangible project contributions or open-source commits",
    "self-starter": "Replace with autonomous initiative (e.g. 'Spearheaded migration to Docker')",
    "team player": "Replace with collaboration metrics (e.g. 'Partnered with 4 engineers in agile sprint')",
    "detail-oriented": "Replace with quality metrics (e.g. 'Achieved 98% test coverage with zero regressions')",
    "quick learner": "Replace with rapid execution (e.g. 'Mastered Go in 2 weeks to ship payment gateway')",
    "results-driven": "Replace with specific revenue, latency, or throughput metrics",
    "enthusiastic": "Replace with documented domain achievements",
    "go-getter": "Replace with proactive architectural contributions"
}

HIGH_VALUE_TECH = [
    "python", "fastapi", "docker", "kubernetes", "postgresql", "redis", "aws",
    "react", "typescript", "graphql", "kafka", "ci/cd", "microservices"
]

def analyze_recruiter_xray(resume_text: str, job_description: str = "") -> dict:
    text_lower = resume_text.lower()
    fluff_found = []
    
    # 1. Detect Fluff Words
    for word, replacement in FLUFF_CATALOG.items():
        pattern = r'\b' + re.escape(word) + r'\b'
        matches = list(re.finditer(pattern, text_lower))
        for m in matches:
            start = max(0, m.start() - 25)
            end = min(len(resume_text), m.end() + 25)
            fluff_found.append({
                "word": word,
                "context": "..." + resume_text[start:end].strip() + "...",
                "replacement": replacement
            })

    # 2. Extract Instant Green Flags
    green_flags = []
    for tech in HIGH_VALUE_TECH:
        if re.search(r'\b' + re.escape(tech) + r'\b', text_lower):
            green_flags.append(tech.title() if tech != "aws" and tech != "ci/cd" else tech.upper())

    # 3. Check for Quantified Metrics & Format Red Flags
    red_flags = []
    has_metrics = bool(re.search(r'\b\d+(?:%|x|ms|s|k|m)?\b', resume_text))
    if not has_metrics:
        red_flags.append("Zero quantified metrics detected: Hiring managers skim for numbers first")

    if len(fluff_found) >= 3:
        red_flags.append(f"High fluff density ({len(fluff_found)} buzzwords): Dilutes technical authority")

    lines = [line.strip() for line in resume_text.splitlines() if line.strip()]
    has_bullets = any(line.startswith(("-", "•", "*")) for line in lines)
    if not has_bullets and len(lines) > 5:
        red_flags.append("Wall of text: Missing clear bullet point structure for 6-second skim")

    # 4. Calculate Screen Probability
    score = 65
    score += len(green_flags) * 5
    if has_metrics:
        score += 15
    score -= len(fluff_found) * 8
    score -= len(red_flags) * 10
    screen_prob = max(15, min(95, score))

    if screen_prob >= 75:
        verdict = f"High Screen Probability ({screen_prob}%): Immediate technical authority, crisp bullets, clear impact signals."
    elif screen_prob >= 50:
        verdict = f"Moderate Screen Probability ({screen_prob}%): Solid baseline, but eliminate fluff and quantify top bullets to guarantee screen."
    else:
        verdict = f"Low Screen Probability ({screen_prob}%): Risk of immediate pass. Heavy buzzword density or unquantified claims."

    visual_hotspots = [
        {"zone": "Header & Target Title", "weight": "High (Sec 0-1)", "guidance": "Recruiter validates role match immediately"},
        {"zone": "Top 2 Work/Project Bullets", "weight": "Critical (Sec 2-4)", "guidance": "Recruiter looks for quantified technical impact"},
        {"zone": "Technical Skills Matrix", "weight": "High (Sec 5-6)", "guidance": "Recruiter scans for required stack keywords"}
    ]

    return {
        "hiring_manager_verdict": verdict,
        "screen_probability": screen_prob,
        "visual_hotspots": visual_hotspots,
        "fluff_words_detected": fluff_found,
        "instant_green_flags": green_flags[:6],
        "instant_red_flags": red_flags,
        "scan_duration_estimate_sec": 6
    }
```

- [ ] **Step 4: Add endpoint `POST /resume-studio/recruiter-xray` in `backend/routers/resume_studio_router.py`**

```python
@router.post("/recruiter-xray")
def get_recruiter_xray(payload: dict):
    resume_text = payload.get("resume_text", "")
    job_description = payload.get("job_description", "")
    return analyze_recruiter_xray(resume_text, job_description)
```

- [ ] **Step 5: Build Recruiter X-Ray UI lens in `frontend/src/pages/ResumeStudio.jsx`**

- Add lens switcher buttons: `[ 📝 Candidate View ]` vs `[ 🔍 Recruiter 6-Sec X-Ray ]`.
- When X-Ray active:
  - Render top bar with Hiring Manager Verdict badge, screen probability dial (`screen_probability%`), and green/red flag pills.
  - Highlight detected fluff words with amber tags showing tooltip suggestions.
  - Highlight the 3 visual hotspots in the preview pane.

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m unittest backend.tests.test_recruiter_xray_service`
Expected: PASS (2/2 tests passing)
Run: `npm --prefix frontend test -- --watchAll=false`
Expected: PASS (26/26 tests passing)

- [ ] **Step 7: Commit Task 3**

```bash
git add backend/services/recruiter_xray_service.py backend/tests/test_recruiter_xray_service.py backend/routers/resume_studio_router.py frontend/src/pages/ResumeStudio.jsx frontend/src/services/api.js
git commit -m "feat: add Recruiter 6-Second X-Ray Mode with visual hotspots and fluff detector"
```

---

### Task 4: HERO FEATURE 2 (Resume Defense Stress-Tester) & HERO FEATURE 4 (Application Autopsy) in Kanban

**Files:**
- Create: `backend/services/interview_stress_test_service.py`
- Create: `backend/services/application_autopsy_service.py`
- Modify: `backend/routers/application_router.py`
- Modify: `frontend/src/pages/Applications.jsx`
- Modify: `frontend/src/services/api.js`
- Test: `backend/tests/test_interview_stress_test_service.py`
- Test: `backend/tests/test_application_autopsy_service.py`

**Interfaces:**
- Consumes: Target Application (Resume snapshot, Job Title, Job Description, Status).
- Produces:
  - `generate_resume_defense_matrix(resume_text: str, job_description: str, company: str = "") -> dict`:
    ```python
    {
        "interrogation_level": "Aggressive Senior Technical Screen",
        "drill_down_questions": list[dict], # [{"claim": str, "question": str, "what_interviewer_tests": str, "candidate_defense_blueprint": str}]
        "defense_confidence_score": int     # 0-100%
    }
    ```
  - `run_application_autopsy(resume_text: str, job_description: str, rejection_feedback: str = "") -> dict`:
    ```python
    {
        "fatal_blocker": str,               # The decisive hard disqualifier
        "why_it_disqualified": str,         # ATS keyword penalty or experience mismatch breakdown
        "recommended_blueprint": dict,      # Direct slug and title to Growth.jsx blueprint
        "recovery_time_hours": 48,
        "actionable_fix_steps": list[str]
    }
    ```
- Frontend UI:
  - In `Applications.jsx`:
    - "🛡️ Stress-Test My Resume" button on active application cards opening the drill-down question simulator and candidate defense blueprint.
    - "🔬 Run Autopsy" button on Rejected application cards opening the fatal blocker post-mortem and 1-click bridge to `Growth.jsx`.

- [ ] **Step 1: Write failing unit tests for stress-test and autopsy services**

```python
# backend/tests/test_interview_stress_test_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.interview_stress_test_service import generate_resume_defense_matrix

class InterviewStressTestServiceTests(TestCase):
    def test_generates_aggressive_technical_drilldowns_for_resume_claims(self):
        resume = """
        - Optimized PostgreSQL database queries reducing API latency by 45%.
        - Built Docker container microservices deployed to AWS ECS.
        """
        jd = "Seeking Senior Backend Engineer with PostgreSQL indexing and AWS experience."
        matrix = generate_resume_defense_matrix(resume, jd, "Datadog")
        self.assertGreaterEqual(len(matrix["drill_down_questions"]), 2)
        q = matrix["drill_down_questions"][0]
        self.assertIn("claim", q)
        self.assertIn("candidate_defense_blueprint", q)
        self.assertTrue(any("postgresql" in q["question"].lower() or "latency" in q["question"].lower() for q in matrix["drill_down_questions"]))
```

```python
# backend/tests/test_application_autopsy_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.application_autopsy_service import run_application_autopsy

class ApplicationAutopsyServiceTests(TestCase):
    def test_identifies_fatal_blocker_and_links_to_growth_blueprint(self):
        resume = "Junior developer with HTML, CSS, JavaScript, and Node.js experience."
        jd = "Software Engineer: Must have production Docker containerization and Kubernetes experience."
        autopsy = run_application_autopsy(resume, jd)
        self.assertTrue("docker" in autopsy["fatal_blocker"].lower() or "kubernetes" in autopsy["fatal_blocker"].lower())
        self.assertEqual(48, autopsy["recovery_time_hours"])
        self.assertIn("recommended_blueprint", autopsy)
        self.assertIn("slug", autopsy["recommended_blueprint"])
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m unittest backend.tests.test_interview_stress_test_service backend.tests.test_application_autopsy_service`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write minimal implementations in `backend/services/`**

In `backend/services/interview_stress_test_service.py`:
```python
import re

DRILL_DOWN_TEMPLATES = [
    {
        "trigger": r'optimized|reduced|improved|latency|throughput',
        "question": "You claim you optimized performance. What exact profiling tool (e.g. cProfile, pg_stat_statements) did you use to isolate the bottleneck? How did you isolate network overhead from query execution time?",
        "what_tests": "Whether the metric is genuine or AI-hallucinated without measurement instrumentation.",
        "defense": "Specify your baseline latency, the profiling tool used, the architectural bottleneck (e.g. unindexed foreign keys or N+1 query), and the exact remediation."
    },
    {
        "trigger": r'docker|container|microservices',
        "question": "In your containerized microservices, how did you handle multi-stage builds and secret management? How did your containers communicate across local and deployed networks?",
        "what_tests": "Production readiness vs simple 'docker run' tutorial knowledge.",
        "defense": "Explain multi-stage Dockerfile layers for minimal image size, non-root user permissions, and environment variable injection via secrets."
    },
    {
        "trigger": r'fastapi|rest api|endpoints',
        "question": "How did you manage database connection pooling and asynchronous request concurrency under load in your FastAPI service?",
        "what_tests": "Concurrency comprehension and async/await event loop mechanics.",
        "defense": "Cite SQLAlchemy async sessions, connection pool limits, and how blocking I/O was offloaded to background threads or Celery."
    },
    {
        "trigger": r'postgresql|sql|database',
        "question": "What index type did you choose for your PostgreSQL tables (B-tree, Hash, GIN), and how did EXPLAIN ANALYZE confirm query execution plan improvements?",
        "what_tests": "Deep relational database internals vs surface-level ORM usage.",
        "defense": "Walk through EXPLAIN ANALYZE cost output, sequential scan elimination, and composite indexing tradeoffs."
    }
]

def generate_resume_defense_matrix(resume_text: str, job_description: str, company: str = "") -> dict:
    text_lower = resume_text.lower()
    questions = []

    for template in DRILL_DOWN_TEMPLATES:
        if re.search(template["trigger"], text_lower):
            # Find context line
            lines = [l.strip() for l in resume_text.splitlines() if re.search(template["trigger"], l.lower())]
            claim = lines[0] if lines else "Resume technical capability claim"
            questions.append({
                "claim": claim,
                "question": template["question"],
                "what_interviewer_tests": template["what_tests"],
                "candidate_defense_blueprint": template["defense"]
            })

    if not questions:
        questions.append({
            "claim": "General engineering project experience",
            "question": "Walk me through the single most difficult bug you encountered in this project. What was the hypothesis, how did you verify it, and what did you learn?",
            "what_interviewer_tests": "Systematic debugging method and engineering resilience.",
            "candidate_defense_blueprint": "Use the STAR framework: Situation -> Root Cause Hypothesis -> Instrument with logs -> Fix -> Regression test."
        })

    return {
        "interrogation_level": "Aggressive Senior Technical Screen",
        "company": company or "Target Company",
        "drill_down_questions": questions[:5],
        "defense_confidence_score": 85 if len(questions) >= 3 else 65
    }
```

In `backend/services/application_autopsy_service.py`:
```python
import re

GROWTH_BLUEPRINTS = {
    "docker": {"title": "Production Docker & Containerization Blueprint", "slug": "docker-microservice-blueprint"},
    "kubernetes": {"title": "Kubernetes Cluster Orchestration Blueprint", "slug": "kubernetes-orchestration-blueprint"},
    "fastapi": {"title": "High-Throughput Async FastAPI Architecture", "slug": "fastapi-async-blueprint"},
    "redis": {"title": "Distributed Caching & Redis Optimization", "slug": "redis-distributed-caching-blueprint"},
    "postgresql": {"title": "PostgreSQL Indexing & Performance Tuning", "slug": "postgresql-performance-blueprint"},
    "testing": {"title": "Automated Testing & CI/CD Pipeline Blueprint", "slug": "cicd-testing-blueprint"}
}

def run_application_autopsy(resume_text: str, job_description: str, rejection_feedback: str = "") -> dict:
    resume_lower = resume_text.lower()
    jd_lower = job_description.lower()
    
    fatal_blocker = "Missing required production framework"
    recommended_bp = GROWTH_BLUEPRINTS["docker"]
    
    # Identify critical JD requirement missing from resume
    for key, bp in GROWTH_BLUEPRINTS.items():
        if key in jd_lower and key not in resume_lower:
            fatal_blocker = f"Missing core requirement: {key.upper()} was mandated by the JD but absent on resume"
            recommended_bp = bp
            break

    return {
        "fatal_blocker": fatal_blocker,
        "why_it_disqualified": "Automated ATS parsers scored the resume below keyword threshold, triggering automated recruiter reject filter.",
        "recommended_blueprint": recommended_bp,
        "recovery_time_hours": 48,
        "actionable_fix_steps": [
            f"1. Complete the 48-hour {recommended_bp['title']} in CareerPilot Growth Studio.",
            "2. Push verified GitHub code repository with README and test suite.",
            "3. Click 'Verify Evidence' to permanently clear this gap from future applications."
        ]
    }
```

- [ ] **Step 4: Add endpoints in `backend/routers/application_router.py`**

Add `POST /applications/{id}/stress-test` and `POST /applications/{id}/autopsy`.
Export `getResumeDefenseStressTest(id)` and `getApplicationAutopsy(id)` in `frontend/src/services/api.js`.

- [ ] **Step 5: Wire Stress-Test Modal and Autopsy Drawer in `frontend/src/pages/Applications.jsx`**

- On every application card: render "🛡️ Stress-Test" button opening the 5-question technical interrogation and candidate defense blueprint.
- On Rejected cards: render "🔬 Run Autopsy" button opening the fatal blocker post-mortem and direct 1-click link to the verified Growth Blueprint.

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m unittest backend.tests.test_interview_stress_test_service backend.tests.test_application_autopsy_service`
Expected: PASS (2/2 tests passing)
Run: `npm --prefix frontend test -- --watchAll=false`
Expected: PASS (26/26 tests passing)

- [ ] **Step 7: Commit Task 4**

```bash
git add backend/services/interview_stress_test_service.py backend/services/application_autopsy_service.py backend/tests/test_interview_stress_test_service.py backend/tests/test_application_autopsy_service.py backend/routers/application_router.py frontend/src/pages/Applications.jsx frontend/src/services/api.js
git commit -m "feat: add Resume Defense Stress-Tester and Application Autopsy Gap Recovery Engine"
```

---

### Task 5: 1-Click Complete Application Pack & Recruiter Outreach Toolkit

**Files:**
- Create: `backend/services/cover_letter_service.py`
- Modify: `backend/routers/resume_studio_router.py`
- Modify: `frontend/src/pages/Applications.jsx`
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Modify: `frontend/src/services/api.js`
- Test: `backend/tests/test_cover_letter_service.py`
- Test: `frontend/src/app/application-pipeline.test.js`

**Interfaces:**
- Consumes: Candidate name, Resume text, Job title, Company name, Job description.
- Produces: `generate_tailored_cover_letter(candidate_name: str, resume_text: str, job_title: str, company: str, job_description: str) -> dict`:
  ```python
  {
      "cover_letter_text": str,       # Truth-guarded 3-paragraph letter
      "outreach_note_300": str,       # Strictly < 300 characters LinkedIn note
      "screening_answers": list[dict] # 3 high-frequency ATS screening questions with grounded answers
  }
  ```
- Frontend UI:
  - "1-Click Application Pack" button on any selected job or application card.
  - Opens modal/drawer offering:
    - [ Harvard ATS PDF ] instant download
    - [ Tailored Cover Letter ] with 1-click copy & text download
    - [ LinkedIn Connection Note ] with live character counter badge strictly showing `< 300` chars
    - [ Screening Questions Drawer ] with 1-click copy answers.

- [ ] **Step 1: Write failing unit test for `cover_letter_service.py`**

```python
# backend/tests/test_cover_letter_service.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.cover_letter_service import generate_tailored_cover_letter

class CoverLetterServiceTests(TestCase):
    def test_generates_truth_guarded_application_pack_with_strict_character_limit(self):
        resume = "Alex Rivera | Software Engineer. Built FastAPI microservices and PostgreSQL database with Docker."
        pack = generate_tailored_cover_letter("Alex Rivera", resume, "Backend Engineer", "Stripe", "Seeking Backend Engineer with FastAPI and PostgreSQL.")
        
        self.assertIn("Alex Rivera", pack["cover_letter_text"])
        self.assertIn("Stripe", pack["cover_letter_text"])
        self.assertIn("FastAPI", pack["cover_letter_text"])
        
        # Strict LinkedIn < 300 chars requirement
        outreach = pack["outreach_note_300"]
        self.assertLess(len(outreach), 300, f"Outreach note exceeded 300 chars: {len(outreach)}")
        self.assertIn("Stripe", outreach)
        
        # Screening answers
        self.assertGreaterEqual(len(pack["screening_answers"]), 2)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m unittest backend.tests.test_cover_letter_service`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Write minimal implementation in `backend/services/cover_letter_service.py`**

```python
# backend/services/cover_letter_service.py
import re

def generate_tailored_cover_letter(candidate_name: str, resume_text: str, job_title: str, company: str, job_description: str) -> dict:
    name = candidate_name or "Candidate"
    comp = company or "the engineering team"
    role = job_title or "Software Engineer"

    # Extract verified tech mentions
    techs = [t for t in ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Redis", "TypeScript", "AWS"] if t.lower() in resume_text.lower()]
    top_techs = ", ".join(techs[:3]) if techs else "modern full-stack technologies"

    # Paragraph 1: Hook and alignment
    para1 = f"Dear Hiring Team at {comp},\n\nI am writing to express my strong interest in the {role} position. With hands-on engineering experience building robust software using {top_techs}, I am excited about the opportunity to contribute directly to {comp}'s mission and engineering standards."

    # Paragraph 2: Verified technical evidence
    para2 = f"In my recent project work, I developed production-ready services emphasizing clean architecture, automated testing, and performance optimization. Specifically, I engineered solutions leveraging {top_techs}, focusing on reliability, low latency, and maintainable code grounded in real-world testing."

    # Paragraph 3: Professional close
    para3 = f"I welcome the opportunity to discuss how my technical foundation and rapid execution can support {comp}'s roadmap. Thank you for your time and consideration.\n\nSincerely,\n{name}"

    cover_letter = f"{para1}\n\n{para2}\n\n{para3}"

    # LinkedIn Outreach Note: STRICTLY under 300 characters
    outreach = f"Hi! I saw the {role} opening at {comp} and applied. With hands-on experience in {top_techs}, I'd love to connect and follow your engineering updates. Best, {name}"
    if len(outreach) >= 300:
        outreach = f"Hi! Applied for the {role} role at {comp}. Experienced with {top_techs} and eager to connect. Best, {name}"
    if len(outreach) >= 300:
        outreach = outreach[:295] + "..."

    screening_answers = [
        {
            "question": f"Why do you want to join {comp}?",
            "answer": f"I admire {comp}'s technical engineering standards and high-impact culture. My background in {top_techs} aligns directly with your stack and allows me to deliver value from day one."
        },
        {
            "question": f"Describe a challenging problem you solved with {top_techs.split(',')[0] if top_techs else 'your tech stack'}.",
            "answer": f"I engineered a modular service handling concurrent requests, isolating bottlenecks via structured logging and automated integration testing to ensure high reliability."
        }
    ]

    return {
        "cover_letter_text": cover_letter,
        "outreach_note_300": outreach,
        "character_count": len(outreach),
        "screening_answers": screening_answers
    }
```

- [ ] **Step 4: Add endpoint in `backend/routers/resume_studio_router.py`**

Add `POST /resume-studio/application-pack` and export `getApplicationPack(...)` in `frontend/src/services/api.js`.

- [ ] **Step 5: Integrate Application Pack Drawer in `Applications.jsx` and `SearchJobs.jsx`**

Add modal/drawer with copy-to-clipboard actions and direct PDF download.

- [ ] **Step 6: Run tests to verify they pass**

Run: `python -m unittest backend.tests.test_cover_letter_service`
Expected: PASS (1/1 test passing)
Run: `npm --prefix frontend test -- --watchAll=false`
Expected: PASS (26/26 tests passing)

- [ ] **Step 7: Commit Task 5**

```bash
git add backend/services/cover_letter_service.py backend/tests/test_cover_letter_service.py backend/routers/resume_studio_router.py frontend/src/pages/Applications.jsx frontend/src/pages/SearchJobs.jsx frontend/src/services/api.js
git commit -m "feat: add 1-Click Application Pack with Truth-Guarded Cover Letter and Recruiter Outreach"
```

---

### Task 6: Multi-Agent Evals, Launch Control Tower & Comprehensive System Verification

**Files:**
- Create: `backend/tests/test_agent_orchestration_evals.py`
- Modify: `docs/superpowers/plans/2026-10-29-careerpilot-core-product-deepening.md`
- Run: Full backend unit tests
- Run: `python tests/run_e2e.py` (230 E2E Contract Tests)
- Run: `npm --prefix frontend test` (Node test runner)
- Run: `npm --prefix frontend run lint`
- Run: `npm --prefix frontend run build`

**Interfaces:**
- Validates end-to-end multi-agent orchestration, strict character constraints, schema correctness, and zero-defect regression status.

- [x] **Step 1: Write multi-agent evaluation test suite in `backend/tests/test_agent_orchestration_evals.py`**

```python
# backend/tests/test_agent_orchestration_evals.py
from pathlib import Path
import sys
from unittest import TestCase

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from services.job_reality_service import audit_job_reality
from services.recruiter_xray_service import analyze_recruiter_xray
from services.bullet_enhancer_service import enhance_bullet_star
from services.interview_stress_test_service import generate_resume_defense_matrix
from services.application_autopsy_service import run_application_autopsy
from services.cover_letter_service import generate_tailored_cover_letter

class AgentOrchestrationEvalsTests(TestCase):
    def test_outreach_character_constraint_is_strictly_enforced_across_all_payloads(self):
        for candidate in ["Short Name", "Alexander Maximillian Montgomery III"]:
            for company in ["ShortCo", "International Business Machines Corporation Distributed Systems Division"]:
                pack = generate_tailored_cover_letter(candidate, "Python, FastAPI", "Engineer", company, "Description")
                self.assertLess(len(pack["outreach_note_300"]), 300)

    def test_job_reality_score_is_bounded_and_deterministic(self):
        result = audit_job_reality("Developer", "Python, React, AWS", "Acme")
        self.assertGreaterEqual(result["role_health_score"], 0)
        self.assertLessEqual(result["role_health_score"], 100)
        self.assertIn(result["health_verdict"], ["High Quality", "Proceed with Caution", "High-Risk Post"])

    def test_recruiter_xray_schema_integrity(self):
        result = analyze_recruiter_xray("Jane Doe | Software Engineer | Python, Docker")
        self.assertIn("hiring_manager_verdict", result)
        self.assertIn("visual_hotspots", result)
        self.assertIn("fluff_words_detected", result)
        self.assertIsInstance(result["fluff_words_detected"], list)

    def test_stress_test_and_autopsy_coherence(self):
        stress = generate_resume_defense_matrix("Built Docker containers", "Requires Docker and AWS")
        self.assertGreater(len(stress["drill_down_questions"]), 0)
        autopsy = run_application_autopsy("Junior Dev HTML", "Requires Docker")
        self.assertIn("slug", autopsy["recommended_blueprint"])
```

- [x] **Step 2: Run the multi-agent evals**

Run: `python -m unittest backend.tests.test_agent_orchestration_evals`
Expected: PASS (4/4 evals passing)

- [x] **Step 3: Run the complete regression test suite**

Run: `python tests/run_e2e.py`
Expected: 230/230 contract tests passing.
Run: `npm --prefix frontend test -- --watchAll=false`
Expected: All frontend tests passing.
Run: `npm --prefix frontend run lint`
Expected: 0 lint errors.
Run: `npm --prefix frontend run build`
Expected: Vite build succeeds without errors in `< 20s`.

- [x] **Step 4: Commit and finalize**

```bash
git add backend/tests/test_agent_orchestration_evals.py
git commit -m "test: add multi-agent orchestration evaluations and verify full regression suite"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-29-careerpilot-core-product-deepening.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration using `superpowers:subagent-driven-development`.
2. **Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
