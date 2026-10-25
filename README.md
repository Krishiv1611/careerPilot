# CareerPilot

CareerPilot is a student-first application workspace for students and recent graduates applying for jobs in India. It connects focused job discovery, explainable resume matching, evidence-aware resume tailoring, GitHub project evidence, application tracking, and a focused growth plan.

## What students can do

- **Strict Job Discovery & Anti-Spam**: Search for fresher and entry-level roles across SerpAPI and Tavily (with dual-key fallback `TAVILY_API_KEY` / `TAVILY_SEARCH_API_KEY`). Automatic negative keyword filtering eliminates courses, bootcamps, placement fees, pay-after-placement ISAs, and laptop deposit scams.
- **Persistent Saved Jobs**: Save discovered jobs for later review in a persistent saved jobs workspace.
- **Deep Requirement Matching**: Multiline bullet requirement parsing separates hard blockers (`missing_must_haves`) from preferred gaps, with smart heuristics ignoring company founding history.
- **Truth-Guarded AI Tailoring**: Google Gemini AI and deterministic STAR bullet rewriting with strict truth-guarding that prevents hallucinated skills, tools, or quantitative metrics.
- **ATS-Compliant PDF Resume Engine**: Single-column Harvard/Stanford layout built with ReportLab Platypus, featuring clean typography, horizontal rule dividers, and indented bullets.
- **Platform Connectors Hub**:
  - **LeetCode Connector**: Public GraphQL integration fetching total/easy/medium/hard solved and global ranking with 1-click ATS bullet generation.
  - **GitHub Public Connector**: Public repository, star count, and language aggregator.
  - **LinkedIn Profile Import**: Extracts headline, education, and skills from exported profile text.
- **Recruiter Outreach Kit**: 1-click generation of LinkedIn connection request notes strictly under 300 characters (with live character counter), formal cold emails, and 3-5 day follow-up notes.
- **Interactive Applications Kanban Pipeline**: 6-stage Kanban board (`Saved`, `Preparing`, `Applied`, `Interview`, `Offer`, `Rejected`) with direct `Saved` $\to$ `Applied` transitions, reopening of withdrawn/rejected roles, and submitted resume download.
- **Focused Growth Plan & Today Engine**: Prioritized daily actions from real deadlines, follow-ups, and recurring skill gaps.

## Product workflow

```text
Today
  -> Find relevant provider job pages
  -> Check resume evidence
  -> Tailor and approve a resume version
  -> Apply externally and confirm tracking
  -> Follow next actions and recurring skill gaps
```

The application navigation contains five student destinations: **Today**, **Find Jobs**, **Resume & Profile**, **Applications**, and **Growth**.

## Multi-agent architecture

CareerPilot uses a deliberately small LangGraph workflow:

- The **Supervisor** routes each supported task and rejects unknown work.
- The **Job Discovery Agent** coordinates job providers, validation, fresher filtering, and deduplication.
- The **Resume & Evidence Agent** handles resume/JD analysis, truth-guarded prompt edits, and GitHub project evidence ranking.

Authentication, persistence, application state transitions, exports, and safety checks remain ordinary deterministic services. The project does not use an Interview Agent or the previous overlapping agent swarm.

## Technology

- React 19, Vite, Tailwind CSS, and React Router
- FastAPI, SQLAlchemy, PostgreSQL, and Alembic
- LangGraph for focused agent orchestration
- SerpAPI and Tavily for job discovery
- GitHub App installation tokens and the official GitHub MCP server
- HttpOnly cookie sessions with Argon2 password hashing

## Configuration

Copy `.env.example` to `.env` and replace the example values. Secrets stay on the backend and are never entered in the browser.

Required:

```env
DATABASE_URL=postgresql://careerpilot:careerpilot@localhost:5432/careerpilot
SECRET_KEY=replace-with-a-long-random-secret
```

For a production HTTPS deployment, also use `COOKIE_SECURE=true` and choose `COOKIE_SAMESITE` for the final frontend/API domain layout.

AI resume tailoring (optional Google Gemini key):

```env
GOOGLE_API_KEY=
```

Job discovery (dual-key Tavily fallback supported):

```env
SERPAPI_API_KEY=
TAVILY_API_KEY=
TAVILY_SEARCH_API_KEY=
```

GitHub evidence is optional. It requires a read-only GitHub App installation:

```env
GITHUB_APP_ID=
GITHUB_APP_SLUG=
GITHUB_APP_PRIVATE_KEY=
GITHUB_MCP_URL=https://api.githubcopilot.com/mcp/
```

## Local development

Prerequisites: Python 3.12 or 3.13, Node.js 20+, and PostgreSQL.

To start the complete local stack with a persistent PostgreSQL volume:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Change `SECRET_KEY` and `POSTGRES_PASSWORD` before using the stack beyond local development.

Backend, from the repository root:

```powershell
uv sync --locked
uv run alembic upgrade head
uv run uvicorn main:app --app-dir backend --reload
```

Commit `uv.lock` with dependency changes. `backend/requirements.txt` remains the
runtime input for the backend Docker image.

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

The frontend uses `http://127.0.0.1:8000` by default. Set `VITE_BACKEND_URL` before building when the API is hosted elsewhere.

## Verification

Run from the repository root:

```powershell
uv lock --check
uv run python -m unittest discover -s backend\tests -p "test_*.py" -v
uv run python -m unittest discover -s tests -p "test_*.py" -v
uv run python -m compileall -q backend
cd frontend
npm test
npm run lint
npm run build
```

## Current safety boundaries

- Provider credentials and session tokens are not stored in browser storage.
- GitHub access is installation-scoped, short-lived, repository-restricted, and revocable.
- A GitHub match cannot enter a resume until the student confirms their contribution.
- Resume edits are checked against evidence and remain a draft until each change is accepted or rejected.
- A match analysis does not silently create an application.
- Jobs are scoped to the authenticated student and marked as provider candidates unless live verification actually occurred.
- External provider failures are returned as partial-search warnings instead of fake results.

## ML advisory feature

The resume-category notebook remains research-quality because its reported accuracy is inflated by duplicate leakage. CareerPilot uses the checked-in artifacts only for optional career-track suggestions: the files are checksum-verified before loading, failures never block resume upload, and predictions do not restrict eligibility or job search. See [the analysis notes](backend/analysis/README.md).

See [the product design](docs/plans/2026-08-09-careerpilot-student-application-os-design.md) and [implementation plan](docs/plans/2026-08-09-careerpilot-student-application-os-implementation.md) for the approved scope and delivery sequence.
