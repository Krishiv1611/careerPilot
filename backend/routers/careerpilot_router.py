# backend/routers/careerpilot_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os
import traceback

from models.database import get_db
from models.schemas import CareerPilotRequest, CareerPilotResponse
from agents.graph import build_careerpilot_graph

from models.user_model import User
from utils.auth import get_current_user
from utils.encryption import decrypt_api_key

router = APIRouter(prefix="/careerpilot", tags=["CareerPilot"])


@router.post("/analyze", response_model=CareerPilotResponse)
def analyze(
    request: CareerPilotRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    # Extract API keys from request
    google_api_key = request.google_api_key
    serpapi_api_key = request.serpapi_api_key
    tavily_api_key = request.tavily_api_key
    
    # Validate that Google API key is provided (required)
    if not google_api_key:
        raise HTTPException(
            status_code=400,
            detail="Google Gemini AI API key not provided. Please enter your API key in the configuration panel."
        )
    
    # Validate SerpAPI key if use_serpapi is requested
    use_serpapi = request.use_serpapi or False
    if use_serpapi and not serpapi_api_key:
        # Fallback to regular job search if SerpAPI key is missing
        use_serpapi = False

    # Validate Tavily key if use_tavily is requested
    use_tavily = request.use_tavily or False
    if use_tavily and not tavily_api_key:
        use_tavily = False

    graph = build_careerpilot_graph()

    initial_state = {
        "db": db,
        "user_id": current_user.id,
        "resume_id": request.resume_id,
        "job_id": request.job_id,
        "search_query": request.search_query,
        "use_serpapi": use_serpapi,
        "use_tavily": use_tavily,
        "google_api_key": google_api_key,  # Pass user's Google API key
        "serpapi_api_key": serpapi_api_key if use_serpapi else None,  # Pass SerpAPI key if needed
        "tavily_api_key": tavily_api_key if use_tavily else None,
        "timestamp": "now",
        
        # Pass intermediate data if available
        "resume_text": request.resume_text,
        "extracted_skills": request.extracted_skills,
        "skill_categories": request.skill_categories,
        "job_description": request.job_description
    }

    try:
        final_state = graph.invoke(initial_state)
        
        # Get recommended_jobs and ensure it's a list
        recommended_jobs = final_state.get("recommended_jobs")
        if recommended_jobs is None:
            recommended_jobs = []
        elif not isinstance(recommended_jobs, list):
            print(f"[Router] WARNING: recommended_jobs is not a list: {type(recommended_jobs)}")
            recommended_jobs = []
        
        # Ensure all required response fields have default values if missing
        # This handles cases where the graph ends early (e.g., job search without job_id)
        response_data = {
            "resume_text": final_state.get("resume_text"),
            "extracted_skills": final_state.get("extracted_skills", []),
            "skill_categories": final_state.get("skill_categories", {}),
            "job_id": final_state.get("job_id"),
            "job_description": final_state.get("job_description"),
            "job_skills": final_state.get("job_skills", []),
            "job_metadata": final_state.get("job_metadata", {}),
            "missing_skills": final_state.get("missing_skills", []),
            "skill_match_score": final_state.get("skill_match_score"),
            "overall_fit_score": final_state.get("overall_fit_score"),
            "fit_explanation": final_state.get("fit_explanation"),
            "improved_resume": final_state.get("improved_resume"),
            "cover_letter": final_state.get("cover_letter"),
            "application_id": final_state.get("application_id"),
            "timestamp": final_state.get("timestamp", "now"),
            # Always include recommended_jobs as a list (never None)
            "recommended_jobs": recommended_jobs
        }
        
        # Add SerpAPI error/warning if present
        if "serpapi_error" in final_state:
            response_data["serpapi_error"] = final_state.get("serpapi_error")
        if "serpapi_warning" in final_state:
            response_data["serpapi_warning"] = final_state.get("serpapi_warning")
        
        # Debug: Print recommended_jobs count and sample
        print(f"[Router] Returning {len(recommended_jobs)} recommended jobs")
        if recommended_jobs and len(recommended_jobs) > 0:
            print(f"[Router] First job sample: {recommended_jobs[0]}")
            print(f"[Router] All job IDs: {[job.get('id') for job in recommended_jobs[:5]]}")
        
        return response_data
        
    except ValueError as e:
        # Handle specific errors from agents
        error_msg = str(e)
        if "SERPAPI" in error_msg:
            raise HTTPException(
                status_code=400,
                detail=f"SerpAPI error: {error_msg}. Please check your SERPAPI_API_KEY or disable SerpAPI search."
            )
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        # Print full traceback for debugging
        print(f"[Router] ERROR: Exception occurred during graph execution")
        print(f"[Router] Exception type: {type(e).__name__}")
        print(f"[Router] Exception message: {str(e)}")
        print(f"[Router] Full traceback:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
