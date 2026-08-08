from database.supabase import admin_supabase
from models.posts import PostReactionRequest, PostCreateRequest
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException
from datetime import datetime


def list_for_you(current_user):

    result = (
        admin_supabase
        .table("Post")
        .select("*")
        .eq("test_only", "for you")
        .execute()
    ) 
    return result.data

def list_popular(current_user):
    result = (
        admin_supabase
        .table("Post")
        .select("*")
        .eq("test_only", "popular")
        .execute()
    ) 
    return result.data

def list_latest(current_user):
    result = (
        admin_supabase
        .table("Post")
        .select("*")
        .eq("test_only", "latest")
        .execute()
    ) 
    return result.data

def post_reaction(post_reaction_request: PostReactionRequest):
    result = (
        admin_supabase
        .table("Post")
        .update({
            "post_id": post_reaction_request.post_id,
             post_reaction_request.reaction: post_reaction_request.reaction + 1 ,
        })
        .execute()
    ) 
    return result.data

def get_post_detail(post_id: str, current_user):
    result = (
        admin_supabase
        .table("Post")
        .select("*")
        .eq("id", post_id)
        .execute()
    ) 
    return result.data

def create_post(post_create_request: PostCreateRequest, current_user):
    result = (
        admin_supabase
        .table("Post")
        .insert({
            "title": post_create_request.title,
            "content": post_create_request.content,
            "image_url": post_create_request.image_url,
            "post_type": post_create_request.post_type,
            "post_category": post_create_request.post_category,
            "user_id": current_user.id
        })
        .execute()
    ) 
    return result.data