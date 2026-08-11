from datetime import date, datetime

from fastapi import HTTPException

from database.supabase import admin_supabase
from models.users import ProfileUpdateRequest


def get_user(user_id: str) -> dict:
    """
    Public user lookup — display_name only.
    Use when you need author identity without loading the full private profile
    (e.g. comment create response, future public profile pages).
    """
    result = (
        admin_supabase
        .table("Users")
        .select("user_id, display_name")
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return result.data[0]


def get_profile(user_id: str) -> dict:
    """
    Private profile for the authenticated user (GET /users/me).
    Includes email and derived parent stage from the Child row.
    """
    user_result = (
        admin_supabase
        .table("Users")
        .select("user_id, display_name, email, parent_type")
        .eq("user_id", user_id)
        .execute()
    )

    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = user_result.data[0]

    child_result = (
        admin_supabase
        .table("Child")
        .select("birth_date, due_date")
        .eq("user_id", user_id)
        .execute()
    )

    child = child_result.data[0] if child_result.data else None

    return {
        "user_id": user["user_id"],
        "display_name": user["display_name"],
        "email": user["email"],
        "parent_type": user.get("parent_type"),
        "parent_stage": _derive_parent_stage(child),
    }


def update_profile(user_id: str, request: ProfileUpdateRequest) -> dict:
    """Update editable profile fields and return the refreshed private profile."""
    display_name = request.display_name.strip()
    if not display_name:
        raise HTTPException(status_code=400, detail="Display name cannot be empty")

    result = (
        admin_supabase
        .table("Users")
        .update({"display_name": display_name})
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return get_profile(user_id)


def _derive_parent_stage(child: dict | None) -> str | None:
    """
    Turn Child dates into a soft UI label — avoids exposing exact dates on profile.
    Returns None when no child row or dates exist.
    """
    if not child:
        return None

    today = date.today()
    birth_date = _parse_date(child.get("birth_date"))
    due_date = _parse_date(child.get("due_date"))

    if birth_date:
        if birth_date > today:
            return "Expecting"

        age_days = (today - birth_date).days
        if age_days <= 90:
            return "Newborn"
        if age_days <= 365:
            return "Infant"
        return "Toddler+"

    if due_date:
        weeks_until_due = (due_date - today).days // 7
        if weeks_until_due < 0:
            return "Recently delivered"
        if weeks_until_due <= 13:
            return "First trimester"
        if weeks_until_due <= 27:
            return "Second trimester"
        return "Third trimester"

    return None


def _parse_date(value) -> date | None:
    if value is None:
        return None

    if isinstance(value, date):
        return value

    if isinstance(value, datetime):
        return value.date()

    if isinstance(value, str):
        return date.fromisoformat(value[:10])

    return None
