# CareerPilot AI: The Autonomous Career Orchestration Platform

**CareerPilot AI** is a state-of-the-art, **AI-powered** career acceleration ecosystem designed to autonomously navigate the complexities of the modern job market. By fusing **Generative AI**, **Agentic Workflows**, and **Deep Semantic Search**, it transforms the passive process of job hunting into a proactive, data-driven strategy.

This platform does not just "search" for jobs; it **understands** your career trajectory, **aligns** opportunities with your unique skill vector, and **engineers** your application materials to maximize conversion rates.

---

## 🧠 Cognitive Core & AI Capabilities

CareerPilot AI is built upon a sophisticated **Multi-Agent System (MAS)** architecture, where specialized AI agents collaborate to execute complex tasks:

### 1. Cognitive Resume Parsing Agent
*   **Function**: Ingests unstructured PDF resumes and converts them into structured, semantic data.
*   **AI Tech**: Utilizes **Natural Language Processing (NLP)** to identify and categorize skills, experience, and educational background with high fidelity.
*   **Outcome**: A digital twin of your professional profile ready for deep analysis.

### 2. Predictive ATS Scoring Engine
*   **Function**: Simulates corporate Applicant Tracking Systems (ATS) to audit your resume.
*   **AI Tech**: Deploys **Generative AI** to evaluate formatting, keyword density, and structural integrity against industry standards.
*   **Outcome**: A granular score (0-100) and a strategic feedback report to immunize your resume against automated rejection.

### 3. Semantic Job Discovery Agent
*   **Function**: Scours internal databases and the live web for high-potential opportunities.
*   **AI Tech**: Leverages **Neural Search** and **Vector Embeddings** to go beyond keyword matching, finding jobs that semantically align with your core competencies.
*   **Integration**: Seamlessly connects with **SerpAPI** for real-time access to global job listings (Google Jobs).

### 4. Deep Fit Analysis Agent
*   **Function**: The "Brain" of the operation. It reads job descriptions like a hiring manager.
*   **AI Tech**: Uses **Large Language Models (LLMs)** (Google Gemini) to perform a multi-dimensional gap analysis between your profile and the target role.
*   **Outcome**: A "Fit Score" and a detailed diagnostic report highlighting strengths, weaknesses, and critical missing skills.

### 5. Generative Content Architect
*   **Function**: Autonomously drafts hyper-personalized application assets.
*   **AI Tech**:
    *   **Resume Tailoring**: Reconstructs your resume to emphasize the specific skills and experiences demanded by the target job.
    *   **Cover Letter Synthesis**: Composes persuasive, context-aware cover letters that weave your narrative into the company's mission.

---

## 🏗️ Technical Architecture

The system is engineered as a robust, scalable, and containerized full-stack application.

### Backend: The Neural Control Plane
*   **Framework**: **FastAPI** (Python) for high-performance, asynchronous API handling.
*   **Orchestration**: **LangGraph** manages the stateful, cyclic graphs of the agentic workflows.
*   **Intelligence**: **Google Gemini Models** (via `langchain-google-genai`) provide the reasoning and generative capabilities.
*   **Memory**: **SQLite** (via **SQLAlchemy**) ensures ACID-compliant persistence of user data, resumes, and job history.
*   **Vector Engine**: **ChromaDB** powers the semantic retrieval system, storing embeddings of resumes and job descriptions for similarity search.

### Frontend: The Command Center
*   **Framework**: **React.js** (Vite) delivers a lightning-fast, reactive user interface.
*   **Design System**: **Shadcn/UI** and **Tailwind CSS** provide a premium, accessible, and responsive aesthetic.
*   **State Management**: React Hooks manage the complex state of real-time AI interactions.

### Infrastructure
*   **Containerization**: **Docker** encapsulates the entire stack, ensuring consistency across development and production environments.
*   **Orchestration**: **Docker Compose** manages the multi-container lifecycle.

---

## 📂 Project Structure

A detailed breakdown of the codebase organization:

```text
careerPilot/
├── backend/                        # Python FastAPI Backend
│   ├── agents/                     # The "Brain" - AI Agent Definitions
│   │   ├── graph.py                # LangGraph workflow definition
│   │   ├── job_search_agent.py     # Internal DB search logic
│   │   ├── fit_score_agent.py      # Gemini-powered fit analysis
│   │   └── ... (other agents)
│   ├── models/                     # Data Layer
│   │   ├── database.py             # DB connection & session handling
│   │   ├── schemas.py              # Pydantic models for API validation
│   │   └── user_model.py           # SQLAlchemy ORM models
│   ├── routers/                    # API Interface
│   │   ├── careerpilot_router.py   # Main endpoint for AI workflows
│   │   └── resume_router.py        # Resume management endpoints
│   ├── services/                   # Business Logic & Utilities
│   │   ├── ats_service.py          # ATS scoring logic
│   │   ├── embedding.py            # Vector embedding service
│   │   └── pdf_reader.py           # PDF extraction utility
│   ├── data/                       # Local storage (Git-ignored)
│   │   ├── resumes/                # Uploaded PDF files
│   │   └── vectorstore/            # ChromaDB persistence
│   ├── main.py                     # Application entry point
│   ├── requirements.txt            # Python dependencies
│   └── Dockerfile                  # Backend container definition
│
├── frontend/                       # React Frontend
│   ├── src/
│   │   ├── components/             # UI Building Blocks
│   │   │   ├── layout/             # Navbar, Layout wrappers
│   │   │   ├── ui/                 # Shadcn/UI components (Button, Card, etc.)
│   │   │   └── settings/           # Configuration modals
│   │   ├── pages/                  # Main Views
│   │   │   ├── CareerPilot.jsx     # The AI Dashboard
│   │   │   └── UploadResume.jsx    # Resume ingestion interface
│   │   ├── services/               # API Integration
│   │   │   └── api.js              # Axios configuration
│   │   ├── App.jsx                 # Main Router
│   │   └── main.jsx                # Entry point
│   ├── public/                     # Static assets
│   ├── index.html                  # HTML template
│   ├── package.json                # Node.js dependencies
│   ├── tailwind.config.js          # Styling configuration
│   └── Dockerfile                  # Frontend container definition
│
├── docker-compose.yml              # Multi-container orchestration config
├── .env                            # Environment variables (API Keys)
└── README.md                       # This documentation
```

---

## 🚀 Installation & Deployment Guide

### Prerequisites
Ensure your environment is equipped with:
*   **Docker Desktop** (Running)
*   **Git** (For version control)
*   **API Keys**:
    *   **Google Gemini API Key**: Essential for all AI features. [Get it here](https://aistudio.google.com/).
    *   **SerpAPI Key**: Optional, for live Google Jobs search. [Get it here](https://serpapi.com/).

### Option 1: Docker Deployment (Recommended)

This method guarantees the application runs exactly as intended, isolating dependencies in containers.

1.  **Clone the Repository**
    ```bash
    git clone <repository-url>
    cd careerPilot
    ```

2.  **Launch with Docker Compose**
    Build the images and start the services in detached mode.
    ```bash
    docker-compose up --build -d
    ```
    *   *Note: The first build may take a few minutes as it pulls base images and installs dependencies.*

3.  **Verify Deployment**
    Check the status of your containers:
    ```bash
    docker-compose ps
    ```
    You should see `careerpilot-backend` and `careerpilot-frontend` in a `Up` state.

4.  **Access the Platform**
    *   **Frontend UI**: [http://localhost:5173](http://localhost:5173)
    *   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Local Development (Manual)

If you wish to run the services directly on your machine for development:

**Backend:**
1.  Navigate to `backend/`.
2.  Create a virtual environment: `python -m venv venv`
3.  Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows).
4.  Install dependencies: `pip install -r requirements.txt`
5.  Run the server: `uvicorn main:app --reload`

**Frontend:**
1.  Navigate to `frontend/`.
2.  Install dependencies: `npm install`
3.  Start the dev server: `npm run dev`

---

## 📖 User Manual: Navigating the AI Workflow

### Phase 1: Configuration
1.  Open the application at `http://localhost:5173`.
2.  Click the **"Configure Keys"** button in the top-right corner.
3.  Input your **Google Gemini API Key**. This is the fuel for the AI engine.
4.  (Optional) Input your **SerpAPI Key** to enable live web searching.
5.  Save. Your keys are encrypted and stored locally in your browser.

### Phase 2: Ingestion & Audit
1.  Go to **"Upload Resume"**.
2.  Drag and drop your PDF resume.
3.  **Watch the AI work**: It will instantly parse your document, extract your skill DNA, and run an ATS audit.
4.  Review the **ATS Score** and feedback to understand your baseline.

### Phase 3: Strategic Discovery
1.  Navigate to **"CareerPilot AI"** (Dashboard).
2.  Select your uploaded resume from the dropdown.
3.  **Auto-Match**: Leave the search bar empty and click "Find Jobs". The AI will infer your ideal roles based on your extracted skills.
4.  **Targeted Search**: Enter a specific role (e.g., "Senior React Developer") to narrow the scope.

### Phase 4: Deep Analysis & Execution
1.  Browse the intelligent job cards.
2.  Click **"Analyze Match"** on a role that interests you.
3.  The **Fit Analysis Agent** will perform a deep dive:
    *   **Fit Score**: A percentage indicating your alignment.
    *   **Gap Analysis**: Identifies critical missing skills.
    *   **Tailored Resume**: Generates a new version of your resume optimized for this specific job.
    *   **Cover Letter**: Drafts a compelling narrative for your application.
4.  Use these AI-generated assets to apply with confidence.

---

## 🔧 Troubleshooting & Support

*   **"Connection Refused"**: Ensure the backend container is running. Check logs with `docker logs careerpilot-backend`.
*   **"Google API Key Missing"**: The AI agents cannot function without fuel. Configure your key in the settings modal.
*   **"Search Query Missing"**: This has been resolved in the latest patch by optimizing the graph execution order.
*   **Docker Build Fails**: Ensure you have stable internet connectivity and sufficient disk space for the images.

---

*Powered by Advanced Agentic AI. Engineered for Career Success.*
