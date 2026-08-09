# CareerPilot Student Application OS — Product and Architecture Design

**Date:** 2026-08-09  
**Status:** Approved  
**Audience:** Product, design, frontend, backend, and QA

## Product decision

CareerPilot will become a student-first application operating system for students and recent graduates applying in India.

The core promise is:

> Upload your resume, discover verified fresher jobs, understand why they fit, tailor an evidence-backed resume, apply, and track the next action in one connected workflow.

The first measurable outcome is the percentage of new students who reach one verified, application-ready job within ten minutes.

## Target user and jobs-to-be-done

The beachhead user is a student or recent graduate in India who has projects, coursework, internships, or open-source work but limited formal experience.

When they are trying to apply, they need CareerPilot to:

1. find genuine roles for which they are actually eligible;
2. explain why a role fits or does not fit;
3. surface relevant evidence from their resume and GitHub;
4. tailor an application without inventing facts;
5. remember what was submitted and what happens next;
6. turn repeated skill gaps into focused improvement actions.

## Product principles

1. **Evidence before scores.** Every match and resume claim must show its source.
2. **A small trusted feed beats a large noisy feed.** Discovery quality is more important than result count.
3. **Student approval is mandatory.** Analysis never silently becomes an application, and suggestions never silently become resume content.
4. **One profile powers the product.** Search, matching, tailoring, tracking, and growth share the same candidate evidence.
5. **No mock product behavior.** Visible counters, jobs, actions, and progress must come from persisted data.
6. **Agents coordinate uncertainty; services perform deterministic work.** Do not create an agent for every function.
7. **Truthful limitations.** Arbitrary PDF templates receive best-effort reconstruction, while DOCX and CareerPilot templates can provide high-fidelity preservation.

## Integrated product loop

```text
Resume + preferences + selected GitHub repositories
                         |
                         v
                Candidate evidence profile
                         |
                         v
Verified discovery -> Explainable match -> Resume Studio -> Application
       ^                                                        |
       |                                                        v
       +------------- Growth evidence <- Tracker and outcomes --+
```

## Information architecture

Authenticated navigation contains five primary destinations:

1. **Today** — real pending work and new verified matches.
2. **Find Jobs** — discovery, filtering, match evidence, and job actions.
3. **Resume & Profile** — evidence profile, base resume, and Resume Studio.
4. **Applications** — stages, artifacts, timeline, reminders, and next actions.
5. **Growth** — recurring gaps and evidence-producing improvement actions.

Settings and account actions live at the bottom of the left sidebar. Mobile uses a reduced bottom navigation.

Student navigation will not expose Add Job, Analyze JD, CareerPilot, provider API keys, or Interview Prep as separate product areas.

## Core product surfaces

### Today

Today answers “What should I do next?” using only real records:

- newly verified matching jobs;
- application deadlines and follow-ups;
- unanswered resume evidence questions;
- weekly application progress;
- one recommended next action.

### Find Jobs

Students configure target roles, employment type, experience range, graduation year, location, remote preference, compensation preference, excluded companies, and preferred skills.

Discovery flow:

```text
preserve explicit intent
  -> build provider queries
  -> search SerpAPI and restricted Tavily concurrently
  -> normalize
  -> verify
  -> deduplicate
  -> apply hard eligibility filters
  -> calculate evidence match
  -> explain
  -> publish to the student feed
```

Tavily is restricted to recognized job sources and company career pages. Articles, course pages, generic search results, stale roles, duplicates, and senior-only roles are rejected before ranking.

Each result includes source, canonical URL, fetch time, verification state, freshness, eligibility, must-have requirements, supporting candidate evidence, missing requirements, and recommendation reason.

### Evidence-Aware Resume Studio

Resume Studio can be opened from a selected CareerPilot job or with a manually pasted JD.

Desktop layout:

| Requirement panel | Resume canvas | Evidence and editing panel |
|---|---|---|
| JD requirements and coverage | Template-preserving live preview | GitHub suggestions, evidence, diff, and prompt input |

Workflow:

1. upload or choose the current resume;
2. choose a discovered job or paste a JD;
3. extract must-have and preferred requirements;
4. map current resume evidence;
5. optionally retrieve evidence from selected GitHub repositories;
6. propose existing projects missing from the resume;
7. recommend new projects only as future work when no evidence exists;
8. ask the student for missing metrics or ownership details;
9. show every proposed change as a diff;
10. let the student accept, reject, edit, or prompt further;
11. save a version linked to the job;
12. export DOCX and PDF with the approved template.

Generated content must never add an unsupported metric, technology, responsibility, employer, or outcome.

### Applications

An application is created only after the student explicitly saves or confirms it.

Stages are Saved, Preparing, Applied, Assessment, Interview, Offer, Rejected, and Withdrawn.

Each application stores the job snapshot, match result, submitted resume version, cover note, recruiter message, form answers, source URL, status source, deadline, follow-up date, notes, and event timeline.

### Growth

Growth aggregates requirements across roles the student actually wants. It recommends one evidence-producing action at a time, such as improving tests and deployment for an existing project, completing a focused project brief, or strengthening a specific resume claim.

Checking a box alone does not improve readiness; progress requires new evidence or student-confirmed external completion.

## Agent and service boundaries

### Job Discovery Orchestrator

The workflow agent coordinates provider calls, partial failure handling, ambiguous classification, and explanation. Deterministic services own query construction, provider adapters, URL checks, normalization, fingerprints, deduplication, freshness, hard filters, persistence, and scoring inputs.

### Resume Tailoring Copilot

The workflow agent coordinates requirement mapping, GitHub evidence, student questions, suggestions, prompt-driven edits, and approval loops. Deterministic services own document parsing, source spans, GitHub retrieval, truth checks, version storage, and rendering.

There are no separate application saver, cover-letter, ATS-score, fit-score, skill-extractor, or resume-improver agents. Those behaviors become services or operations within the two explicit workflows.

## Data model direction

### Candidate domain

- `candidate_profiles`
- `candidate_preferences`
- `evidence_items`
- `resume_documents`
- `resume_versions`
- `resume_templates`

### Job domain

- `job_searches`
- `job_candidates` for provider staging
- `jobs` for normalized canonical roles
- `job_snapshots`
- `job_requirements`
- `match_results`
- `match_evidence`

### Application domain

- `applications`
- `application_artifacts`
- `application_events`
- `reminders`

### Integration and task domain

- `github_connections`
- `github_repository_grants`
- `task_runs`
- `provider_attempts`

GitHub credentials remain server-side, encrypted, revocable, and restricted to selected repositories with read-only permissions.

## Frontend design direction

The UI uses a calm, editorial workspace rather than the current dark glass dashboard:

- warm off-white canvas;
- deep navy text and navigation;
- cobalt primary actions;
- emerald only for verified states;
- amber for incomplete or uncertain evidence;
- paper-like resume canvas;
- compact source and freshness labels;
- subtle state-change motion;
- accessible focus, keyboard, contrast, and reduced-motion behavior.

Desktop uses a left rail and list/detail workspaces. Mobile uses a compact header, bottom navigation, and full-screen detail drawers.

## Error and partial-failure behavior

- One failed search provider does not discard results from another provider.
- Unverifiable jobs are hidden by default and can be inspected under a clearly labeled state.
- Search and generation tasks expose real progress states rather than simulated bars.
- Resume suggestions survive refresh and can be retried idempotently.
- A GitHub disconnect revokes access and allows cached evidence deletion.
- Export failures retain the approved resume version and provide a retry path.
- External content is treated as untrusted input and cannot override system policy.

## Security and privacy baseline

- provider keys are never accepted from or stored in the browser;
- all user-owned records are authorization-scoped;
- uploads enforce type, size, and parsing limits;
- secrets and raw personal documents are excluded from logs;
- GitHub uses fine-grained, read-only repository grants;
- every external-source result stores provenance and retrieval time;
- every background task is idempotent and user-scoped.

## Testing strategy

1. Unit tests for normalization, fingerprints, hard filters, evidence rules, and state transitions.
2. Router/service integration tests for ownership, persistence, partial provider failure, and idempotency.
3. Frontend component tests for empty, loading, error, partial, and success states.
4. End-to-end tests for upload-to-job, job-to-tailored-resume, and resume-to-application workflows.
5. Visual checks for sidebar, responsive layouts, resume canvas, and export fidelity.
6. Prompt-injection and unsupported-claim regression fixtures.

## Success metrics

- activation: student reaches one verified, application-ready job within ten minutes;
- relevance: top results pass the student’s explicit eligibility filters;
- trust: broken, stale, and unsupported results remain below the launch threshold;
- tailoring: accepted suggestions are evidence-backed and no accepted bullet contains an invented claim;
- conversion: students move from verified job detail to a saved or applied state;
- retention: students return for application next actions and new matching jobs.

## Explicitly removed or deferred

Remove the uncommitted interview feature, simulated scores, fake activity, unsupported metrics, user-facing Add Job, generic internet search, automatic application saving, and browser-stored provider credentials.

Defer recruiter mode, live interview simulation, social-post generation, generic course catalogs, automated email/ATS ingestion, billing, and multiple resume templates until the core student workflow is trusted and used.

