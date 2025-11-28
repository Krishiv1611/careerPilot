from typing import List, Dict, Any, TypedDict, Optional
from sqlalchemy.orm import Session


class CareerPilotState(TypedDict, total=False):
    """
    Global state shared across all agents in the CareerPilot workflow.
    """

    # ----------------------------
    # System & DB
    # ----------------------------
    db: Session                 # SQLAlchemy session passed into graph
    user_id: int                # Authenticated user ID

    # ----------------------------
    # User Inputs
    # ----------------------------
    resume_id: str             # PDF path OR resume table ID
    job_id: str                # Selected job ID (JD source)
    search_query: Optional[str]  # For job search pipeline
    use_serpapi: Optional[bool]
    google_api_key: Optional[str] # User provided API key
    serpapi_api_key: Optional[str] # User provided API key

    # ----------------------------
    # Resume Extraction
    # ----------------------------
    resume_text: str
    resume_chunks: List[str]

    # ----------------------------
    # Skill Extraction
    # ----------------------------
    extracted_skills: List[str]
    skill_categories: Dict[str, List[str]]

    # ----------------------------
    # Job Data + JD Analyzer
    # ----------------------------
    job_description: str
    job_skills: List[str]

    job_metadata: Dict[str, Any]  # {
                                  #   top_matching_chunks: [...]
                                  #   chunk_sources: [...]
                                  #   semantic_scores: [...]
                                  #   avg_semantic_score: float
                                  # }

    # ----------------------------
    # Job Search Results
    # ----------------------------
    recommended_jobs: Optional[List[Dict[str, Any]]]  # List of job recommendations from search

    # ----------------------------
    # Fit Scoring (ATS)
    # ----------------------------
    missing_skills: List[str]
    skill_match_score: float
    overall_fit_score: float
    fit_explanation: str

    # ----------------------------
    # AI-Generated Content
    # ----------------------------
    improved_resume: str
    cover_letter: str
    ats_score: float
    ats_report: str

    # ----------------------------
    # Application Saving
    # ----------------------------
    application_id: Optional[str]

    # ----------------------------
    # System Metadata
    # ----------------------------
    timestamp: str
