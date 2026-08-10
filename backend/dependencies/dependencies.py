from database.supabase import admin_supabase, user_supabase
from models.auth import LoginRequest, SignUpRequest
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException

security = HTTPBearer()

def get_current_user(credentials = Depends(security)):

    token = credentials.credentials
    try:
     user = admin_supabase.auth.get_user(token)
    
    except Exception:
        raise HTTPException(
        status_code=401,
        detail="Invalid or expired token"
    )
   
    auth_user_id = user.user.id

    response = (
        user_supabase
        .table("Users")
        .select("*")
        .eq("auth_user_id", auth_user_id)
        .execute()
    )

   
    if not response.data:
        raise HTTPException(status_code=404, detail="User profile not found")
  
    return response.data[0]








