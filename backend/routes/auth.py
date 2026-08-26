from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import HTTPBearer
from services import auth_service, user_service
from models.auth import LoginRequest, LogoutRequest, RefreshRequest, SignUpRequest, SignUpResponse
from dependencies.dependencies import get_current_user


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/login")
def login(login_request: LoginRequest):
    return auth_service.login(login_request)


@router.post("/signup", response_model=SignUpResponse)
def signup(signup_request: SignUpRequest):
    return auth_service.signup(signup_request)


@router.post("/refresh")
def refresh(body: RefreshRequest):
    return auth_service.refresh(body)


@router.post("/logout")
def logout(body: LogoutRequest):
    return auth_service.logout(body)

@router.get("/current-user")
def current_user(current_user=Depends(get_current_user)):
    # Kept for backward compatibility — prefer GET /users/me for new clients.
    profile = user_service.get_profile(current_user["user_id"])
    return {
        "first_name": profile["display_name"],
        "display_name": profile["display_name"],
        "email": profile["email"],
        "parent_type": profile.get("parent_type"),
        "parent_stage": profile.get("parent_stage"),
    }
