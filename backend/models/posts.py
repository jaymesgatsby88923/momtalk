from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date

class PostCreateRequest(BaseModel): 
    title: str
    content: str
    image_url: Optional[str] = None
    post_type: str
    post_category: str
    user_id: str

class  PostList(BaseModel):
        title: str
        content: str
        post_type: str
        post_category: str
        user_id: str
        test_only: str
class  PostReactionRequest(BaseModel):
    post_id: str
    reaction: str
   