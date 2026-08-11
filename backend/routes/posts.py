from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import HTTPBearer
from services import post_service
from models.posts import PostCreateRequest, PostReactionRequest, CommentCreateRequest   
from dependencies.dependencies import get_current_user


router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)

@router.post("/{post_id}/comments")
def create_comment(
    post_id: str,
    comment_create_request: CommentCreateRequest,
    current_user=Depends(get_current_user),
):
    return post_service.create_comment(post_id, comment_create_request, current_user)

@router.post("/create")
def create_post(post_create_request: PostCreateRequest, current_user = Depends(get_current_user)):
    return post_service.create_post(post_create_request, current_user)
    

@router.get("/for-you")
def list_for_you_posts(current_user = Depends(get_current_user)):
    return post_service.list_for_you(current_user)

@router.get("/popular")
def list_popular_posts(current_user = Depends(get_current_user)):
    return post_service.list_popular(current_user)

@router.get("/latest")
def list_latest_posts(current_user = Depends(get_current_user)):
    return post_service.list_latest(current_user)

@router.get("/detail/{post_id}")
def get_post_detail(post_id: str, current_user = Depends(get_current_user)):
    return post_service.get_post_detail(post_id, current_user)

@router.post("/post-reaction")
def post_reaction(post_reaction_request: PostReactionRequest):
    return post_service.post_reaction(post_reaction_request)

@router.post("/comments/{comment_id}/like")
def like_comment(comment_id: str, current_user=Depends(get_current_user)):
    return post_service.like_comment(comment_id, current_user)

@router.delete("/comments/{comment_id}/like")
def unlike_comment(comment_id: str, current_user=Depends(get_current_user)):
    return post_service.unlike_comment(comment_id, current_user)