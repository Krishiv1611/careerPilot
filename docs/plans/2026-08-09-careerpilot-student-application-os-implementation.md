# CareerPilot Student Application OS — Implementation Plan

> Execute this plan as vertical, test-driven slices. Preserve unrelated user changes and do not commit without explicit authorization.

**Goal:** Transform the current prototype into a student-first workflow that connects an evidence profile, verified job discovery, explainable matching, evidence-aware resume tailoring, and explicit application tracking.

**Architecture:** Keep a React/Vite frontend and FastAPI/PostgreSQL modular monolith. Replace the old overlapping agent swarm with a focused LangGraph multi-agent workflow: a deterministic supervisor routes work to a Job Discovery Agent or Resume & Evidence Agent, and both use deterministic services for filtering, truth checks, and persistence. Add a worker only when long-running tasks require it.

**Current baseline:** Frontend production build passes with a large-bundle warning. ESLint fails. Python compilation passes. There are no automated tests or migrations. The workspace contains an uncommitted interview feature that is explicitly rejected.

---

## Task 1: Remove the rejected interview slice

**Files:**

- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/package.json`
- Regenerate: `frontend/package-lock.json`
- Modify: `backend/main.py`
- Modify: `backend/models/__init__.py`
- Modify: `backend/models/schemas.py`
- Modify: `backend/models/user_model.py`
- Delete: `frontend/src/pages/InterviewSetup.jsx`
- Delete: `frontend/src/pages/ActiveInterview.jsx`
- Delete: `frontend/src/pages/InterviewReport.jsx`
- Delete: `frontend/src/components/ui/select.jsx` if unused after removal
- Delete: `backend/agents/interview_agent.py`
- Delete: `backend/agents/interview_evaluator_agent.py`
- Delete: `backend/agents/interview_graph.py`
- Delete: `backend/agents/interview_state.py`
- Delete: `backend/models/interview_model.py`
- Delete: `backend/routers/interview_router.py`

**Steps:**

1. Add a route-surface test that asserts no interview route or navigation label exists.
2. Run the test and confirm it fails against the current source.
3. Remove interview imports, routes, relationships, and schemas.
4. Remove interview-only frontend dependencies and regenerate the lockfile.
5. Run frontend build/lint and Python compile checks.
6. Confirm no `interview` references remain outside superseded documentation.

## Task 2: Establish test and migration foundations

**Files:**

- Modify: `pyproject.toml`
- Modify: `frontend/package.json`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_route_security.py`
- Create: `frontend/src/test/setup.js`
- Create: `frontend/src/app/AppRoutes.test.jsx`
- Create: `alembic.ini`
- Create: `backend/migrations/env.py`
- Create: `backend/migrations/versions/<revision>_baseline.py`

**Steps:**

1. Add pytest and frontend testing dependencies.
2. Add one intentionally failing authorization test for jobs.
3. Protect job routes and make the test pass.
4. Add a frontend route/navigation smoke test.
5. Initialize Alembic without deleting existing data.
6. Stop calling `Base.metadata.create_all()` at import time after the migration baseline is verified.

## Task 3: Build the candidate profile foundation

**Files:**

- Create: `backend/models/candidate_profile_model.py`
- Create: `backend/models/evidence_model.py`
- Create: `backend/services/candidate_profile_service.py`
- Create: `backend/routers/profile_router.py`
- Modify: `backend/models/resume_model.py`
- Modify: `backend/models/schemas.py`
- Modify: `backend/main.py`
- Create: `backend/tests/test_candidate_profile_service.py`
- Create: `frontend/src/features/profile/api.js`
- Create: `frontend/src/features/profile/ProfilePage.jsx`
- Create: `frontend/src/features/profile/EvidenceList.jsx`
- Modify: `frontend/src/App.jsx`

**Steps:**

1. Write service tests for profile ownership, evidence provenance, and resume-to-profile conversion.
2. Add versioned candidate profile and evidence models.
3. Convert existing resume data into editable evidence without deleting the raw source.
4. Add authenticated profile read/update endpoints.
5. Build a real Profile page with loading, empty, error, and populated states.
6. Make target roles and job preferences editable.

## Task 4: Replace the navigation and product shell

**Files:**

- Replace: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/layout/Layout.jsx`
- Create: `frontend/src/components/layout/AppSidebar.jsx`
- Create: `frontend/src/components/layout/MobileNavigation.jsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/pages/Home.jsx`
- Create: `frontend/src/app/navigation.js`
- Create: `frontend/src/app/navigation.test.js`

**Steps:**

1. Write navigation tests for the five approved product destinations.
2. Replace the top navigation with the responsive left rail.
3. Remove Add Job, Analyze JD, CareerPilot, keys, and interview destinations.
4. Redesign Today using real empty states and persisted counts only.
5. Add route-level lazy loading to reduce the initial bundle.

## Task 5: Implement provider-neutral job discovery

**Files:**

- Create: `backend/services/job_discovery/types.py`
- Create: `backend/services/job_discovery/query_builder.py`
- Create: `backend/services/job_discovery/normalizer.py`
- Create: `backend/services/job_discovery/verifier.py`
- Create: `backend/services/job_discovery/deduplicator.py`
- Create: `backend/services/job_discovery/filters.py`
- Create: `backend/services/job_discovery/orchestrator.py`
- Refactor: `backend/agents/serpapi_job_search_agent.py`
- Refactor: `backend/agents/tavily_agent.py`
- Replace: `backend/agents/query_manager_agent.py`
- Replace: `backend/agents/graph.py`
- Create: `backend/tests/job_discovery/`

**Steps:**

1. Add fixtures for real jobs, duplicate jobs, articles, stale roles, missing-company results, and senior-only roles.
2. Write failing tests for query preservation, normalization, deduplication, and fresher filters.
3. Implement provider adapters that return candidate records without writing to the canonical jobs table.
4. Run SerpAPI and Tavily concurrently with independent timeout/error handling.
5. Restrict Tavily queries and validate that a result is an actual job page.
6. Publish only verified or explicitly uncertain normalized jobs.
7. Persist source and freshness metadata.

## Task 6: Build explainable matching and the Jobs workspace

**Files:**

- Create: `backend/models/match_model.py`
- Create: `backend/services/requirement_extractor.py`
- Create: `backend/services/matching_service.py`
- Create: `backend/routers/discovery_router.py`
- Create: `backend/tests/test_matching_service.py`
- Replace: `frontend/src/pages/SearchJobs.jsx`
- Create: `frontend/src/features/jobs/JobSearchForm.jsx`
- Create: `frontend/src/features/jobs/JobList.jsx`
- Create: `frontend/src/features/jobs/JobDetail.jsx`
- Create: `frontend/src/features/jobs/VerificationBadge.jsx`
- Create: `frontend/src/features/jobs/RequirementCoverage.jsx`

**Steps:**

1. Write failing tests for must-have gates and evidence-linked explanations.
2. Separate deterministic eligibility from AI explanation.
3. Persist requirement-to-evidence mappings.
4. Build a list/detail jobs workspace with search controls and partial-provider warnings.
5. Add Save, Dismiss, Apply externally, and Tailor Resume actions.

## Task 7: Deliver the simplest complete Resume Studio slice

**Files:**

- Create: `backend/models/resume_version_model.py`
- Create: `backend/services/resume_tailoring/requirement_map.py`
- Create: `backend/services/resume_tailoring/suggestion_service.py`
- Create: `backend/services/resume_tailoring/truth_guard.py`
- Create: `backend/services/resume_tailoring/version_service.py`
- Create: `backend/routers/resume_studio_router.py`
- Create: `backend/tests/resume_tailoring/`
- Create: `frontend/src/features/resume-studio/ResumeStudioPage.jsx`
- Create: `frontend/src/features/resume-studio/RequirementsPanel.jsx`
- Create: `frontend/src/features/resume-studio/ResumeCanvas.jsx`
- Create: `frontend/src/features/resume-studio/SuggestionsPanel.jsx`
- Create: `frontend/src/features/resume-studio/ChangeDiff.jsx`

**Steps:**

1. Write failing tests that reject unsupported technologies, metrics, and project claims.
2. Support one complete path: choose resume, paste JD, map evidence, approve changes, export.
3. Store every suggestion with source evidence and status.
4. Add prompt-driven edits constrained by the truth guard.
5. Add version history and rollback.
6. Preserve DOCX/native templates and label arbitrary PDF reconstruction as best effort.

## Task 8: Add GitHub evidence retrieval

**Files:**

- Create: `backend/models/github_connection_model.py`
- Create: `backend/services/github/evidence_retriever.py`
- Create: `backend/services/github/project_ranker.py`
- Create: `backend/routers/github_router.py`
- Create: `backend/tests/github/`
- Create: `frontend/src/features/integrations/GitHubConnection.jsx`
- Create: `frontend/src/features/resume-studio/GitHubSuggestionCard.jsx`

**Steps:**

1. Add a read-only GitHub App/MCP connection with selected-repository grants.
2. Store credentials server-side and encrypted; never return them to the browser.
3. Retrieve repository tree, README, manifests, relevant files, commits, and contribution metadata.
4. Rank existing projects against the JD.
5. Distinguish existing project suggestions from future project briefs.
6. Add disconnect and cached-evidence deletion flows.

## Task 9: Rebuild applications as an explicit workflow

**Files:**

- Replace: `backend/models/application_model.py`
- Replace: `backend/services/application_saver.py`
- Delete: `backend/agents/application_saver_agent.py`
- Modify: `backend/routers/application_router.py`
- Create: `backend/tests/test_application_state_machine.py`
- Replace: `frontend/src/pages/Applications.jsx`
- Create: `frontend/src/features/applications/ApplicationDetail.jsx`
- Create: `frontend/src/features/applications/ApplicationTimeline.jsx`

**Steps:**

1. Write failing transition tests for the approved stages.
2. Require explicit student confirmation to create or advance an application.
3. Store the submitted resume version and other artifacts.
4. Add next actions, reminders, notes, deadlines, and status provenance.
5. Build list/detail and mobile views.

## Task 10: Add the evidence-based growth loop

**Files:**

- Replace: `backend/agents/roadmap_agent.py`
- Replace: `backend/routers/roadmap_router.py`
- Create: `backend/services/growth_service.py`
- Create: `backend/tests/test_growth_service.py`
- Create: `frontend/src/features/growth/GrowthPage.jsx`

**Steps:**

1. Aggregate recurring requirements only from relevant jobs.
2. Limit the plan to three priorities and one next action.
3. Tie completion to new evidence rather than checkbox state.
4. Add project briefs only when existing evidence cannot cover the gap.

## Task 11: Verification and release gate

**Commands:**

- `npm run lint`
- `npm run build`
- `npm run test -- --run`
- `python -m pytest`
- `python -m compileall backend`

**Release checks:**

1. No interview route, page, model, or agent remains.
2. No visible mock activity, score, statistic, or integration state remains.
3. All external jobs show source, freshness, and verification state.
4. All match and resume claims show evidence or uncertainty.
5. Every user-owned endpoint is authorization-scoped.
6. GitHub is read-only, repository-scoped, revocable, and server-managed.
7. The upload-to-verified-job and job-to-tailored-resume end-to-end tests pass.
