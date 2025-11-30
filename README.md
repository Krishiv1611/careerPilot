# 🚀 CareerPilot AI: The Autonomous Career Orchestration Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_Site-blue?style=for-the-badge&logo=vercel)](https://career-pilot-frontend.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.10+-blue.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

---

**CareerPilot AI** is a comprehensive, **AI-powered** career acceleration ecosystem designed to autonomously navigate the complexities of the modern job market. By fusing **Generative AI**, **Agentic Workflows**, and **Deep Semantic Search**, it transforms the passive process of job hunting into a proactive, data-driven strategy.

This platform does not just "search" for jobs; it **understands** your career trajectory, **aligns** opportunities with your unique skill vector, and **engineers** your application materials to maximize conversion rates.

---

## 🌟 Key Features

### 🧠 Cognitive Core & AI Capabilities

CareerPilot AI is built upon a sophisticated **Multi-Agent System (MAS)** architecture, where specialized AI agents collaborate to execute complex tasks:

#### 1. Cognitive Resume Parsing Agent
*   **Function**: Ingests unstructured PDF resumes and converts them into structured, semantic data.
*   **AI Tech**: Utilizes **Natural Language Processing (NLP)** to identify and categorize skills, experience, and educational background with high fidelity.
*   **Outcome**: A digital twin of your professional profile ready for deep analysis.

#### 2. Predictive ATS Scoring Engine
*   **Function**: Simulates corporate Applicant Tracking Systems (ATS) to audit your resume.
*   **AI Tech**: Deploys **Generative AI** to evaluate formatting, keyword density, and structural integrity against industry standards.
*   **Outcome**: A granular score (0-100) and a strategic feedback report to immunize your resume against automated rejection.

#### 3. Semantic Job Discovery Agent
*   **Function**: Scours internal databases and the live web for high-potential opportunities.
*   **AI Tech**: Leverages **Neural Search** and **Vector Embeddings** to go beyond keyword matching, finding jobs that semantically align with your core competencies.
*   **Integration**: Seamlessly connects with **SerpAPI** for real-time access to global job listings (Google Jobs).

#### 4. Deep Fit Analysis Agent
*   **Function**: The "Brain" of the operation. It reads job descriptions like a hiring manager.
*   **AI Tech**: Uses **Large Language Models (LLMs)** (Google Gemini) to perform a multi-dimensional gap analysis between your profile and the target role.
*   **Outcome**: A "Fit Score" and a detailed diagnostic report highlighting strengths, weaknesses, and critical missing skills.

#### 5. Generative Content Architect
*   **Function**: Autonomously drafts hyper-personalized application assets.
*   **AI Tech**:
    *   **Resume Tailoring**: Reconstructs your resume to emphasize the specific skills and experiences demanded by the target job.
    *   **Cover Letter Synthesis**: Composes persuasive, context-aware cover letters that weave your narrative into the company's mission.

#### 6. Personalized Career Roadmap Agent
*   **Function**: Generates a bespoke learning and preparation strategy for a specific target role.
*   **AI Tech**: Analyzes the gap between your current profile and the job requirements to create a step-by-step action plan.
*   **Outcome**: A structured roadmap containing milestones, resources, and timelines to bridge skill gaps and land the job.

---

## 🏗️ Technical Architecture

The system is engineered as a robust, scalable, and containerized full-stack application.

### Backend: The Neural Control Plane
*   **Framework**: **FastAPI** (Python) for high-performance, asynchronous API handling.
*   **Orchestration**: **LangGraph** manages the stateful, cyclic graphs of the agentic workflows.
*   **Intelligence**: **Google Gemini Models** (via `langchain-google-genai`) provide the reasoning and generative capabilities.
*   **Memory**: **PostgreSQL** (via **SQLAlchemy**) ensures ACID-compliant persistence of user data, resumes, and job history.
*   **Vector Engine**: **ChromaDB** powers the semantic retrieval system, storing embeddings of resumes and job descriptions for similarity search.
*   **Security**: **OAuth2** with **JWT** (JSON Web Tokens) and **Argon2** password hashing.

### Frontend: The Command Center
*   **Framework**: **React.js 19** (Vite) delivers a lightning-fast, reactive user interface.
*   **Design System**: **Shadcn/UI** and **Tailwind CSS 4** provide a premium, accessible, and responsive aesthetic.
*   **Routing**: **React Router DOM 7** for seamless navigation.
*   **State Management**: React Hooks manage the complex state of real-time AI interactions.

### Infrastructure
*   **Containerization**: **Docker** encapsulates the entire stack, ensuring consistency across development and production environments.
*   **Orchestration**: **Docker Compose** manages the multi-container lifecycle.

---

## 📂 Project Structure

```text
careerPilot/
├── backend/                        # Python FastAPI Backend
│   ├── agents/                     # The "Brain" - AI Agent Definitions
│   │   ├── graph.py                # LangGraph workflow definition
│   │   ├── job_search_agent.py     # Internal DB search logic
│   │   ├── fit_score_agent.py      # Gemini-powered fit analysis
│   │   ├── roadmap_agent.py        # Roadmap generation logic
│   │   └── ... (other agents)
│   ├── models/                     # Data Layer
│   │   ├── database.py             # DB connection & session handling
│   │   ├── schemas.py              # Pydantic models for API validation
│   │   ├── user_model.py           # SQLAlchemy ORM models
│   │   └── roadmap_model.py        # Roadmap data models
│   ├── routers/                    # API Interface
│   │   ├── careerpilot_router.py   # Main endpoint for AI workflows
│   │   ├── resume_router.py        # Resume management endpoints
│   │   ├── roadmap_router.py       # Roadmap endpoints
│   │   └── auth_router.py          # Authentication endpoints
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
│   │   │   ├── ui/                 # Shadcn/UI components
│   │   │   └── settings/           # Configuration modals
│   │   ├── pages/                  # Main Views
│   │   │   ├── CareerPilot.jsx     # The AI Dashboard
│   │   │   ├── UploadResume.jsx    # Resume ingestion interface
│   │   │   └── Roadmap.jsx         # Roadmap visualization
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
*   **Docker Desktop** (Running)
*   **Git** (For version control)
*   **PostgreSQL Database**: You need a running PostgreSQL instance (local or cloud).
*   **API Keys**:
    *   **Google Gemini API Key**: Essential for all AI features. [Get it here](https://aistudio.google.com/).
    *   **SerpAPI Key**: Optional, for live Google Jobs search. [Get it here](https://serpapi.com/).

### ⚙️ Configuration (.env)

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://user:password@host:port/dbname

# Security (Required)
SECRET_KEY=your_super_secret_random_string

# CORS Configuration (Optional)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Keys (Can also be set via UI)
GOOGLE_API_KEY=your_gemini_key
SERPAPI_API_KEY=your_serpapi_key
TAVILY_API_KEY=your_tavily_key
```

### Option 1: Docker Deployment (Recommended)

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Krishiv1611/careerPilot.git
    cd careerPilot
    ```

2.  **Launch with Docker Compose**
    ```bash
    docker-compose up --build -d
    ```

3.  **Access the Platform**
    *   **Frontend UI**: [http://localhost:3000](http://localhost:3000)
    *   **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### Option 2: Local Development (Manual)

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

## 📡 API Documentation

The backend exposes a comprehensive REST API documented via Swagger UI at `/docs`.

### Key Endpoints

#### 🔐 Authentication
*   `POST /auth/register`: Create a new user account.
*   `POST /auth/login`: Authenticate and receive a JWT access token.

#### 📄 Resumes
*   `POST /resume/upload`: Upload a PDF resume. Triggers parsing and initial analysis.
*   `GET /resume/all`: Retrieve all resumes associated with the current user.
*   `GET /resume/{id}`: Get detailed data for a specific resume.
*   `POST /resume/download-pdf`: Generate and download a PDF version of the improved resume.

#### 💼 Jobs
*   `POST /jobs/add`: Manually add a job to the database.
*   `GET /jobs/all`: List all available jobs.
*   `POST /jobs/reindex-all`: Re-index all jobs into the vector store for semantic search.

#### 🗺️ Roadmap
*   `POST /roadmap/create`: Generate a personalized career roadmap for a specific job.
*   `GET /roadmap/{job_id}`: Retrieve an existing roadmap for a job.

#### 🧠 CareerPilot (AI Agents)
*   `POST /careerpilot/analyze`: **The Core Endpoint**. Triggers the multi-agent workflow:
    *   **Input**: Resume ID, Job ID (optional), Search Query (optional).
    *   **Process**: Search -> Match -> Gap Analysis -> Tailoring.
    *   **Output**: Fit Score, Missing Skills, Improved Resume, Cover Letter.

---

## 📖 User Manual: Navigating the AI Workflow

### Phase 1: Configuration
1.  Open the application (or visit the [Live Demo](https://career-pilot-frontend.vercel.app)).
2.  Click the **"Configure Keys"** button in the top-right corner.
3.  Input your **Google Gemini API Key**.
4.  (Optional) Input your **SerpAPI Key** to enable live web searching.
5.  Save. Your keys are encrypted and stored locally in your browser.

### Phase 2: Ingestion & Audit
1.  Go to **"Upload Resume"**.
2.  Drag and drop your PDF resume.
3.  **Watch the AI work**: It will instantly parse your document, extract your skill DNA, and run an ATS audit.
4.  Review the **ATS Score** and feedback.

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
    *   **Roadmap**: View a step-by-step plan to acquire the missing skills.
4.  Use these AI-generated assets to apply with confidence.

---

## 🔧 Troubleshooting

*   **"Connection Refused"**: Ensure the backend container is running. Check logs with `docker logs careerpilot-backend`.
*   **"Database Error"**: Ensure your `DATABASE_URL` is correct and the PostgreSQL server is running.
*   **"Google API Key Missing"**: The AI agents cannot function without fuel. Configure your key in the settings modal.
*   **"Search Query Missing"**: This has been resolved in the latest patch by optimizing the graph execution order.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

*Powered by Advanced Agentic AI. Engineered for Career Success.*
