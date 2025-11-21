# backend/routers/application_router.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from models.application_model import Application
from models.database import get_db
from models.schemas import ApplicationResponseModel

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/all", response_model=list[ApplicationResponseModel])
def get_all_applications(db: Session = Depends(get_db)):
    return db.query(Application).all()


@router.get("/{application_id}", response_model=ApplicationResponseModel)
def get_application(application_id: str, db: Session = Depends(get_db)):
    app = db.query(Application).filter(Application.id == application_id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    return app
