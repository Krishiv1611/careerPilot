# CareerPilot Product Completion and Modern Minimalist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the approved CareerPilot student workflow and replace the blue editorial theme with the approved Modern Minimalist design system.

**Architecture:** Keep the React/Vite frontend and FastAPI/PostgreSQL modular monolith. Keep the deterministic LangGraph supervisor with only the Job Discovery Agent and Resume & Evidence Agent; add focused services and persistence models behind those workflows.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, FastAPI, SQLAlchemy, Alembic, PostgreSQL, LangGraph, SerpAPI, Tavily, GitHub App/MCP, python-docx, ReportLab.

## Global Constraints

- Preserve unrelated changes and do not commit without explicit user authorization.
- PostgreSQL is the only runtime application database; SQLite is permitted only inside isolated tests.
- No Interview Agent, extra agent swarm, fake UI data, browser-stored credentials, or automatic applications.
- All generated resume claims must pass deterministic truth checks.
- Use the Modern Minimalist palette: `#36454f`, `#708090`, `#d3d3d3`, `#f4f5f5`, and `#ffffff`.

---

### Task 1: Modern Minimalist frontend system

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/layout/AppSidebar.jsx`
- Modify: `frontend/src/components/layout/MobileNavigation.jsx`
- Modify: `frontend/src/components/layout/Layout.jsx`
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/pages/*.jsx`
- Test: `frontend/src/app/navigation.test.js`
- Create: `frontend/src/app/theme.test.js`

**Interfaces:**
- Produces CSS semantic colors and shared shell behavior consumed by every frontend page.

- [ ] Write a failing source-contract test that rejects the old blue/navy hex values and requires the Modern Minimalist tokens.
- [ ] Run the test and confirm it fails on the existing palette.
- [ ] Add CSS theme variables, typography, focus, reduced-motion, and selection rules.
- [ ] Convert shell, public pages, actions, selected states, and panels to the approved palette.
- [ ] Run native frontend tests, ESLint, and the production build.
- [ ] Review desktop and mobile screenshots and correct overflow or contrast issues.

### Task 2: Resume proposal and approval loop

**Files:**
- Create: `backend/services/resume_diff_service.py`
- Modify: `backend/services/resume_tailoring_service.py`
- Modify: `backend/agents/resume_evidence_agent.py`
- Modify: `backend/models/resume_version_model.py`
- Modify: `backend/models/schemas.py`
- Modify: `backend/routers/resume_studio_router.py`
- Modify: `backend/migrations/versions/20260809_01_product_foundation.py`
- Create: `backend/tests/test_resume_diff_service.py`
- Modify: `backend/tests/test_resume_tailoring_service.py`
- Modify: `frontend/src/pages/ResumeStudio.jsx`
- Create: `frontend/src/app/resume-proposals.js`
- Create: `frontend/src/app/resume-proposals.test.js`

**Interfaces:**
- Produces `changes`, `approval_status`, and `approved_content` for each immutable resume version.

- [ ] Write failing tests for line diffs, unsupported claims, accept/reject selection, and version immutability.
- [ ] Run the focused tests and confirm the missing behavior fails.
- [ ] Implement deterministic proposal generation and truth-checked edit operations.
- [ ] Persist proposal changes and approval state through the migration and router.
- [ ] Add change review, accept/reject/edit controls, and approved-version download gating.
- [ ] Run backend tests, frontend helper tests, lint, and build.

### Task 3: Template-preserving DOCX export

**Files:**
- Modify: `backend/services/docx_resume_service.py`
- Create: `backend/tests/test_docx_resume_service.py`
- Modify: `backend/routers/resume_studio_router.py`

**Interfaces:**
- Consumes approved resume content and the original stored DOCX.
- Produces an in-memory DOCX while retaining paragraph styles, tables, headers, and footers.

- [ ] Write a failing in-memory DOCX test with styled paragraphs and a table.
- [ ] Confirm the current position-based replacement loses the required structure or text mapping.
- [ ] Implement section-aware replacement without deleting unused template paragraphs.
- [ ] Require an approved version before export and preserve the PDF best-effort label.
- [ ] Run DOCX, router, and truth-guard tests.

### Task 4: User-scoped and freshness-aware jobs

**Files:**
- Create: `backend/models/user_job_model.py`
- Modify: `backend/models/__init__.py`
- Modify: `backend/models/job_model.py`
- Modify: `backend/migrations/versions/20260809_01_product_foundation.py`
- Modify: `backend/routers/discovery_router.py`
- Modify: `backend/routers/job_router.py`
- Modify: `backend/services/job_discovery_service.py`
- Create: `backend/tests/test_user_job_service.py`
- Modify: `backend/tests/test_job_discovery_service.py`
- Modify: `frontend/src/pages/SearchJobs.jsx`

**Interfaces:**
- Produces one `user_jobs` association per user and canonical job with `discovered`, `saved`, or `dismissed` state.

- [ ] Write failing ownership and freshness tests.
- [ ] Add the association model and migration.
- [ ] Scope job listing and user actions to the authenticated student.
- [ ] Distinguish candidate heuristic results from live verified results and hide stale records by default.
- [ ] Add Save and Dismiss controls without creating an Application.
- [ ] Run discovery, security, migration, and frontend tests.

### Task 5: GitHub evidence approval

**Files:**
- Modify: `backend/models/github_evidence_model.py`
- Modify: `backend/migrations/versions/20260809_01_product_foundation.py`
- Modify: `backend/routers/github_router.py`
- Modify: `backend/services/github_project_ranker.py`
- Create: `backend/tests/test_github_evidence_approval.py`
- Modify: `frontend/src/pages/ResumeStudio.jsx`

**Interfaces:**
- Produces an approved evidence assertion containing repository, contribution, supported skills, wording, and optional student-supplied outcome.

- [ ] Write failing tests that prohibit insertion before explicit student confirmation.
- [ ] Persist evidence approval fields and ownership checks.
- [ ] Create a new resume proposal from confirmed evidence rather than mutating a version.
- [ ] Add the contribution confirmation form and proposal preview.
- [ ] Run GitHub, resume, migration, lint, and build tests.

### Task 6: Today actions and persistent Growth

**Files:**
- Create: `backend/models/growth_priority_model.py`
- Create: `backend/services/today_service.py`
- Modify: `backend/services/growth_service.py`
- Create: `backend/routers/today_router.py`
- Modify: `backend/routers/growth_router.py`
- Modify: `backend/main.py`
- Modify: `backend/migrations/versions/20260809_01_product_foundation.py`
- Create: `backend/tests/test_today_service.py`
- Modify: `backend/tests/test_growth_service.py`
- Modify: `frontend/src/pages/Home.jsx`
- Modify: `frontend/src/pages/Growth.jsx`
- Modify: `frontend/src/services/api.js`

**Interfaces:**
- Produces one prioritized Today action and at most three persisted evidence priorities.

- [ ] Write failing priority-order and evidence-completion tests.
- [ ] Add persistence and authenticated endpoints.
- [ ] Replace client-side Today inference with the server action response.
- [ ] Add Growth completion only through an evidence link or explicit external completion.
- [ ] Run service, router, migration, frontend, lint, and build tests.

### Task 7: Data and security hardening

**Files:**
- Modify: `backend/models/database.py`
- Modify: `backend/routers/application_router.py`
- Modify: `backend/routers/auth_router.py`
- Modify: `backend/utils/auth.py`
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Create: `backend/tests/test_application_ownership.py`
- Create: `backend/tests/test_auth_security.py`

**Interfaces:**
- Produces PostgreSQL-only runtime configuration and ownership-safe application/authentication behavior.

- [ ] Write failing tests for application resume ownership, password length, and login throttling.
- [ ] Remove inactive SQLite path creation from runtime database setup.
- [ ] Add ownership validation and bounded in-process authentication throttling suitable for the current single-instance deployment.
- [ ] Add PostgreSQL to local Compose and document secure production cookie settings.
- [ ] Run security, migration, startup, and complete backend tests.

### Task 8: Full release verification

**Files:**
- Modify: `README.md`
- Modify: `backend/analysis/README.md`
- Create or modify: end-to-end test configuration and browser fixtures.

**Interfaces:**
- Verifies the complete approved student workflow without fake provider results.

- [ ] Run all backend and product-surface tests.
- [ ] Run Python compilation and Alembic migration checks.
- [ ] Run all frontend native tests, ESLint, and the production build.
- [ ] Run the authenticated browser flow at desktop and mobile widths.
- [ ] Run `git diff --check`, inspect status, and confirm legacy user data was not modified.
- [ ] Update documentation to describe the real runtime and remaining live-provider prerequisites.
