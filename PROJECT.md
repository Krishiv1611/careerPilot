# Project: CareerPilot Modernization

## Architecture
CareerPilot is a student-centric career operating system providing intelligent job discovery, deterministic resume-to-job matching, truth-guarded AI resume tailoring, ATS-compliant PDF generation, platform connector integrations, recruiter outreach generation, and an interactive Kanban application tracker.

### High-Level Components
1. **Job Discovery & Anti-Spam (Backend + Frontend)**:
   - Providers: Tavily (`TAVILY_API_KEY` / `TAVILY_SEARCH_API_KEY`) and SerpAPI concurrent search.
   - Negative Query & Body Anti-Spam Filtering: strips bootcamps, courses, paid training programs.
   - Experience Classifier: isolates candidate requirements from company founding history ("founded 10 years ago") and mentorship mentions; correctly includes 0-3 years fresher ranges.
   - Persistent Saved Jobs: `UserJob` state persistence, `GET /jobs/saved` endpoint, and distinct "Saved for Later" tab in `SearchJobs.jsx`.

2. **Deterministic Matching Engine & Flexible State Machine (Backend)**:
   - Multiline Bullet Parser: extracts full bullet lists under `Requirements:`, `Must-Have:`, `Qualifications:`.
   - Gap Categorizer: partitions missing skills into Hard Blockers (`missing_must_haves`) vs Preferred Gaps (`preferred_gaps`).
   - Flexible State Machine: enables `Saved -> Applied` direct transition, enables reopening `Rejected` / `Withdrawn` records.
   - Tailored Resume Version Linkage: `Application.resume_version_id` links directly to `ResumeVersion.id`.

3. **Truth-Guarded Gemini AI Resume Tailoring (Backend + Frontend)**:
   - LangChain ChatModel / Gemini REST adapter with structured Pydantic schemas.
   - Natural Language Prompt Handler: parses instructions like "Emphasize REST API design with STAR format" without 400 errors.
   - Deterministic 3-Tier TruthGuardEngine: guarantees 0 invented metrics, unmentioned tools, or fabricated employers; converts unsupported claims to qualitative STAR impact.
   - Interactive Diff Review: per-bullet before/proposed comparisons with individual accept/reject decisions.

4. **Professional ATS-Compliant PDF Engine (Backend)**:
   - `AtsPdfService` using ReportLab Platypus (`SimpleDocTemplate`, `Paragraph`, `Spacer`, `HRFlowable`).
   - Single-column standard hierarchy: contact info, bold uppercase section headers, rule dividers, bullet indentation, 0.5in margins.

5. **Platform Connectors Hub (Backend + Frontend)**:
   - LeetCode Connector: public GraphQL client fetching solved problem counts (Easy/Med/Hard) and global ranking.
   - GitHub Connector: public REST client fetching public repositories, stars, and language distribution.
   - LinkedIn Connector: URL validator and profile PDF parser.
   - Connectors Hub UI: tab/card view in `Settings.jsx` or Profile.

6. **Recruiter Outreach Generator & Kanban Application Board (Backend + Frontend)**:
   - Outreach Service: 1-click generation of personalized LinkedIn connection notes (<300 characters) and cold emails referencing candidate evidence.
   - Applications Kanban Workspace: toggle between Master-Detail List View and interactive 6-column Kanban Pipeline (`Saved` -> `Preparing` -> `Applied` -> `Interview` -> `Offer` -> `Rejected`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Dual Tavily API Key Support | Support both `TAVILY_API_KEY` and `TAVILY_SEARCH_API_KEY` seamlessly | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Anti-Spam Query & Body Filter | Exclude bootcamps, courses, and deceptive training programs in query and body text | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Accurate Fresher Experience Filter | Disregard company age ("founded 10 years ago") and mentorship; include 0-3 years | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Persistent Saved Jobs Tab | Dedicated `GET /jobs/saved` endpoint and separate "Saved for Later" UI tab | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Multiline Bullet Parser | Parse multiline bullet requirements following headers like "Requirements:" | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Gap Categorization | Categorize candidate gaps into Hard Blockers (Must-Have) vs Preferred (Nice-to-Have) | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Flexible Application State Machine | Allow `Saved` -> `Applied` directly; allow reopening `Rejected`/`Withdrawn` records | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Tailored Resume Version Linking | Link each application directly to the submitted tailored `resume_version_id` | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Gemini LangChain Structured Tailoring | Structured Pydantic outputs rephrasing bullets into STAR format with job keywords | M3 | ORIGINAL_REQUEST §R3 |
| 10 | Natural Language Instruction Handling | Accept prompts (e.g. "Emphasize REST API design with STAR format") without 400 errors | M3 | ORIGINAL_REQUEST §R3 |
| 11 | Truth-Guarded Anti-Hallucination | Strictly prevent invented metrics, unmentioned tools, or hallucinated employers | M3 | ORIGINAL_REQUEST §R3 |
| 12 | Bullet-Level Diff Review | Interactive diff review allowing student to accept/reject each tailored change | M3 | ORIGINAL_REQUEST §R3 |
| 13 | Professional ATS Single-Column PDF | ReportLab Platypus PDF export with typography, headers, dividers, and proper margins | M4 | ORIGINAL_REQUEST §R4 |
| 14 | LeetCode Platform Connector | GraphQL connector fetching verified problem counts (Easy/Med/Hard) and ranking | M5 | ORIGINAL_REQUEST §R5 |
| 15 | Public GitHub Connector | REST connector fetching public repos, stars, and language distribution | M5 | ORIGINAL_REQUEST §R5 |
| 16 | LinkedIn Connector & PDF Parser | URL regex validation and LinkedIn profile PDF parser extracting structured sections | M5 | ORIGINAL_REQUEST §R5 |
| 17 | Platform Connectors Hub UI | Frontend interface in Settings/Profile for managing and viewing connected platforms | M5 | ORIGINAL_REQUEST §R5 |
| 18 | LinkedIn Outreach Generator | 1-click personalized LinkedIn connection note strictly < 300 characters | M6 | ORIGINAL_REQUEST §R6 |
| 19 | Cold Email Generator | Personalized email with subject line referencing matched candidate evidence | M6 | ORIGINAL_REQUEST §R6 |
| 20 | Interactive Kanban Application Board | Kanban pipeline with List/Kanban toggle, status transitions, and tailored resume links | M6 | ORIGINAL_REQUEST §R6 |
| 21 | Backend Test Suite Verification | All unit tests pass cleanly: `python -m unittest discover -s backend/tests -p "test_*.py"` | M7 | ORIGINAL_REQUEST Acceptance Criteria |
| 22 | Frontend Build & Test Verification | Frontend builds cleanly: `npm run build` and `npm test` inside `frontend` | M7 | ORIGINAL_REQUEST Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Job Discovery, Anti-Spam & Saved Jobs | Features 1, 2, 3, 4 | none | PLANNED |
| M2 | Deterministic Matching Engine & Flexible State Machine | Features 5, 6, 7, 8 | none | PLANNED |
| M3 | Truth-Guarded Gemini Resume Tailoring & Diff Review | Features 9, 10, 11, 12 | none | PLANNED |
| M4 | Professional ATS-Compliant PDF Resume Template | Feature 13 | M3 | PLANNED |
| M5 | Platform Connectors Hub (LeetCode, GitHub, LinkedIn) | Features 14, 15, 16, 17 | none | PLANNED |
| M6 | Recruiter Outreach Generator & Kanban Application Board | Features 18, 19, 20 | M2, M5 | PLANNED |
| M7 | Final Milestone: Full E2E Test Suite Pass & Adversarial Hardening | Features 21, 22, 100% E2E test pass | M1, M2, M3, M4, M5, M6, E2E Track | PLANNED |

---

## Interface Contracts

### 1. Job Discovery ↔ Frontend
- `POST /discovery/search`
  - Input: `{ "role": str, "location": str | None, "employment_type": str | None }`
  - Output: `{ "jobs": list[JobSchema], "warnings": list[str] }`
- `GET /jobs/saved`
  - Output: `list[JobSchema]`
- `POST /jobs/{job_id}/save` & `POST /jobs/{job_id}/dismiss`
  - Output: `{ "message": str, "job_id": str, "state": str }`

### 2. Matching Engine ↔ Applications & UI
- `match_resume_to_job(resume_text: str, job_description: str, job_title: str = "") -> dict`:
  - Output:
    ```python
    {
        "fit_score": int,  # 0-100
        "eligibility_status": str,  # "eligible" | "not_eligible"
        "eligibility_reason": str,
        "matched_skills": list[str],
        "hard_blockers": list[str],      # Missing must-have skills
        "preferred_gaps": list[str],     # Missing preferred/nice-to-have skills
        "must_have_skills": list[str],
        "preferred_skills": list[str]
    }
    ```

### 3. Application State Machine
- `change_status(current_status: str, next_status: str, actor_role: str = "user") -> str`:
  - Allowed transitions:
    - `Saved` -> `{"Preparing", "Applied", "Withdrawn"}`
    - `Preparing` -> `{"Saved", "Applied", "Withdrawn"}`
    - `Applied` -> `{"Assessment", "Interview", "Offer", "Rejected", "Withdrawn"}`
    - `Assessment` -> `{"Interview", "Offer", "Rejected", "Withdrawn"}`
    - `Interview` -> `{"Offer", "Rejected", "Withdrawn"}`
    - `Offer` -> `{"Applied", "Interview", "Withdrawn"}`
    - `Rejected` -> `{"Saved", "Preparing", "Applied"}`  # Reopen
    - `Withdrawn` -> `{"Saved", "Preparing", "Applied"}` # Reopen
- Schema: `Application` table has `resume_version_id = Column(String, ForeignKey("resume_versions.id"), nullable=True)`.

### 4. Resume Tailoring ↔ Truth Guard ↔ ATS PDF
- `tailor_resume_bullets(resume_text: str, job_description: str, instruction: str) -> TailoredResumeOutput`:
  - Natural language instruction accepted without 400 error.
  - Returns `bullets`: list of `{ bullet_id, original_text, tailored_text, star_breakdown, grounded_skills, explanation }`.
- `TruthGuardEngine.validate_bullet(original_bullet: str, tailored_bullet: str, allowed_skills: set[str], missing_skills: set[str]) -> (is_valid: bool, reason: str, sanitized_bullet: str)`:
  - Disallows invented numbers/metrics/tools/employers. Converts invalid claims to grounded qualitative STAR phrasing.
- `AtsPdfService.build_pdf(resume_text: str, candidate_name: str | None = None) -> BytesIO`:
  - Standard single-column ReportLab Platypus document.

### 5. Platform Connectors ↔ Candidate Profile
- `POST /connectors/leetcode` -> `{ "username": str }`
  - Output: `{ "username": str, "ranking": int, "easy_solved": int, "medium_solved": int, "hard_solved": int, "total_solved": int }`
- `POST /connectors/github/public` -> `{ "username": str }`
  - Output: `{ "username": str, "public_repos": int, "stars": int, "top_languages": list[str], "repos": list[dict] }`
- `POST /connectors/linkedin/link` -> `{ "url": str }`
  - Output: `{ "url": str, "status": "linked" }`
- `POST /connectors/linkedin/import-pdf` -> `UploadFile`
  - Output: `{ "headline": str, "summary": str, "experience": list, "education": list, "skills": list }`

### 6. Recruiter Outreach Generator
- `POST /outreach/generate` -> `{ "job_id": str, "application_id": str | None, "resume_version_id": str | None }`
  - Output:
    ```json
    {
      "linkedin_note": str,       # Strictly < 300 characters
      "linkedin_char_count": int, # <= 299
      "email_subject": str,
      "email_body": str
    }
    ```

---

## Code Layout

### Backend (`backend/`)
- `agents/`: Supervisor, job discovery, resume evidence LangGraph agents.
- `models/`: SQLAlchemy ORM models (`job_model.py`, `user_job_model.py`, `application_model.py`, `resume_model.py`, `connector_model.py`, `database.py`, `schemas.py`).
- `routers/`: FastAPI endpoints (`discovery_router.py`, `job_router.py`, `application_router.py`, `resume_studio_router.py`, `connector_router.py`, `outreach_router.py`).
- `services/`: Business logic (`job_discovery_service.py`, `matching_service.py`, `application_service.py`, `resume_tailoring_service.py`, `truth_guard_service.py`, `ats_pdf_service.py`, `leetcode_service.py`, `github_public_service.py`, `linkedin_pdf_service.py`, `outreach_service.py`, `skill_extractor.py`).
- `tests/`: Unittest test suite executed via `python -m unittest discover -s backend/tests -p "test_*.py"`.

### Frontend (`frontend/`)
- `src/pages/`: `SearchJobs.jsx`, `Applications.jsx`, `ResumeStudio.jsx`, `Settings.jsx`, `UploadResume.jsx`, `Dashboard.jsx`.
- `src/components/`: Reusable UI components (`KanbanBoard.jsx`, `OutreachModal.jsx`, `ConnectorsHub.jsx`, `DiffBlock.jsx`).
- `src/app/`: Client-side logic, helpers, and unit tests (`kanban.js`, `kanban.test.js`, `outreach.js`, `outreach.test.js`, `navigation.js`, `navigation.test.js`).
