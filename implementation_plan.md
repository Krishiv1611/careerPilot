# Implementation Plan - Integrate Tavily Search API

The goal is to add Tavily as an alternative or additional search provider for finding jobs.

## User Review Required
> [!NOTE]
> I will add `tavily-python` to `requirements.txt`.
> I will update the frontend to allow selecting "Search Online" which will use either SerpAPI, Tavily, or both depending on available keys.

## Proposed Changes

### Backend Dependencies
#### [MODIFY] [requirements.txt](file:///d:/projects/careerPilot/backend/requirements.txt)
- Add `tavily-python`.

### Backend Models
#### [MODIFY] [schemas.py](file:///d:/projects/careerPilot/backend/models/schemas.py)
- Update `CareerPilotRequest` to include `tavily_api_key` (Optional) and `use_tavily` (Optional).

### Backend Agents
#### [NEW] [tavily_agent.py](file:///d:/projects/careerPilot/backend/agents/tavily_agent.py)
- Implement `tavily_search_agent` function.
- Use `TavilyClient` to search for jobs.
- Normalize results to match the `Job` model and `recommended_jobs` format.

#### [MODIFY] [graph.py](file:///d:/projects/careerPilot/backend/agents/graph.py)
- Add `tavily_search` node.
- Update `route_to_search` logic to call Tavily if enabled.
- Update `combine_results` logic (if necessary) or ensure the state handles multiple search results.

### Backend Router
#### [MODIFY] [careerpilot_router.py](file:///d:/projects/careerPilot/backend/routers/careerpilot_router.py)
- Extract `tavily_api_key` from request.
- Pass it to the graph state.

### Frontend
#### [MODIFY] [CareerPilot.jsx](file:///d:/projects/careerPilot/frontend/src/pages/CareerPilot.jsx)
- Change "Use SerpAPI" checkbox to "Search Online".
- Add input for Tavily API Key in the settings/header (or just use the one from env/local storage).
- Update `handleSearch` to send `use_tavily` flag.

#### [MODIFY] [api.js](file:///d:/projects/careerPilot/frontend/src/services/api.js)
- Ensure `runCareerPilot` payload includes new fields.

## Verification Plan
### Automated Tests
- None.

### Manual Verification
1.  **Backend**: Start server.
2.  **Frontend**: Open app.
3.  **Configure**: Enter Tavily API Key (or use env).
4.  **Search**: Check "Search Online" and run a search.
5.  **Verify**: Check logs to see Tavily agent running and results appearing.
