from database.supabase import SUPABASE_KEY, SUPABASE_URL, admin_supabase, user_supabase
from models.auth import LoginRequest, LogoutRequest, RefreshRequest, SignUpRequest
from fastapi import HTTPException
from supabase import create_client


def _signup_http_error(exc: Exception) -> HTTPException:
    text = str(exc).lower()
    if any(
        token in text
        for token in (
            "already registered",
            "already been registered",
            "already exists",
            "user already",
            "email_exists",
        )
    ):
        return HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )
    if "password" in text and any(
        token in text for token in ("weak", "least", "characters", "short")
    ):
        return HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters",
        )
    return HTTPException(status_code=400, detail="Could not create account")


def signup(signup_request: SignUpRequest):
    display_name = signup_request.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail="Display name is required")
    if len(display_name) > 50:
        raise HTTPException(
            status_code=400,
            detail="Display name must be 50 characters or less",
        )

    parent_type = (signup_request.parent_type or "").strip() or None

    try:
        result = admin_supabase.auth.sign_up({
            "email": signup_request.email,
            "password": signup_request.password,
        })
    except Exception as exc:
        raise _signup_http_error(exc) from exc

    if result.user is None:
        raise HTTPException(status_code=400, detail="Could not create account")

    auth_user_id = result.user.id

    try:
        response = (
            user_supabase.table("Users")
            .insert({
                "display_name": display_name,
                "parent_type": parent_type,
                "email": signup_request.email,
                "auth_user_id": auth_user_id,
            })
            .execute()
        )
    except Exception as exc:
        raise _signup_http_error(exc) from exc

    if not response.data:
        raise HTTPException(status_code=400, detail="Could not create account")

    user = response.data[0]

    user_supabase.table("Child").insert({
        "user_id": user["user_id"],
        "birth_date": signup_request.birth_date.isoformat() if signup_request.birth_date else None,
        "due_date": signup_request.due_date.isoformat() if signup_request.due_date else None,
    }).execute()

    session = result.session
    return {
        "access_token": session.access_token if session else None,
        "refresh_token": session.refresh_token if session else None,
    }

  
def login(login_request: LoginRequest):

  
    result = admin_supabase.auth.sign_in_with_password({
        "email":login_request.email,
        "password":login_request.password
    }
    )

    if result.session is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    return {
            "access_token":result.session.access_token,
            "refresh_token":result.session.refresh_token
    }


def refresh(body: RefreshRequest):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        result = client.auth.refresh_session(body.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    session = result.session
    if not session or not session.access_token or not session.refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token",
        )

    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }


def logout(body: LogoutRequest):
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    try:
        if body.access_token:
            try:
                client.auth.set_session(body.access_token, body.refresh_token)
            except Exception:
                client.auth.refresh_session(body.refresh_token)
        else:
            client.auth.refresh_session(body.refresh_token)
        client.auth.sign_out()
    except Exception:
        pass
    return {"ok": True}


