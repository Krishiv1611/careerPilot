# CareerPilot Premium SaaS Studio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the entire CareerPilot frontend into an elite, studio-grade premium SaaS product with zero mockness, authentic live interactive sandboxes, Framer Motion physics-based interactions, and a luxury Cyber Obsidian aesthetic across all modules.

**Architecture:** 
1. **Design System & Motion Engine**: Integrate `framer-motion` alongside Tailwind CSS v4, defining Cyber Obsidian tokens (`#080B0F` canvas, `#0F141C` deep panels, `#171F2C` elevated cards, `#1F2937` borders) with luminescent emerald (`#10B981`), electric cyan (`#06B6D4`), caution amber (`#F59E0B`), and coral crimson (`#EF4444`).
2. **Glass Obsidian Studio Dock Shell**: Re-architect `AppSidebar.jsx`, `Navbar.jsx`, and `Layout.jsx` with frosted glass (`backdrop-blur-md bg-slate-950/80`), `layoutId="active-nav-pill"` fluid active indicator, live telemetry pills, and spring route transitions.
3. **Zero-Mock Interactive Landing Page**: Replace static marketing cards with an interactive live Hero Studio Console allowing visitors to test all 4 Hero engines (6-Sec X-Ray heatmap, Defense Matrix with live code snippets, Job Reality 0-100 gauge, and Outreach note generator) in real time before signing up.
4. **Studio-Grade Modules**: Elevate every application module (`SearchJobs.jsx`, `ResumeStudio.jsx`, `Applications.jsx`, `Growth.jsx`, `Home.jsx`, `UploadResume.jsx`, `Settings.jsx`, `Login.jsx`, `Signup.jsx`) into dark studio control decks with spring physics, `AnimatePresence` drawers/modals, and real-time interactive diagnostics.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion v12, Vite, Lucide React, Axios.

**Spec:** Aligned via interactive design interview (/grill-me): Cyber Obsidian Studio aesthetic, zero-mock live Hero sandbox, Glass Obsidian Studio Dock, and Studio-Grade Dynamic Motion.

## Global Constraints
- Preserve backward-compatibility variables in `frontend/src/index.css` (`#36454f`, `#708090`, `#d3d3d3`, `#f4f5f5`, `#ffffff`) to keep `src/app/theme.test.js` passing.
- Do NOT use prohibited legacy colors: `['#17324d', '#245fce', '#1e51b3', '#10263a', '#102a43', '#f8f8f4', '#f3f1ea']`.
- Do NOT include mojibake characters (`\u00c2`, `\u00c3`, `\u00e2`).
- Do NOT claim unverified provider candidates are verified in marketing copy (`verified roles`, `verified page`, `verified resume skills`).
- Strictly adhere to `prefers-reduced-motion` for accessibility.
- All tests must pass: `npm --prefix frontend test -- --watchAll=false` and `python tests/run_e2e.py`.
- Zero ESLint errors or warnings: `npm --prefix frontend run lint`.
- Clean Vite build: `npm --prefix frontend run build`.

---

### Task 1: Design System Foundation, Studio Tokens & Motion Primitives

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/components/studio/StudioPrimitives.jsx`
- Test: `frontend/src/app/theme.test.js`

**Interfaces:**
- Produces:
  - `framer-motion` installed in `frontend/package.json`
  - CSS tokens in `frontend/src/index.css`: `--studio-canvas`, `--studio-panel`, `--studio-panel-elevated`, `--studio-border`, `--studio-emerald`, `--studio-cyan`, `--studio-amber`, `--studio-crimson`
  - Reusable motion components: `StudioCard`, `StudioBadge`, `StudioButton`, `StudioPillTab`, `StudioMotionDrawer` in `StudioPrimitives.jsx`

- [ ] **Step 1: Install `framer-motion` in `frontend`**

Run: `npm --prefix frontend install framer-motion`
Verify: `framer-motion` is in `frontend/package.json` dependencies.

- [ ] **Step 2: Add Cyber Obsidian Studio tokens & glassmorphism utilities to `frontend/src/index.css`**

Add root variables and studio utility classes while keeping the existing `--career-*` variables intact to satisfy `theme.test.js`:

```css
:root {
  /* Existing legacy variables for test compatibility */
  --career-charcoal: #36454f;
  --career-slate: #708090;
  --career-line: #d3d3d3;
  --career-canvas: #f4f5f5;
  --career-white: #ffffff;

  /* Cyber Obsidian Studio Tokens */
  --studio-canvas: #080B0F;
  --studio-panel: #0F141C;
  --studio-panel-elevated: #171F2C;
  --studio-border: #1F2937;
  --studio-border-glow: rgba(56, 189, 248, 0.2);
  --studio-emerald: #10B981;
  --studio-cyan: #06B6D4;
  --studio-amber: #F59E0B;
  --studio-crimson: #EF4444;
}

/* Studio Glass & Surface Utilities */
.studio-canvas {
  background-color: #080B0F;
  color: #F8FAFC;
}

.studio-panel {
  background-color: #0F141C;
  border: 1px solid #1F2937;
}

.studio-panel-elevated {
  background-color: #171F2C;
  border: 1px solid #283548;
}

.studio-glass {
  background: rgba(15, 20, 28, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.studio-glow-emerald {
  box-shadow: 0 0 25px -5px rgba(16, 185, 129, 0.25);
}

.studio-glow-cyan {
  box-shadow: 0 0 25px -5px rgba(6, 182, 212, 0.25);
}
```

- [ ] **Step 3: Create `frontend/src/components/studio/StudioPrimitives.jsx`**

Implement reusable spring motion components with reduced-motion support:
- `StudioCard`: Motion wrapped card with hover border illumination and subtle y-lift.
- `StudioBadge`: Status badge with pulsing live indicator dot.
- `StudioButton`: Primary, secondary, and glass button with spring tap feedback (`whileTap={{ scale: 0.98 }}`).
- `StudioPillTab`: Tab container with animated `layoutId="active-tab-indicator"` indicator.

- [ ] **Step 4: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 5: Commit Task 1**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/index.css frontend/src/components/studio/StudioPrimitives.jsx
git commit -m "feat(studio): add framer-motion, cyber obsidian tokens and studio motion primitives"
```

---

### Task 2: Glass Obsidian Studio Dock Shell & Animated Route Transitions

**Files:**
- Modify: `frontend/src/components/layout/AppSidebar.jsx`
- Modify: `frontend/src/components/layout/Navbar.jsx`
- Modify: `frontend/src/components/layout/Layout.jsx`
- Modify: `frontend/src/components/layout/MobileNavigation.jsx`
- Modify: `frontend/src/App.jsx`
- Test: `frontend/src/app/navigation.test.js`

**Interfaces:**
- Consumes: `primaryNavigation` from `frontend/src/app/navigation.js`
- Produces:
  - Frosted obsidian sidebar with `motion.div` `layoutId="studio-active-nav"`
  - Live candidate telemetry pill (active status, proof count)
  - Animated page route transitions with `AnimatePresence` in `App.jsx` and `Layout.jsx`

- [ ] **Step 1: Update `AppSidebar.jsx` into Glass Obsidian Studio Dock**

Transform sidebar into:
- Deep obsidian backdrop (`bg-[#0B0F15]/95 backdrop-blur-md border-r border-[#1E293B]`).
- Studio header with glowing badge ("STUDIO OS") and status indicator.
- Navigation items wrapped in `motion.div` with shared layout indicator:
  ```jsx
  {isActive && (
    <motion.div
      layoutId="studio-sidebar-active"
      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/15 to-emerald-500/10 border border-cyan-500/30"
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
    />
  )}
  ```
- Workspace live status card with glowing green pulse indicating active telemetry.

- [ ] **Step 2: Update `Navbar.jsx` and `MobileNavigation.jsx`**

Update top navigation bar for mobile and desktop breadcrumbs with studio glass aesthetic and smooth animated hamburger/sheet menus.

- [ ] **Step 3: Update `Layout.jsx` and `App.jsx` for Page Transitions**

Wrap page outlet/routes in `AnimatePresence mode="wait"` with smooth subtle fade/slide spring transitions:
```jsx
<motion.main
  key={location.pathname}
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
  className="min-h-screen bg-[#080B0F] text-slate-100"
>
```

- [ ] **Step 4: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 5: Commit Task 2**

```bash
git add frontend/src/components/layout/ frontend/src/App.jsx
git commit -m "feat(studio): implement glass obsidian studio dock and fluid route transitions"
```

---

### Task 3: Flagship Public Landing Page with Zero-Mock Interactive Studio Hero Sandbox

**Files:**
- Modify: `frontend/src/pages/LandingPage.jsx`
- Test: `frontend/src/app/theme.test.js`

**Interfaces:**
- Produces:
  - High-impact dark studio hero with headline, live telemetry badges, and interactive studio sandbox.
  - Zero-mock interactive hero console with 4 live interactive engine switchers:
    1. **6-Sec Recruiter X-Ray**: Interactive eye-tracking F-pattern heatmap preview with 1-click fluff auto-remediator demo.
    2. **Resume Defense Matrix**: Interactive claim interrogation with real syntax code snippet (PostgreSQL `EXPLAIN ANALYZE` / async pool) and model STAR answer.
    3. **Job Reality Auditor**: Interactive 0-100 role health meter with ghost-job & burnout flag toggles.
    4. **Multi-Channel Outreach**: Interactive tab selector between LinkedIn (<300), Alumni (<200), and Cold Email pitch with live character counters.
  - Fluid scroll reveals with `whileInView={{ opacity: 1, y: 0 }}` and spring physics.
  - Strict compliance with `theme.test.js` marketing copy constraints (no "verified roles", "verified page", "verified resume skills").

- [ ] **Step 1: Design and implement the Live Hero Studio Sandbox component**

Build an interactive component `LiveHeroStudioSandbox` embedded in `LandingPage.jsx` that gives visitors instant, authentic zero-mock interaction with all 4 hero features.

- [ ] **Step 2: Redesign the Landing Page layout and typography**

- Deep obsidian canvas (`#080B0F`), glowing atmospheric mesh gradients (`cyan-500/10` and `emerald-500/10`).
- Studio feature breakdown sections highlighting:
  - *Proof over Promises*: Real GitHub repo verification.
  - *Truth over Fluff*: Recruiter F-pattern eye tracking.
  - *Defense over Guesswork*: Code snippets & vulnerability ratings.
  - *Reality over Postings*: 0-100 role health & ghost job radar.
- Interactive CTA bar with studio border illumination.

- [ ] **Step 3: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 4: Commit Task 3**

```bash
git add frontend/src/pages/LandingPage.jsx
git commit -m "feat(landing): create zero-mock interactive studio hero console and dark obsidian showcase"
```

---

### Task 4: Studio Authentication Experience (`Login.jsx`, `Signup.jsx`)

**Files:**
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/pages/Signup.jsx`
- Test: `frontend/src/app/theme.test.js`

**Interfaces:**
- Produces:
  - Studio glassmorphism auth cards with subtle cyan/emerald ambient glow.
  - Micro-interactions on form inputs (focus ring animation, clear error shake animation with `motion.div`).
  - Loading button states with animated spinner and spring press states.

- [ ] **Step 1: Redesign `Login.jsx` and `Signup.jsx`**

Convert forms to dark studio aesthetic:
- Deep obsidian backdrop with subtle grid pattern.
- Frosted glass form panel (`bg-[#0F141C]/90 border border-slate-800`).
- Sleek dark inputs with luminous focus border (`focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50`).
- Motion button with `whileHover={{ scale: 1.01 }}` and `whileTap={{ scale: 0.98 }}`.
- Animated error banner using `AnimatePresence`.

- [ ] **Step 2: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 3: Commit Task 4**

```bash
git add frontend/src/pages/Login.jsx frontend/src/pages/Signup.jsx
git commit -m "feat(auth): redesign login and signup into sleek studio glass interfaces"
```

---

### Task 5: Studio Command Center Dashboard (`Home.jsx`)

**Files:**
- Modify: `frontend/src/pages/Home.jsx`
- Test: `frontend/src/app/theme.test.js`

**Interfaces:**
- Consumes: `getToday` API from `frontend/src/services/api.js`
- Produces:
  - Studio telemetry header with live date indicator and animated refresh trigger.
  - Glowing next-move mission console card with dynamic status indicators.
  - Live workspace metric cards with animated countup / entrance stagger.
  - Quick-launch dock directly into the 4 Hero tools (Reality Auditor, Recruiter X-Ray, Defense Matrix, Autopsy Drawer).

- [ ] **Step 1: Elevate `Home.jsx` into Studio Command Center**

Implement:
- Staggered container variants (`staggerChildren: 0.06`).
- Telemetry bar with pulsing live connection dot.
- Elevated Mission Card with gradient border and spring action CTA.
- 4 Quick-Launch Hero Studio cards with distinct glowing accents (Cyan for Search, Emerald for X-Ray, Purple for Defense, Amber for Autopsy).

- [ ] **Step 2: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 3: Commit Task 5**

```bash
git add frontend/src/pages/Home.jsx
git commit -m "feat(dashboard): transform home into studio command center with quick-launch hero dock"
```

---

### Task 6: Hero 3 Studio Upgrade: Job Reality & Red Flag Auditor (`SearchJobs.jsx`)

**Files:**
- Modify: `frontend/src/pages/SearchJobs.jsx`
- Test: `frontend/src/app/job-workspace.test.js`

**Interfaces:**
- Consumes: `audit_job_reality` data from discovery stream, `filterJobsByHealth` from `job-workspace.js`
- Produces:
  - Dark studio search bar with luminescent query focus.
  - Animated health filter tabs (`layoutId="job-health-filter-pill"`): `All`, `Healthy Roles ≥ 70`, `Cautions Only`.
  - Neon 0-100 Role Health circular / linear gauge with animated meter fill.
  - Ghost-job and burnout red-flag radar badges with danger glow.
  - Slide-out Job Details Inspector drawer wrapped in `AnimatePresence`.

- [ ] **Step 1: Redesign `SearchJobs.jsx` with Studio Dark Palette & Motion**

- Convert cards to `bg-[#0F141C] border border-[#1F2937] hover:border-cyan-500/40`.
- Animate role health score badge with color-coded luminescence (emerald $\ge 70$, amber $50-69$, red $< 50$).
- Wrap job details drawer in `AnimatePresence` with smooth spring slide-in from right.

- [ ] **Step 2: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 3: Commit Task 6**

```bash
git add frontend/src/pages/SearchJobs.jsx
git commit -m "feat(jobs): upgrade search jobs into studio reality auditor with neon gauges and motion drawer"
```

---

### Task 7: Hero 1 Studio Upgrade: Recruiter's 6-Second X-Ray & Studio Tailoring (`ResumeStudio.jsx`)

**Files:**
- Modify: `frontend/src/pages/ResumeStudio.jsx`
- Test: `frontend/src/app/resume-proposals.test.js`

**Interfaces:**
- Consumes: `analyze_recruiter_xray` payload from `/resume-studio/recruiter-xray`
- Produces:
  - Dark studio resume editor with split-screen inspection deck.
  - Interactive Nielsen Norman F-pattern eye-tracking heatmap with animated scan lines.
  - 3-Reviewer Persona verdict tabs with `layoutId="persona-tab-pill"`:
    `[ ⏱️ Screener (6s) ]`, `[ 💼 Hiring Manager ]`, `[ 💻 Tech Lead ]`.
  - 1-Click Fluff Auto-Remediator button with spring physics, glowing emerald feedback, and live diff preview.

- [ ] **Step 1: Redesign `ResumeStudio.jsx` into Studio Inspection Deck**

- Implement dark studio code/text editor with line numbers and diff styling.
- Render animated F-Pattern eye-tracking heatmap overlay with glowing intensity gradient (`from-red-500/20 via-amber-500/10 to-transparent`).
- Animated 1-click fluff remediation trigger with instant visual pulse.

- [ ] **Step 2: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 3: Commit Task 7**

```bash
git add frontend/src/pages/ResumeStudio.jsx
git commit -m "feat(xray): elevate resume studio with interactive f-pattern heatmap and dark inspection deck"
```

---

### Task 8: Hero 2 & Hero 4 Studio Upgrade: Resume Defense Interrogator, Autopsy Drawer & Multi-Channel Outreach Pack (`Applications.jsx`)

**Files:**
- Modify: `frontend/src/pages/Applications.jsx`
- Test: `frontend/src/app/application-pipeline.test.js`

**Interfaces:**
- Consumes: `generate_resume_defense_matrix`, `run_application_autopsy`, `generate_tailored_cover_letter`
- Produces:
  - Studio Kanban board with smooth card drag/reorder and stage columns.
  - Resume Defense Interrogation Modal with:
    - Claim Vulnerability Badges (`High Risk`, `Medium Risk`, `Rock Solid`) with glowing status pills.
    - Syntax-highlighted dark code blocks for code defenses with 1-click copy feedback.
    - Interactive Practice Self-Scoring buttons (`[ 😟 Need Practice ]`, `[ 😐 Prepared ]`, `[ 🛡️ Ironclad ]`).
  - Application Autopsy & Gap Recovery Drawer:
    - Pre-Mortem vs Post-Mortem toggle with `layoutId` pill.
    - In-drawer live GitHub repository verification console with terminal-style scan feedback.
    - 48-Hour Growth Bridge button linking to `/growth?skill=...`.
  - Multi-Channel Outreach Pack Modal:
    - Tab switcher for LinkedIn (<300), Alumni (<200), Cold Email.
    - Dynamic countdown badges and 1-click copy toasts.

- [ ] **Step 1: Redesign `Applications.jsx` into Studio Mission Deck**

- Transform Kanban columns and cards with dark slate glass surfaces and smooth spring hover.
- Upgrade Defense Modal with dark syntax highlighting and vulnerability meters.
- Upgrade Autopsy Drawer with terminal styling for live GitHub verification.
- Upgrade Outreach Modal with studio tab switcher and character counters.

- [ ] **Step 2: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 3: Commit Task 8**

```bash
git add frontend/src/pages/Applications.jsx
git commit -m "feat(applications): studio defense interrogator, autopsy terminal drawer, and outreach modal"
```

---

### Task 9: Growth Blueprint Workbench, Candidate Evidence Profile & Settings (`Growth.jsx`, `UploadResume.jsx`, `Settings.jsx`)

**Files:**
- Modify: `frontend/src/pages/Growth.jsx`
- Modify: `frontend/src/pages/UploadResume.jsx`
- Modify: `frontend/src/pages/Settings.jsx`
- Test: `frontend/src/app/github-evidence.test.js`

**Interfaces:**
- Produces:
  - `Growth.jsx`: Studio 48-hour blueprint workbench with auto-scrolling skill anchors from URL params (`?skill=...`), animated GitHub repo inspector, and step verification meters.
  - `UploadResume.jsx`: Studio file dropzone with animated dashed borders, parsing telemetry radar, and verified skill cloud.
  - `Settings.jsx`: Studio preferences deck with theme indicators, data management, and account telemetry.

- [ ] **Step 1: Redesign `Growth.jsx`**

Convert into an engineering blueprint console with dark code cards, repository verification terminal, and progress meters.

- [ ] **Step 2: Redesign `UploadResume.jsx` and `Settings.jsx`**

Convert resume upload into an interactive scanner dropzone with parsing animation. Convert settings into a studio preferences panel.

- [ ] **Step 3: Run tests and verify**

Run: `npm --prefix frontend test -- --watchAll=false`
Run: `npm --prefix frontend run lint`

- [ ] **Step 4: Commit Task 9**

```bash
git add frontend/src/pages/Growth.jsx frontend/src/pages/UploadResume.jsx frontend/src/pages/Settings.jsx
git commit -m "feat(growth): redesign growth workbench, resume uploader, and settings into studio aesthetic"
```

---

### Task 10: Full Regression Suite, ESLint, Tests & Production Build Verification

**Files:**
- Verify: Full backend unit tests
- Verify: Full 230/230 E2E contract test suite
- Verify: Frontend unit tests
- Verify: Frontend ESLint
- Verify: Vite production build
- Verify: Push to `origin main`

- [ ] **Step 1: Run Backend Unit Tests**

Run: `.venv\Scripts\python.exe -m unittest discover -s backend/tests -p "test_*.py"`
Expected: 184/184 PASS

- [ ] **Step 2: Run E2E Contract Tests**

Run: `.venv\Scripts\python.exe tests/run_e2e.py`
Expected: 230/230 PASS

- [ ] **Step 3: Run Frontend Unit Tests**

Run: `npm --prefix frontend test -- --watchAll=false`
Expected: 29/29 PASS

- [ ] **Step 4: Run Frontend ESLint**

Run: `npm --prefix frontend run lint`
Expected: 0 errors, 0 warnings

- [ ] **Step 5: Run Production Build**

Run: `npm --prefix frontend run build`
Expected: Clean build with all chunks emitted

- [ ] **Step 6: Push to GitHub `origin main`**

```bash
git push origin main
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-31-careerpilot-premium-saas-studio-redesign.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, with fast iteration using `superpowers:subagent-driven-development`.
2. **Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach would you like to take?
