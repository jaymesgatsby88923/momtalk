from fastapi import APIRouter, Depends

from dependencies.dependencies import get_current_user
from models.users import ProfileResponse, ProfileUpdateRequest, UserResponse
from services import user_service

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(current_user=Depends(get_current_user)):
    """Private profile for the logged-in user."""
    return user_service.get_profile(current_user["user_id"])


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    request: ProfileUpdateRequest,
    current_user=Depends(get_current_user),
):
    """V1: edit display name. Returns the full updated profile."""
    return user_service.update_profile(current_user["user_id"], request)


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str, current_user=Depends(get_current_user)):
    """
    Public user lookup — display_name only.
    Auth required for now; opens the door to public profile pages later.
    """
    return user_service.get_user(user_id)
