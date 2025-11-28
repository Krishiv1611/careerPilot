from typing import Dict, Any

def job_search_router(state: Dict[str, Any]) -> str:
    """
    Routes to the appropriate job search agent based on state configuration.
    Returns the name of the next node.
    """
    # Check if a search query is present
    if not state.get("search_query"):
        # If no query, we might want to skip search or handle it differently.
        # But usually we default to 'job_search' which handles empty query by returning empty or all jobs.
        # However, the graph logic usually checks this before calling the router or inside the router.
        # Here we just decide WHICH search to use.
        pass

    # If job_id is present, we are analyzing a specific job, so skip search
    if state.get("job_id"):
        return "skip_search"

    # Check if SerpAPI is requested and API key is available
    if state.get("use_serpapi"):
        serpapi_key = state.get("serpapi_api_key")
        if serpapi_key:
            return "serpapi_job_search"
    
    # Default to internal DB search
    return "job_search"
