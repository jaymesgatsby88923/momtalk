from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import HTTPBearer
from services import community_service
from models.communities import Community
from dependencies.dependencies import get_current_user


router = APIRouter(
    prefix="/communities",
    tags=["Communities"])

@router.get("/list")
def list_communities(community_list_request: Community, current_user = Depends(get_current_user)):
    return community_service.list_communities(community_list_request, current_user)

@router.get("/detail/{community_id}")
def get_community_detail(community_id: str, current_user = Depends(get_current_user)):
    return community_service.get_community_detail(community_id, current_user)

#@router.post("/create")
#def create_community(community_create_request: CommunityCreateRequest, current_user = Depends(get_current_user)):
#    return community_service.create_community(community_create_request, current_user)

@router.post("/join")
def join_community(community_join_request: Community, current_user = Depends(get_current_user)):
    return community_service.join_community(community_join_request, current_user)

@router.patch("/leave")
def leave_community(community_leave_request: Community, current_user = Depends(get_current_user)):
    return community_service.leave_community(community_leave_request, current_user)