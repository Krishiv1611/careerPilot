
# 🧭 CareerPilot AI

**Smart Job-Fit, Resume Improvement, ATS Matching 

An AI-powered job application assistant that helps job seekers find matches, improve resumes, and generate cover letters using LangGraph agentic workflows and Google Gemini AI.

## ✨ Features

- **🎯 Smart Job Matching**: Multi-strategy search (TF-IDF + Semantic) with SerpAPI integration for Google Jobs
- **📊 ATS Scoring**: AI-powered fit score calculation with skill matching and missing skills identification
- **✨ Resume Enhancement**: AI-generated resume improvements optimized for specific job postings
- **📝 Cover Letter Generation**: Personalized cover letters tailored to each application
- **📚 Application Tracking**: Save and track all applications with fit scores

## 🛠️ Tech Stack

**Backend**: FastAPI, LangGraph, LangChain, Google Gemini AI, SQLAlchemy, ChromaDB, SerpAPI  
**Frontend**: Streamlit  
**Database**: SQLite

## 🚀 Quick Start

### 1. Install Dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Set Up Environment

Create a `.env` file:

```env
GOOGLE_API_KEY=your_google_api_key_here
SERPAPI_API_KEY=your_serpapi_key_here  # Optional
```

### 3. Run the Application

**Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
streamlit run app.py
```

## 📋 Usage

1. **Upload Resume** → Upload your PDF resume
2. **Search Jobs** → Browse database or search with SerpAPI
3. **Run Pipeline** → Get fit scores, improved resume, and cover letter
4. **View History** → Track all your applications

## 🏗️ Architecture

```
Resume Upload → Extract Skills → Job Search → JD Analysis → 
Fit Scoring → Resume Improvement → Cover Letter → Save Application
```

## 📁 Project Structure

```
careerPilot/
├── backend/
│   ├── agents/          # LangGraph agents
│   ├── models/          # Database models
│   ├── routers/         # API endpoints
│   ├── services/        # Business logic
│   └── main.py
├── frontend/
│   ├── pages/           # Streamlit pages
│   └── app.py
└── requirements.txt
```

## 🔌 API Endpoints

- `POST /resume/upload` - Upload resume
- `POST /jobs/add` - Add job posting
- `POST /careerpilot/analyze` - Run AI pipeline
- `GET /applications/all` - Get application history




