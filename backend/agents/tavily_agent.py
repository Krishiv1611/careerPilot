from typing import Dict, Any, List
from sqlalchemy.orm import Session
from uuid import uuid4
import json
from tavily import TavilyClient

from models.job_model import Job
from services.job_ingestor import JobIngestor

def tavily_job_search_agent(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tavily job search agent:
    1. Uses Tavily API to search for jobs based on search_query
    2. Stores found jobs in database
    3. Returns recommended jobs similar to job_search_agent
    """
    
    raw_query = state.get("search_query", "")
    if not raw_query:
        raise ValueError("search_query missing in state")
    
    # Append 'jobs' to the query if not present to ensure we find listings, not just definitions
    if "job" not in raw_query.lower() and "career" not in raw_query.lower() and "opening" not in raw_query.lower():
        query = f"{raw_query} jobs"
    else:
        query = raw_query
    
    db: Session = state["db"]
    tavily_key = state.get("tavily_api_key")
    
    if not tavily_key:
        return {
            "recommended_jobs": [],
            "tavily_error": "TAVILY_API_KEY not provided."
        }
    
    try:
        print(f"[Tavily] Searching for: {query}")
        client = TavilyClient(api_key=tavily_key)
        
        # Tavily search
        response = client.search(query, search_depth="advanced", max_results=10)
        
        results = response.get("results", [])
        if not results:
             return {
                "recommended_jobs": [],
                "tavily_warning": f"No jobs found for '{query}' via Tavily."
            }

        print(f"[Tavily] Found {len(results)} results")
        
        recommended_jobs = []
        job_ingestor = JobIngestor()
        
        for idx, result in enumerate(results):
            try:
                job_id = str(uuid4())
                title = result.get("title", "Unknown Job")
                url = result.get("url", "")
                content = result.get("content", "")
                
                # Tavily returns generic content, so we treat it as description
                # We might not get company/location explicitly, so we leave them generic or try to extract
                company = "Unknown Company" # Tavily doesn't always separate this
                location = "Unknown Location"
                
                # Check if job already exists (by url)
                existing_job = db.query(Job).filter(Job.url == url).first()

                if existing_job:
                    print(f"[Tavily] Job already exists: {title} (ID: {existing_job.id})")
                    job_id = existing_job.id
                else:
                    # Create job record
                    job_record = Job(
                        id=job_id,
                        title=title,
                        company=company, 
                        location=location,
                        description=content[:5000], # Limit length
                        url=url,
                        source="Tavily" # Mark source
                    )
                    
                    db.add(job_record)
                    db.commit()
                    db.refresh(job_record)
                    
                    # Ingest
                    if content:
                        try:
                            job_ingestor.ingest_job(job_id, content)
                        except Exception as e:
                            print(f"Warning: Failed to ingest job {job_id}: {str(e)}")
                
                recommended_jobs.append({
                    "id": job_id,
                    "title": title,
                    "company": company,
                    "location": location,
                    "description": content[:500],
                    "score": result.get("score", 1.0),
                    "url": url,
                    "source": "Tavily"
                })
                
            except Exception as e:
                print(f"Warning: Failed to process Tavily result {idx}: {str(e)}")
                continue
        
        return {"recommended_jobs": recommended_jobs}

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {
            "recommended_jobs": [],
            "tavily_error": f"Tavily search failed: {str(e)}"
        }
