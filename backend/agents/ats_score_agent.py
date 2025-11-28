from typing import Dict, Any
from services.ats_service import ATSService

def ats_score_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    ATS Score Agent (Gemini)
    Evaluates the resume for general ATS readability, structure, and content quality.
    Returns a score (0-100) and a feedback report.
    """
    resume_text = state.get("resume_text", "")
    google_api_key = state.get("google_api_key")
    
    result = ATSService.calculate_score(resume_text, google_api_key)
    
    return result
