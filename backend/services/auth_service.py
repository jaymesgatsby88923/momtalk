from database.supabase import SUPABASE_KEY, SUPABASE_URL, admin_supabase, user_supabase
from models.auth import LoginRequest, LogoutRequest, RefreshRequest, SignUpRequest
from fastapi import HTTPException
from supabase import create_client

def signup(signup_request: SignUpRequest):
  
    
    result = admin_supabase.auth.sign_up({
        "email":signup_request.email,
        "password":signup_request.password
    }
    )

  
    auth_user_id = result.user.id

   
    response = (
        user_supabase.table("Users")
        .insert(
            {
                "display_name":signup_request.display_name,
                "parent_type":signup_request.parent_type,
                "email":signup_request.email,
                "auth_user_id":auth_user_id
            }
        )
        .execute())

  
    user = response.data[0]

    child_response = (
    user_supabase.table("Child")
    .insert({
        "user_id": user["user_id"],
        "birth_date": signup_request.birth_date.isoformat() if signup_request.birth_date else None,
        "due_date": signup_request.due_date.isoformat() if signup_request.due_date else None,
    })
    .execute()
    )

    child = child_response.data[0]

    return {
        "user": user,
        "child": child,
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


