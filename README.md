# 🧭 CareerPilot AI

**Smart Job-Fit Analysis, Resume Improvement & ATS Matching**

An AI-powered job application assistant that helps job seekers find matches, improve resumes, and generate cover letters using LangGraph agentic workflows and Google Gemini AI.

## ✨ Features

- **🎯 Smart Job Matching**: Multi-strategy search (TF-IDF + Semantic) with optional SerpAPI integration for Google Jobs
- **📊 ATS Scoring**: AI-powered fit score calculation with skill matching and missing skills identification
- **✨ Resume Enhancement**: AI-generated resume improvements optimized for specific job postings
- **📝 Cover Letter Generation**: Personalized cover letters tailored to each application
- **📚 Application Tracking**: Save and track all applications with fit scores and analysis history
- **🔐 User Authentication**: Secure login/signup with JWT tokens
- **🔑 Bring Your Own Keys**: Users provide their own Google Gemini and SerpAPI keys for privacy and control

## 🛠️ Tech Stack

**Backend**: FastAPI, LangGraph, LangChain, Google Gemini AI, SQLAlchemy, ChromaDB, SerpAPI  
**Frontend**: React, Vite, TailwindCSS, shadcn/ui  
**Database**: SQLite  
**Authentication**: JWT tokens with bcrypt password hashing

## 🚀 Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Set Up Environment

Create a `.env` file in the `backend` directory:

```env
# Optional: Only needed if you want to use environment variables
# Users will provide their own keys through the UI
GOOGLE_API_KEY=your_google_api_key_here  # Optional
SERPAPI_API_KEY=your_serpapi_key_here     # Optional
```

> **Note**: API keys are now user-provided through the frontend UI. Each user can configure their own Google Gemini and SerpAPI keys, which are stored securely in their browser's localStorage (scoped to their user account).

### 3. Run the Application

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

## 📋 Usage

### First Time Setup
1. **Sign Up** → Create your account
2. **Configure API Keys** → Provide your Google Gemini API key (required) and SerpAPI key (optional)
3. **Upload Resume** → Upload your PDF resume

### Job Search & Analysis
1. **Search Jobs** → 
   - Leave search empty for AI-powered auto-matching based on your resume
   - Or enter a specific job title/query
   - Toggle "Use SerpAPI" to search Google Jobs (requires SerpAPI key)
2. **Analyze Match** → Click on any job to get:
   - Overall fit score and skill match percentage
   - Detailed fit explanation
   - Missing skills identification
   - AI-improved resume tailored to the job
   - Personalized cover letter
3. **View Applications** → Track all your analyzed jobs and applications

### API Key Management
- Keys are stored in your browser's localStorage
- Keys are scoped to your user account (not shared between users)
- Keys are automatically cleared when you log out
- You can update keys anytime via the "Configure API Keys" button

## 🏗️ Architecture

### LangGraph Agent Workflow
```
Resume Upload → Skill Extraction → Job Search (DB/SerpAPI) → 
Job Description Analysis → Fit Scoring → Resume Improvement → 
Cover Letter Generation → Application Saving
```

### Key Components
- **Skill Mapping Agent**: Extracts skills from resume and generates search queries
- **Job Search Agent**: Searches internal database using TF-IDF + semantic search
- **SerpAPI Agent**: Searches Google Jobs via SerpAPI (optional)
- **JD Analyzer Agent**: Analyzes job descriptions and extracts requirements
- **Fit Score Agent**: Calculates ATS compatibility and skill matching
- **Resume Improver Agent**: Generates tailored resume improvements
- **Cover Letter Agent**: Creates personalized cover letters
- **Application Saver Agent**: Persists analysis results to database

## 📁 Project Structure

```
careerPilot/
├── backend/
│   ├── agents/              # LangGraph agents
│   │   ├── graph.py        # Main workflow orchestration
│   │   ├── state.py        # Shared state definition
│   │   ├── skill_mapping_agent.py
│   │   ├── job_search_agent.py
│   │   ├── serpapi_job_search_agent.py
│   │   ├── jd_analyzer_agent.py
│   │   ├── fit_score_agent.py
│   │   ├── resume_improver_agent.py
│   │   ├── cover_letter_agent.py
│   │   └── application_saver_agent.py
│   ├── models/              # Database models & schemas
│   │   ├── user_model.py
│   │   ├── job_model.py
│   │   ├── resume_model.py
│   │   ├── application_model.py
│   │   └── schemas.py
│   ├── routers/             # API endpoints
│   │   ├── auth_router.py
│   │   ├── careerpilot_router.py
│   │   ├── job_router.py
│   │   ├── resume_router.py
│   │   └── application_router.py
│   ├── services/            # Business logic
│   │   ├── job_ingestor.py
│   │   └── resume_parser.py
│   ├── utils/               # Utilities
│   │   └── auth.py
│   └── main.py              # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layout/
│   │   │   └── ui/
│   │   ├── context/         # React context (Auth)
│   │   ├── pages/           # Application pages
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── CareerPilot.jsx
│   │   │   ├── UploadResume.jsx
│   │   │   ├── SearchJobs.jsx
│   │   │   └── Applications.jsx
│   │   ├── services/        # API client
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user details

### Resume Management
- `POST /resume/upload` - Upload PDF resume
- `GET /resume/all` - Get all user's resumes
- `GET /resume/{resume_id}` - Get specific resume

### Job Management
- `POST /jobs/add` - Add job posting to database
- `GET /jobs/all` - Get all jobs
- `GET /jobs/{job_id}` - Get specific job

### CareerPilot AI Pipeline
- `POST /careerpilot/analyze` - Run full AI analysis pipeline
  - Accepts: `resume_id`, `job_id` or `search_query`, `google_api_key`, `serpapi_api_key` (optional)
  - Returns: Fit scores, improved resume, cover letter, and saves application

### Application Tracking
- `GET /applications/all` - Get all user's applications
- `GET /applications/{application_id}` - Get specific application details

## 🔑 Getting API Keys

### Google Gemini API Key (Required)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Enter it in the CareerPilot UI when prompted

### SerpAPI Key (Optional - for Google Jobs search)
1. Go to [SerpAPI](https://serpapi.com/)
2. Sign up for a free account (100 searches/month)
3. Get your API key from the dashboard
4. Enter it in the CareerPilot UI when using SerpAPI search

## 🔒 Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **User-Scoped Keys**: API keys are stored per-user in localStorage
- **Auto-Cleanup**: Keys are cleared on logout
- **No Server-Side Key Storage**: API keys are never stored in the backend database

## 🐛 Troubleshooting

### "No jobs found" with SerpAPI
- Try simpler search queries (e.g., "Software Engineer" instead of listing all technologies)
- Leave search empty to use AI-powered auto-matching
- Check your SerpAPI quota at https://serpapi.com/dashboard

### Duplicate jobs in database
- The system now automatically checks for duplicates by title and company
- Existing jobs are reused instead of creating duplicates

### Application not saving
- Ensure you have a valid job selected
- Check that your Google API key is configured
- Verify backend logs for detailed error messages

## 📝 License

MIT License - feel free to use this project for your own job search!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using LangGraph, FastAPI, and React**
