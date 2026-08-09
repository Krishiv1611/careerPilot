# Career Track Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the bundled resume-category model to CareerPilot as top-three, student-controlled target-role suggestions.

**Architecture:** A checksum-verified classifier service is exposed only through the Resume & Evidence Agent. Resume upload stores advisory suggestions, and the Resume & Profile UI lets the student explicitly merge one into existing target roles.

**Tech Stack:** Python 3.12/3.13, scikit-learn 1.7.2, LangGraph 0.6.4, FastAPI, SQLAlchemy/Alembic, React 19, native Node tests.

## Global Constraints

- Never let classifier output automatically restrict or start job discovery.
- Resume upload must succeed when classification is unavailable.
- Never load an artifact until its repository SHA-256 checksum matches.
- Call classification through the existing Resume & Evidence Agent; do not add another agent.
- Preserve the existing CareerPilot visual language and mobile layout.
- Do not commit without explicit user authorization.

---

### Task 1: Trusted career-track classifier

**Files:**
- Create: `backend/services/career_track_classifier.py`
- Create: `backend/tests/test_career_track_classifier.py`
- Modify: `backend/requirements.txt`
- Modify: `pyproject.toml`

**Interfaces:**
- Produces: `suggest_career_tracks(resume_text: str, limit: int = 3) -> dict`
- Result: `{"available": bool, "suggestions": list[dict], "warning": str | None, "model_version": str}`

- [ ] Write failing tests with small fake vectorizer/model objects for ordered top-three output, the `0.10` threshold, unknown class handling, and empty text.
- [ ] Write a failing test that changes an artifact byte and confirms checksum validation rejects it before deserialization.
- [ ] Run `python -m unittest backend.tests.test_career_track_classifier -v` and confirm the classifier import or behavior fails for the intended reason.
- [ ] Implement fixed artifact paths, SHA-256 verification, lazy trusted loading, lightweight cleanup, the 25-label mapping, and structured fallback.
- [ ] Add `scikit-learn==1.7.2` to runtime dependencies; keep notebook-only plotting/Jupyter packages in the analysis extra.
- [ ] Run the classifier tests and a bundled-artifact smoke prediction.

### Task 2: Resume & Evidence Agent routing

**Files:**
- Modify: `backend/agents/state.py`
- Modify: `backend/agents/resume_evidence_agent.py`
- Modify: `backend/agents/career_supervisor.py`
- Modify: `backend/tests/test_agent_workflows.py`

**Interfaces:**
- Consumes: `suggest_career_tracks(resume_text, limit=3)`
- Produces: state key `career_track_result`

- [ ] Add a failing workflow test for task `suggest_career_tracks` using an injected predictor and assert `handled_by == "resume_evidence_agent"`.
- [ ] Run the focused workflow test and confirm the supervisor rejects the new task.
- [ ] Extend the typed state and supervisor route; have the Resume & Evidence Agent call the injected predictor or the production classifier.
- [ ] Run all agent workflow tests.

### Task 3: Persistence and upload integration

**Files:**
- Modify: `backend/models/resume_model.py`
- Modify: `backend/models/schemas.py`
- Modify: `backend/migrations/versions/20260809_01_product_foundation.py`
- Modify: `backend/routers/resume_router.py`
- Modify: `backend/tests/test_migration_contract.py`
- Create: `backend/tests/test_resume_career_track_integration.py`

**Interfaces:**
- Persists: `Resume.career_track_suggestions: list[dict]`
- Exposes: `ResumeResponseModel.career_track_suggestions`

- [ ] Extend the migration contract first and confirm it fails because the column is missing.
- [ ] Add a service-level integration test proving an unavailable classifier still creates resume data with an empty suggestion list.
- [ ] Add the JSON column to the model and both new/existing database migration paths.
- [ ] Route cleaned resume text through LangGraph during upload, save the first category and ordered suggestions, and convert all classifier failures to an empty list.
- [ ] Run migration, startup, and resume integration tests.

### Task 4: Explicit target-role confirmation UI

**Files:**
- Create: `frontend/src/app/career-track-suggestions.js`
- Create: `frontend/src/app/career-track-suggestions.test.js`
- Modify: `frontend/src/pages/UploadResume.jsx`

**Interfaces:**
- Produces: `mergeTargetRole(profile, category) -> profile payload`
- Consumes: `resume.career_track_suggestions`

- [ ] Write a failing native Node test that merges a suggestion without losing target roles, locations, or employment types and does not duplicate case-insensitive matches.
- [ ] Run `node --test frontend/src/app/career-track-suggestions.test.js` and confirm the missing module or behavior fails.
- [ ] Implement the pure merge helper.
- [ ] Add the numbered track rail to `ResumeEvidence`; pass the current profile and confirmation callback from the page.
- [ ] Disable a row while saving, show “In target roles” after success, and preserve the existing error region on failure.
- [ ] Run the helper test, ESLint, and the production build.

### Task 5: Full verification

**Files:**
- Modify documentation only if behavior differs from the design.

- [ ] Run `python -m unittest discover -s backend/tests -p "test_*.py" -v` in the complete backend environment.
- [ ] Run `python -m unittest discover -s tests -p "test_*.py" -v`.
- [ ] Run `python -m compileall -q backend`.
- [ ] Run both native frontend test files.
- [ ] Run `npm.cmd run lint` and read all warnings.
- [ ] Run `npm run build` and inspect emitted chunks.
- [ ] Run `git diff --check` and confirm no model, notebook, dataset, or unrelated user change was removed.
