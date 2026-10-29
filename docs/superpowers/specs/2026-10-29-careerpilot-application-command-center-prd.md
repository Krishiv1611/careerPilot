# Product Requirements Document (PRD): CareerPilot Application Command Center & Tailoring Studio

**Document Version:** 2.0.0  
**Status:** Approved for Implementation  
**Theme:** Core Web Product Deepening  
**Target Audience:** Students, New Grads, and Early-Career Engineers (0-3 years experience)

---

## 1. Executive Summary

CareerPilot is evolving from a fragmented job tracker and prototype resume viewer into an **All-In-One Application Command Center & Tailoring Studio**. Instead of requiring external browser extensions or disparate tools, CareerPilot enables candidates to paste any job link or description directly into their workspace, instantly run a deterministic 100-Point ATS diagnostic, generate a **Complete 4-in-1 Application Bundle** (ATS Harvard PDF + Tailored Cover Letter + Screening Answers Drawer + Recruiter Outreach), and practice with a tailored **Role Interview Prep Simulator** directly inside their Kanban pipeline.

---

## 2. Problem Statement

### 2.1 The Student & Early-Career Pain Point
- **Context Fragmentation**: Job seekers spend hours juggling between LinkedIn/Lever, ChatGPT for cover letters, Google Docs for resume tweaks, and external notes for interview prep.
- **Application Fatigue**: Applying to 10-20 jobs a day results in generic resumes that fail ATS filters, unanswered screening questions, and missed interview readiness.
- **Hallucination Risk**: Generic AI tools (like raw ChatGPT) hallucinate skills and experience that students cannot defend in technical interviews.

### 2.2 Product Mission
To give every student engineer a single, truthful, cohesive desktop web command center that takes them from **Job Discovery $\to$ 100-Pt ATS Diagnosis $\to$ Complete Application Bundle $\to$ Interview Prep**, grounded 100% in their real code, projects, and verified experience.

---

## 3. Target Users & Personas

- **Primary Persona: The University Fresher / CS Graduate**
  - Needs: Fast, high-conversion applications for entry-level roles; confidence that their resume passes ATS parsers without getting disqualified for missing keywords.
  - Frustrations: Confusing job descriptions with hidden senior experience barriers; writing custom cover letters and answers from scratch for each ATS.
- **Secondary Persona: Self-Taught / Bootcamp Career Switcher**
  - Needs: Evidence-grounded proof (GitHub repositories, LeetCode, technical blueprints) that substitute for traditional enterprise brand names.

---

## 4. Feature Specifications & Requirements

### 4.1 Feature 1: Universal Job Link Ingestor & Quick-Add Drawer
- **Goal**: Enable students to bring *any* job from the web into CareerPilot in seconds.
- **Capabilities**:
  - Accepts URLs from **Lever, Greenhouse, Workday, Ashby, LinkedIn**, and arbitrary company career portals.
  - Backend crawler (`job_scraper_service.py`) fetches and extracts:
    - Job Title
    - Company Name
    - Location & Employment Type
    - Raw Description and Requirements Bullets
  - Automatic fallback to an interactive Quick-Paste Drawer if the URL is protected by a login wall or bot guard.
  - Immediately runs the deterministic 100-Point ATS diagnostic upon ingestion.

### 4.2 Feature 2: Complete 4-in-1 Application Bundle
- **Goal**: Give the candidate everything required to submit a top-tier application in one unified workspace.
- **Four Integrated Deliverables**:
  1. **ATS-Compliant Harvard PDF Resume**:
     - Single-column ReportLab Platypus engine.
     - Automatically tailored STAR bullets highlighting job keywords without adding unearned claims.
     - Live 100-Point ATS Scorecard with pillar breakdown (Parseability, Keywords, Impact, Structure).
  2. **Truth-Guarded Tailored Cover Letter**:
     - 3-paragraph structured letter:
       - Para 1: Hook, role target, and company alignment.
       - Para 2: Deep dive into 2 verified student projects matching the job's must-haves.
       - Para 3: Professional call to action.
     - 1-click copy to clipboard and downloadable text file.
  3. **Intelligent Screening Answers Drawer**:
     - Generates concise 2-3 sentence answers for high-frequency ATS screening questions:
       - *"Why do you want to join our engineering team?"*
       - *"Describe a challenging technical problem you solved using [Primary Tech]."*
       - *"What are your work authorization and notice period expectations?"*
     - Grounded strictly in candidate profile data and verified GitHub evidence.
  4. **Recruiter Outreach Toolkit**:
     - LinkedIn Connection Request Note (strictly `<300` characters, counter verified).
     - Recruiter Cold Email / InMail template with candidate name and role context.

### 4.3 Feature 3: Role Interview Prep Simulator & STAR Answer Blueprint
- **Goal**: Bridge the gap between applying and passing interviews.
- **Capabilities**:
  - Located directly inside the application card in `Applications.jsx` (available for any application in `Preparing`, `Applied`, `Assessment`, or `Interview`).
  - **Technical Interview Questions**: Generates 5 realistic technical and architectural questions based on the job's tech stack (e.g. FastAPI concurrency, PostgreSQL indexing, Docker networking).
  - **Behavioral Questions**: Generates 3 STAR behavioral interview questions.
  - **Model STAR Answer Blueprint**: For every question, outputs a model answer blueprint referencing the student's *actual* project history and skills.
  - **Smart Questions for the Interviewer**: Generates 3 insightful questions about the team's engineering velocity, deployment cadence, and code review culture.

### 4.4 Feature 4: Dual-Surface Workspace Integration
- **Search & Discovery (`SearchJobs.jsx`)**:
  - "Paste Job Link / Add Custom Job" modal prominently featured above the feed.
  - Selected job pane includes a 1-click "Open Application Bundle" button.
- **Kanban Board (`Applications.jsx`)**:
  - Every application card features quick actions:
    - "Application Bundle" (view/download resume, cover letter, screening answers, outreach notes).
    - "Interview Prep & Defense" (opens the Resume Defense Stress-Tester).

### 4.5 HERO FEATURE 1: The Recruiter's 6-Second X-Ray (Resume Studio)
- **Problem**: Candidates write resumes from their own perspective, oblivious to how recruiters actually skim them in 6 seconds, leading to immediate rejection.
- **Capabilities**:
  - An interactive **"Recruiter X-Ray"** lens toggle inside `ResumeStudio.jsx`.
  - **Visual Scan Heatmap**: Highlights the 3 zones where recruiter attention concentrates (Target Role Header, Top 2 Bullets of Latest Work, Technical Stack Density).
  - **Fluff & Filler Word Detector**: Highlights empty adjectives (e.g., *"hardworking"*, *"passionate"*, *"team player"*, *"quick learner"*) in warning amber, suggesting quantified STAR metric replacements.
  - **Hiring Manager 6-Second Verdict**: Generates an authoritative simulated recruiter verdict (e.g., *"Strong Python match, but lacks production API throughput metrics; 70% probability of phone screen"*).

### 4.6 HERO FEATURE 2: The Resume Defense Stress-Tester (Applications Kanban)
- **Problem**: Job seekers who tailor resumes fear being grilled by senior technical interviewers on claims they cannot defend.
- **Capabilities**:
  - Embedded on every application card in `Applications.jsx` under **"Stress-Test My Resume"**.
  - **Aggressive Technical Drill-Down Questions**: Analyzes the specific bullet claims on the submitted resume against the JD, generating the exact hard follow-up questions senior engineers ask:
    - *"You claim you optimized database latency by 35%. What specific index structure did you use? How did you isolate query execution time from network overhead?"*
  - **Candidate Defense Blueprint**: Generates talking points and technical reasoning grounded in the student's *actual* project code and verified GitHub proof, ensuring they can defend every single word under pressure.

### 4.7 HERO FEATURE 3: The Job Reality & Red Flag Auditor (Search & Job Details)
- **Problem**: Over 40% of public job listings are ghost jobs, agency funnel traps, or exploitative sweatshops requiring 14 frameworks for an entry-level wage.
- **Capabilities**:
  - Automatically audits any job in `SearchJobs.jsx` (discovered or pasted) with a deterministic **Role Quality & Health Score (0-100)**:
    - **Tech Stack Overload Penalty**: Flags listings demanding $>6$ disjoint technology paradigms for a junior title.
    - **Ghost Job & Stale Indicators**: Flags postings with zero team specificity or stale repost history.
    - **Burnout Phrasing Warnings**: Scans for red flags (*"fast-paced"*, *"work hard play hard"*, *"wear many hats"*, *"weekend availability"*).
    - **Engineering Integrity Check**: Flags disguised sales, customer support, or unpaid trial assignments.

### 4.8 HERO FEATURE 4: The Application Autopsy & Gap Recovery Engine (Applications Kanban)
- **Problem**: When a student gets rejected or ghosted, they receive zero feedback and abandon their search in frustration.
- **Capabilities**:
  - Embedded on every application card in `Applications.jsx` when marked `Rejected` (or via **"Run Autopsy"**):
    - **The Fatal Disqualifier**: Pinpoints the decisive missing hard blocker skill or metric gap that caused the rejection.
    - **1-Click 48-Hour Recovery Bridge**: Maps the fatal blocker directly to the corresponding **Actionable Growth Blueprint** in `Growth.jsx` (Docker, Kubernetes, Redis, Kafka, FastAPI, etc.).
    - **Automated Verification**: When the candidate builds and verifies their GitHub repo, the blocker is permanently cleared for all future matching!

---

## 5. Non-Functional & Technical Requirements

1. **Performance**:
   - Job URL ingestion and text extraction completes in $< 2.5$ seconds.
   - 100-Point ATS diagnostic score recalculates in $< 50$ milliseconds.
   - Application bundle generation completes in $< 3$ seconds.
2. **Reliability & Truth**:
   - Zero hallucinated tools, libraries, or quantitative metrics.
   - LinkedIn connection notes strictly enforced at $< 300$ characters.
3. **Browser Compatibility**:
   - 100% desktop web application responsive on modern browsers (Chrome, Edge, Firefox, Safari).
   - Zero browser extension installation or third-party store permissions required.

---

## 6. Success Metrics & Verification

- **100% End-to-End Test Pass Rate**: All backend unit tests, E2E contract tests, and frontend test suites pass.
- **Clean Production Build**: 0 ESLint warnings, Vite build $< 20$ seconds.
- **User Delight**: Students can go from finding a raw job posting on the web to having a complete tailored application bundle and interview prep in under 60 seconds.
