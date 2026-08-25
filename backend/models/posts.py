from pydantic import BaseModel
from typing import Literal, Optional


ReactionType = Literal["im_here", "me_too", "you_got_this", "love_this"]


class PostCreateRequest(BaseModel):
    title: str
    content: str
    image_url: Optional[str] = None
    post_type: str
    post_category: str
    user_id: Optional[str] = None
    community_id: Optional[str] = None


class PostList(BaseModel):
    title: str
    content: str
    post_type: str
    post_category: str
    user_id: str
    test_only: str
    comment_count: int


class PostReactionRequest(BaseModel):
    reaction: ReactionType


class PostReactionResponse(BaseModel):
    post_id: str
    im_here: int
    me_too: int
    you_got_this: int
    love_this: int
    my_reaction: Optional[ReactionType] = None


class CommentCreateRequest(BaseModel):
    content: str
    parent_comment_id: Optional[str] = None
