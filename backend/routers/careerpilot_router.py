# backend/routers/careerpilot_router.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models.database import get_db
from models.schemas import CareerPilotRequest, CareerPilotResponse
from agents.graph import build_careerpilot_graph

router = APIRouter(prefix="/careerpilot", tags=["CareerPilot"])


@router.post("/analyze", response_model=CareerPilotResponse)
def analyze(request: CareerPilotRequest, db: Session = Depends(get_db)):

    graph = build_careerpilot_graph()

    initial_state = {
        "db": db,
        "resume_id": request.resume_id,
        "job_id": request.job_id,
        "search_query": request.search_query,
        "timestamp": "now"
    }

    final_state = graph.invoke(initial_state)

    return final_state
