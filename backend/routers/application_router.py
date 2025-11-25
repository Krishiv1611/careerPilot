# backend/routers/application_router.py

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from models.application_model import Application
from models.database import get_db
from models.schemas import ApplicationResponseModel

from models.user_model import User
from utils.auth import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get("/all", response_model=list[ApplicationResponseModel])
def get_all_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Application).filter(Application.user_id == current_user.id).all()


@router.get("/{application_id}", response_model=ApplicationResponseModel)
def get_application(
    application_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id, Application.user_id == current_user.id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")
    
    return app

@router.delete("/{application_id}")
def delete_application(
    application_id: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == application_id, Application.user_id == current_user.id).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    db.delete(app)
    db.commit()

    return {"message": "Application deleted successfully"}
