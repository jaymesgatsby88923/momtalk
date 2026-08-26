from datetime import datetime, timezone

from fastapi import HTTPException

from database.supabase import admin_supabase
from models.journal import JournalCreateRequest, JournalUpdateRequest
from services import user_service


FEELING_MAX = 100
DESCRIPTION_MAX = 500


def _normalize_feeling(feeling: str) -> str:
    normalized = feeling.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Feeling cannot be empty")
    if len(normalized) > FEELING_MAX:
        raise HTTPException(
            status_code=400,
            detail=f"Feeling must be at most {FEELING_MAX} characters",
        )
    return normalized


def _normalize_description(description: str | None) -> str | None:
    if description is None:
        return None

    normalized = description.strip()
    if not normalized:
        return None

    if len(normalized) > DESCRIPTION_MAX:
        raise HTTPException(
            status_code=400,
            detail=f"Description must be at most {DESCRIPTION_MAX} characters",
        )
    return normalized


def _format_entry(row: dict) -> dict:
    return {
        "journal_entry_id": row["journal_entry_id"],
        "feeling": row["feeling"],
        "description": row.get("description"),
        "visibility": row["visibility"],
        "parent_stage": row.get("parent_stage"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _format_feed_item(row: dict) -> dict:
    return {
        "journal_entry_id": row["journal_entry_id"],
        "feeling": row["feeling"],
        "description": row.get("description"),
        "parent_stage": row.get("parent_stage"),
        "created_at": row["created_at"],
    }


def _get_owned_entry(journal_entry_id: str, user_id: str) -> dict:
    result = (
        admin_supabase
        .table("Journal_Entries")
        .select("*")
        .eq("journal_entry_id", journal_entry_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    return result.data


def create_entry(request: JournalCreateRequest, current_user: dict) -> dict:
    feeling = _normalize_feeling(request.feeling)
    description = _normalize_description(request.description)
    now = datetime.now(timezone.utc).isoformat()
    parent_stage = user_service.get_parent_stage_for_user(current_user["user_id"])

    insert_result = (
        admin_supabase
        .table("Journal_Entries")
        .insert({
            "user_id": current_user["user_id"],
            "feeling": feeling,
            "description": description,
            "visibility": request.visibility,
            "parent_stage": parent_stage,
            "created_at": now,
            "updated_at": now,
        })
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create journal entry")

    return _format_entry(insert_result.data[0])


def list_entries(current_user: dict) -> list[dict]:
    result = (
        admin_supabase
        .table("Journal_Entries")
        .select("*")
        .eq("user_id", current_user["user_id"])
        .order("created_at", desc=True)
        .execute()
    )

    return [_format_entry(row) for row in (result.data or [])]


def list_anonymous_feed(current_user: dict) -> list[dict]:
    result = (
        admin_supabase
        .table("Journal_Entries")
        .select("journal_entry_id, feeling, description, parent_stage, created_at")
        .eq("visibility", "anonymous")
        .order("created_at", desc=True)
        .execute()
    )

    return [_format_feed_item(row) for row in (result.data or [])]


def get_entry(journal_entry_id: str, current_user: dict) -> dict:
    entry = _get_owned_entry(journal_entry_id, current_user["user_id"])
    return _format_entry(entry)


def update_entry(
    journal_entry_id: str,
    request: JournalUpdateRequest,
    current_user: dict,
) -> dict:
    entry = _get_owned_entry(journal_entry_id, current_user["user_id"])

    updates: dict = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    if request.feeling is not None:
        updates["feeling"] = _normalize_feeling(request.feeling)

    if request.description is not None:
        updates["description"] = _normalize_description(request.description)

    if request.visibility is not None:
        updates["visibility"] = request.visibility
        if request.visibility == "anonymous" and not entry.get("parent_stage"):
            updates["parent_stage"] = user_service.get_parent_stage_for_user(
                current_user["user_id"]
            )

    if len(updates) == 1:
        return _format_entry(entry)

    update_result = (
        admin_supabase
        .table("Journal_Entries")
        .update(updates)
        .eq("journal_entry_id", journal_entry_id)
        .eq("user_id", current_user["user_id"])
        .execute()
    )

    if not update_result.data:
        raise HTTPException(status_code=500, detail="Failed to update journal entry")

    return _format_entry(update_result.data[0])


def delete_entry(journal_entry_id: str, current_user: dict) -> dict:
    _get_owned_entry(journal_entry_id, current_user["user_id"])

    (
        admin_supabase
        .table("Journal_Entries")
        .delete()
        .eq("journal_entry_id", journal_entry_id)
        .eq("user_id", current_user["user_id"])
        .execute()
    )

    return {"message": "Journal entry deleted"}
