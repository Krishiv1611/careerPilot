# CareerPilot Product Completion and Modern Minimalist Design

## Decision

Finish the approved student application workflow as a sequence of vertical product slices and restyle every frontend surface with the Theme Factory **Modern Minimalist** direction. CareerPilot remains a focused two-specialist LangGraph system; the work does not restore the previous agent swarm or the removed Interview Agent.

The product is for students and recent graduates applying in India. Its primary outcome is helping a student move from a truthful resume to one relevant, verifiable application with less uncertainty.

## Delivery order

1. Modern Minimalist design system and responsive product shell.
2. Complete Resume Studio approval loop and template-preserving export.
3. User-scoped, freshness-aware job discovery.
4. GitHub evidence approval and insertion workflow.
5. Today actions and persistent Growth evidence.
6. PostgreSQL, ownership, authentication, and release hardening.

Each slice must work with real persisted records, have an honest unavailable state for unconfigured providers, and be independently testable.

## Modern Minimalist design direction

### Subject

CareerPilot is a working desk for a student preparing applications, not an analytics dashboard. Screens prioritize evidence, decisions, and next actions.

### Color

- **Charcoal `#36454f`** — navigation, primary actions, selected states, headings.
- **Slate Gray `#708090`** — secondary text, metadata, inactive controls.
- **Light Gray `#d3d3d3`** — borders, dividers, progress tracks.
- **Workspace `#f4f5f5`** — application canvas derived from the theme's grays.
- **White `#ffffff`** — documents, forms, and independent work panels.
- Functional colors remain restricted to meaning: emerald for verified evidence, amber for uncertainty or gaps, and red for destructive actions and errors.

Blue is removed as the generic primary accent. Gradients, decorative blobs, glass effects, and unsupported dashboard decoration are not used.

### Type

Use `DejaVu Sans` when available, followed by `Segoe UI`, Arial, and the system sans-serif stack. Headings use bold weight and compact tracking. Metadata uses small uppercase labels only where the label communicates source, state, or sequence.

### Layout

- Desktop retains a fixed left rail and list/detail workspaces.
- Mobile retains a compact header and five-item bottom navigation.
- Panels use smaller radii, crisp one-pixel borders, restrained shadows, and more whitespace between tools.
- Avoid nested cards; internal groups use dividers or tinted sections.

### Signature

The signature element is an **application index**: numbered steps, evidence rows, and source labels use a consistent monochrome rail. The rail makes the student's sequence visible without adding a progress score.

### Interaction

Active navigation and selected records use a short horizontal charcoal slide/fill transition. All focus states are visible, and reduced-motion users receive no translation animation.

## Resume Studio completion

Resume Studio must support the full approved loop:

1. choose a resume and a saved job or paste a JD;
2. extract requirements and map current evidence;
3. generate evidence-backed proposed changes;
4. show a line-level diff with the supporting source for each change;
5. let the student accept, reject, edit, or prompt again;
6. create an immutable approved version;
7. export DOCX using the original DOCX structure and PDF as a clearly labeled reconstructed document.

Prompt edits may reorder, shorten, remove, or rewrite existing evidence. A prompt may not introduce a technology, number, employer, responsibility, project, or outcome absent from the resume or explicitly approved GitHub evidence. Unsupported prompts return a specific explanation and preserve the current draft.

Natural-language rewriting uses a server-managed provider only when configured. Deterministic editing remains available without a provider. Provider output is always checked by the truth guard before it becomes a proposal.

## Job discovery completion

Canonical jobs may remain shared, but a student's discovered, saved, and dismissed records are user-scoped. `/jobs/all` returns only jobs associated with the authenticated student.

Every published job includes provider source, canonical application URL, fetch time, verification state, and freshness. A heuristic match is labeled `candidate`; `verified` requires a resolvable job/application page. Expired or inaccessible jobs are hidden from the default feed. Provider failures never create replacement data.

## GitHub evidence completion

Repository access stays read-only and limited to the student's GitHub App installation. CareerPilot stores retrieved evidence with provenance. Before a repository becomes a resume claim, the student must confirm:

- their contribution;
- the relevant technology or requirement;
- the wording that may be used;
- optional measurable outcome supplied by the student.

Approval creates a new resume proposal; it never edits an existing version in place.

## Today and Growth completion

Today returns one prioritized action based on persisted deadlines, follow-ups, incomplete resume proposals, and verified job opportunities. It does not use generated streaks or sample counters.

Growth priorities are persisted. A priority completes only when linked to approved resume evidence, approved GitHub evidence, or an explicit external-completion record. Completing a priority recalculates the next three evidence opportunities.

## Data and security completion

- PostgreSQL remains the only runtime application database.
- Legacy SQLite and Chroma files are never loaded implicitly; they are documented for an explicit archive, migration, or deletion decision.
- Every resume reference on an application is ownership-checked.
- Password length is validated, login attempts are rate-limited, production cookies are secure, and state-changing cookie-authenticated requests have CSRF protection.
- Migrations run against an empty database and an existing schema without startup table creation.

## Testing and release criteria

- Unit tests cover truth checks, diffs, user-job state, freshness, evidence approval, action priority, and security validation.
- Router integration tests cover ownership and persistence.
- End-to-end tests cover signup → resume → search → match → tailor → application.
- Frontend tests cover selection, approval, error, empty, and mobile navigation states.
- Desktop and mobile screenshots are reviewed for overflow, contrast, focus, loading, empty, error, and success states.
- Lint, production build, Python compilation, migration tests, and the complete backend test suite pass before completion is claimed.

## Non-goals

Do not add interview simulation, recruiter mode, automatic job application, browser-stored provider keys, billing, generic courses, or additional autonomous agents.
