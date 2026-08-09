from database.supabase import admin_supabase
from models.posts import PostReactionRequest, PostCreateRequest
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException
from datetime import datetime


def list_for_you(current_user):
    result = (
        admin_supabase
        .table("Posts")
        .select("""
            post_id,
            title,
            content,
            created_at,
            user_id,
            im_here,
            me_too,
            love_this,
            community_id,
            Communities(name),
            Comments(count),
            Users(display_name)
        """)
        .eq("test_only", "for you")
        .execute()
    )

    posts = result.data

    # Clean up response — Supabase returns embedded table as "Comments"
    for post in posts:
        comments = post.get("Comments") or []
        post["comment_count"] = comments[0]["count"] if comments else 0
        post.pop("Comments", None)

        community = post.pop("Communities", None)
        post["community_name"] = community["name"] if community else None

        user = post.pop("Users", None)
        post["display_name"] = user["display_name"] if user else None

    return posts

def list_popular(current_user):
    result = (
        admin_supabase
        .table("Posts")
        .select("""
            post_id,
            title,
            content,
            created_at,
            user_id,
            im_here,
            me_too,
            love_this,
            community_id,
            Communities(name),
            Comments(count),
            Users(display_name)
        """)
        .eq("test_only", "popular")
        .execute()
    )

    posts = result.data

    # Clean up response — Supabase returns embedded table as "Comments"
    
    for post in posts:
        comments = post.get("Comments") or []
        post["comment_count"] = comments[0]["count"] if comments else 0
        post.pop("Comments", None)

        community = post.pop("Communities", None)
        post["community_name"] = community["name"] if community else None

        user = post.pop("Users", None)
        post["display_name"] = user["display_name"] if user else None

    return posts

def list_latest(current_user):
    result = (
        admin_supabase
        .table("Posts")
        .select("""
            post_id,
            title,
            content,
            created_at,
            user_id,
            im_here,
            me_too,
            love_this,
            image_url,
            community_id,
            Communities(name),
            Comments(count),
            Users(display_name)
        """)
        .eq("test_only", "latest")
        .execute()
    )

    posts = result.data

    for post in posts:
        comments = post.get("Comments") or []
        post["comment_count"] = comments[0]["count"] if comments else 0
        post.pop("Comments", None)

        community = post.pop("Communities", None)
        post["community_name"] = community["name"] if community else None

        user = post.pop("Users", None)
        post["display_name"] = user["display_name"] if user else None

    return posts

def post_reaction(post_reaction_request: PostReactionRequest):
    result = (
        admin_supabase
        .table("Posts")
        .update({
            "post_id": post_reaction_request.post_id,
             post_reaction_request.reaction.replace("post-", "_"): post_reaction_request.reaction + 1 ,
        })
        .execute()
    ) 
    return result.data

def get_post_detail(post_id: str, current_user):
    result = (
        admin_supabase
        .table("Posts")
        .select("*")
        .eq("id", post_id)
        .execute()
    ) 
    return result.data

def create_post(post_create_request: PostCreateRequest, current_user):
    result = (
        admin_supabase
        .table("Posts")
        .insert({
            "title": post_create_request.title,
            "content": post_create_request.content,
            "image_url": post_create_request.image_url,
            "post_type": post_create_request.post_type,
            "post_category": post_create_request.post_category,
            "user_id": current_user["user_id"],
        })
        .execute()
    ) 
    return result.data

    