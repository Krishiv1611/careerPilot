from typing import Dict, Any, List
from sqlalchemy.orm import Session
import os
import requests
from uuid import uuid4
import json

from models.job_model import Job
from services.job_ingestor import JobIngestor


def serpapi_job_search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    SerpAPI job search agent:
    1. Uses SerpAPI to search for jobs based on search_query
    2. Stores found jobs in database
    3. Returns recommended jobs similar to job_search_agent
    
    Falls back to empty results if API key is missing or request fails.
    """
    
    query = state.get("search_query", "")
    if not query:
        raise ValueError("search_query missing in state")
    
    db: Session = state["db"]
    serpapi_key = state.get("serpapi_api_key")
    
    if not serpapi_key:
        return {
            "recommended_jobs": [],
            "serpapi_error": "SERPAPI_API_KEY not provided. Please provide it in the request to use SerpAPI search."
        }
    
    # SerpAPI job search parameters
    # Note: google_jobs engine might need different parameters
    params = {
        "engine": "google_jobs",
        "q": query,
        "api_key": serpapi_key,
        "num": 20,  # Number of results
        # Remove location restriction to get more results
        # "location": "United States"  # Commented out to get global results
    }
    
    try:
        print(f"[SerpAPI] Searching for: {query}")
        print(f"[SerpAPI] Request URL: https://serpapi.com/search")
        print(f"[SerpAPI] Params: engine={params['engine']}, q={params['q']}, num={params['num']}")
        
        response = requests.get("https://serpapi.com/search", params=params, timeout=30)
        
        # Check HTTP status
        if response.status_code != 200:
            error_detail = f"HTTP {response.status_code}"
            try:
                error_data = response.json()
                if "error" in error_data:
                    error_detail = error_data.get("error", error_detail)
                print(f"[SerpAPI] Error response: {json.dumps(error_data, indent=2)}")
            except:
                error_detail = response.text[:200] if response.text else error_detail
                print(f"[SerpAPI] Error text: {error_detail}")
            
            return {
                "recommended_jobs": [],
                "serpapi_error": f"SerpAPI request failed with status {response.status_code}: {error_detail}"
            }
        
        data = response.json()
        
        # Debug: Print response structure
        print(f"[SerpAPI] Response keys: {list(data.keys())}")
        if "jobs_results" in data:
            print(f"[SerpAPI] Found {len(data.get('jobs_results', []))} jobs in jobs_results")
        if "organic_results" in data:
            print(f"[SerpAPI] Found {len(data.get('organic_results', []))} results in organic_results")
        
        # Check for API errors in response
        if "error" in data:
            error_msg = data.get("error", "Unknown SerpAPI error")
            print(f"[SerpAPI] API Error: {error_msg}")
            
            # Provide helpful message for "no results" error
            if "hasn't returned any results" in error_msg.lower():
                return {
                    "recommended_jobs": [],
                    "serpapi_warning": f"No jobs found for '{query}'. Try a simpler or broader search term (e.g., 'Software Engineer' instead of listing all technologies)."
                }
            
            return {
                "recommended_jobs": [],
                "serpapi_error": f"SerpAPI returned an error: {error_msg}"
            }
        
        # Extract jobs from SerpAPI response
        # Try different possible response structures
        jobs_results = data.get("jobs_results", [])
        
        # If no jobs_results, try alternative structure
        if not jobs_results:
            jobs_results = data.get("organic_results", [])
        
        # Also check for "jobs" key (some SerpAPI responses use this)
        if not jobs_results and "jobs" in data:
            jobs_data = data.get("jobs", {})
            if isinstance(jobs_data, dict):
                jobs_results = jobs_data.get("results", [])
            elif isinstance(jobs_data, list):
                jobs_results = jobs_data
        
        if not jobs_results:
            # Log the full response structure for debugging
            print(f"[SerpAPI] No jobs found. Full response structure:")
            print(f"[SerpAPI] Top-level keys: {list(data.keys())}")
            if "search_information" in data:
                search_info = data.get("search_information", {})
                print(f"[SerpAPI] Search info: {search_info}")
            
            # Try to find any job-related keys
            job_keys = [k for k in data.keys() if 'job' in k.lower()]
            print(f"[SerpAPI] Job-related keys found: {job_keys}")
            
            return {
                "recommended_jobs": [],
                "serpapi_warning": f"No jobs found for query '{query}'. Response structure: {list(data.keys())[:10]}"
            }
        
        print(f"[SerpAPI] Processing {len(jobs_results)} job results")
        
        recommended_jobs = []
        job_ingestor = JobIngestor()
        
        for idx, job_data in enumerate(jobs_results):
            try:
                # Debug first job structure
                if idx == 0:
                    print(f"[SerpAPI] First job data keys: {list(job_data.keys())}")
                    print(f"[SerpAPI] First job sample: {json.dumps(job_data, indent=2)[:500]}")
                
                # Extract job information - handle different response formats
                job_id = str(uuid4())
                
                # Try different field names that SerpAPI might use
                title = job_data.get("title") or job_data.get("job_title") or job_data.get("name", "")
                company = job_data.get("company_name") or job_data.get("company") or job_data.get("company_name", "")
                location = job_data.get("location") or job_data.get("location_name", "")
                
                # Description might be in different fields
                description = (
                    job_data.get("description") or 
                    job_data.get("snippet") or 
                    job_data.get("job_highlights") or
                    job_data.get("description_snippet", "")
                )
                
                # If description is a list (job highlights), join them
                if isinstance(description, list):
                    description = "\n".join([str(item) for item in description])
                
                job_type = job_data.get("schedule_type") or job_data.get("job_type") or job_data.get("employment_type", "")
                
                # Skip if essential fields are missing
                if not title or not company:
                    print(f"[SerpAPI] Skipping job {idx}: missing title or company. Title: {title}, Company: {company}")
                    continue
                
                # Get apply URL - try different structures
                apply_url = None
                if job_data.get("apply_options"):
                    apply_options = job_data.get("apply_options", [])
                    if isinstance(apply_options, list) and len(apply_options) > 0:
                        apply_url = apply_options[0].get("link", "")
                elif job_data.get("link"):
                    apply_url = job_data.get("link")
                elif job_data.get("apply_link"):
                    apply_url = job_data.get("apply_link")
                
                # Check if job already exists (by title and company)
                existing_job = db.query(Job).filter(
                    Job.title == title,
                    Job.company == company
                ).first()

                if existing_job:
                    print(f"[SerpAPI] Job already exists: {title} at {company} (ID: {existing_job.id})")
                    job_id = existing_job.id
                    # Optional: Update existing job fields if needed
                else:
                    # Create job record in database
                    job_record = Job(
                        id=job_id,
                        title=title,
                        company=company,
                        location=location,
                        description=str(description) if description else "",
                        employment_type=job_type,
                        url=apply_url
                    )
                    
                    db.add(job_record)
                    db.commit()
                    db.refresh(job_record)
                    
                    # Ingest job description into vector store (only for new jobs)
                    if description:
                        try:
                            job_ingestor.ingest_job(job_id, str(description))
                        except Exception as e:
                            print(f"Warning: Failed to ingest job {job_id}: {str(e)}")
                
                # Format for response
                recommended_jobs.append({
                    "id": job_id,
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": str(description)[:500] if description else "",  # Truncate for response
                    "score": 1.0  # SerpAPI results are already ranked
                })
                
                print(f"[SerpAPI] Successfully processed job {idx+1}: {title} at {company}")
                
            except Exception as e:
                print(f"Warning: Failed to process job {idx}: {str(e)}")
                import traceback
                print(traceback.format_exc())
                continue
        
        if not recommended_jobs:
            return {
                "recommended_jobs": [],
                "serpapi_warning": "SerpAPI returned results but none could be processed. Check the response format."
            }
        
        print(f"[SerpAPI] Successfully processed {len(recommended_jobs)} jobs")
        return {"recommended_jobs": recommended_jobs}
        
    except requests.exceptions.Timeout:
        return {
            "recommended_jobs": [],
            "serpapi_error": "SerpAPI request timed out. Please try again later."
        }
    except requests.exceptions.RequestException as e:
        return {
            "recommended_jobs": [],
            "serpapi_error": f"SerpAPI request failed: {str(e)}"
        }
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"SerpAPI agent error: {error_trace}")
        return {
            "recommended_jobs": [],
            "serpapi_error": f"Error processing SerpAPI results: {str(e)}"
        }
