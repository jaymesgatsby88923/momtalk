from fastapi import APIRouter, Depends

from dependencies.dependencies import get_current_user
from models.affirmation import AffirmationResponse, SaveAffirmationRequest
from models.journal import JournalCreateRequest, JournalEntryResponse, JournalUpdateRequest
from services import affirmation_service, journal_service

router = APIRouter(
    prefix="/restore",
    tags=["Restore"],
)


@router.get("/affirmation", response_model=AffirmationResponse)
def get_affirmation(current_user=Depends(get_current_user)):
    return affirmation_service.get_affirmation_for_user(current_user["user_id"])


@router.put("/affirmation", response_model=AffirmationResponse)
def save_affirmation(
    request: SaveAffirmationRequest,
    current_user=Depends(get_current_user),
):
    return affirmation_service.save_affirmation(
        current_user["user_id"],
        request.affirmation_id,
    )


@router.post("", response_model=JournalEntryResponse)
def create_journal_entry(
    request: JournalCreateRequest,
    current_user=Depends(get_current_user),
):
    return journal_service.create_entry(request, current_user)


@router.get("", response_model=list[JournalEntryResponse])
def list_journal_entries(current_user=Depends(get_current_user)):
    return journal_service.list_entries(current_user)


@router.get("/{journal_entry_id}", response_model=JournalEntryResponse)
def get_journal_entry(
    journal_entry_id: str,
    current_user=Depends(get_current_user),
):
    return journal_service.get_entry(journal_entry_id, current_user)


@router.patch("/{journal_entry_id}", response_model=JournalEntryResponse)
def update_journal_entry(
    journal_entry_id: str,
    request: JournalUpdateRequest,
    current_user=Depends(get_current_user),
):
    return journal_service.update_entry(journal_entry_id, request, current_user)


@router.delete("/{journal_entry_id}")
def delete_journal_entry(
    journal_entry_id: str,
    current_user=Depends(get_current_user),
):
    return journal_service.delete_entry(journal_entry_id, current_user)
