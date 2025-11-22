# backend/routers/careerpilot_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import os

from models.database import get_db
from models.schemas import CareerPilotRequest, CareerPilotResponse
from agents.graph import build_careerpilot_graph

router = APIRouter(prefix="/careerpilot", tags=["CareerPilot"])


@router.post("/analyze", response_model=CareerPilotResponse)
def analyze(request: CareerPilotRequest, db: Session = Depends(get_db)):

    # Validate SerpAPI key if use_serpapi is requested
    use_serpapi = request.use_serpapi or False
    if use_serpapi:
        serpapi_key = os.getenv("SERPAPI_API_KEY")
        if not serpapi_key:
            # Fallback to regular job search if API key is missing
            use_serpapi = False

    graph = build_careerpilot_graph()

    initial_state = {
        "db": db,
        "resume_id": request.resume_id,
        "job_id": request.job_id,
        "search_query": request.search_query,
        "use_serpapi": use_serpapi,  # Use validated value
        "timestamp": "now"
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
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
