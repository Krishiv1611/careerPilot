# backend/routers/settings_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from models.database import get_db
from models.schemas import APIKeysUpdate, APIKeysStatus
from models.user_model import User
from utils.auth import get_current_user
from utils.encryption import encrypt_api_key, decrypt_api_key

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.post("/api-keys")
async def save_api_keys(
    keys: APIKeysUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Save or update user's API keys.
    NOTE: API keys are now managed client-side. This endpoint is deprecated for DB storage.
    """
    # We no longer store keys in the DB.
    # Logic removed to prevent errors with missing columns.
    
    return {
        "message": "API keys are now managed client-side. No changes saved to DB.",
        "has_google_key": False,
        "has_serpapi_key": False
    }


@router.get("/api-keys/status", response_model=APIKeysStatus)
async def get_api_keys_status(
    current_user: User = Depends(get_current_user)
):
    """
    Check which API keys are configured.
    Always returns False as keys are not stored in DB anymore.
    """
    return APIKeysStatus(
        has_google_key=False,
        has_serpapi_key=False
    )


@router.delete("/api-keys/{key_type}")
async def delete_api_key(
    key_type: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a specific API key.
    No-op as keys are not stored.
    """
    return {"message": f"{key_type} API key deleted successfully (client-side only)"}
