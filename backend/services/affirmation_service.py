from fastapi import HTTPException

from database.supabase import admin_supabase


def get_affirmation_for_user(user_id: str) -> dict:
    user_result = (
        admin_supabase
        .table("Users")
        .select("affirmation_id")
        .eq("user_id", user_id)
        .execute()
    )

    if not user_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    affirmation_id = user_result.data[0].get("affirmation_id")

    if affirmation_id:
        affirmation_result = (
            admin_supabase
            .table("Affirmations")
            .select("affirmation_id, message, subtext")
            .eq("affirmation_id", affirmation_id)
            .maybe_single()
            .execute()
        )
        if affirmation_result.data:
            return affirmation_result.data

    default_result = (
        admin_supabase
        .table("Affirmations")
        .select("affirmation_id, message, subtext")
        .order("created_at", desc=False)
        .limit(1)
        .execute()
    )

    if not default_result.data:
        raise HTTPException(status_code=404, detail="No affirmation found")

    return default_result.data[0]


def save_affirmation(user_id: str, affirmation_id: str) -> dict:
    affirmation_result = (
        admin_supabase
        .table("Affirmations")
        .select("affirmation_id, message, subtext")
        .eq("affirmation_id", affirmation_id)
        .maybe_single()
        .execute()
    )

    if not affirmation_result.data:
        raise HTTPException(status_code=404, detail="Affirmation not found")

    update_result = (
        admin_supabase
        .table("Users")
        .update({"affirmation_id": affirmation_id})
        .eq("user_id", user_id)
        .execute()
    )

    if not update_result.data:
        raise HTTPException(status_code=404, detail="User not found")

    return affirmation_result.data
