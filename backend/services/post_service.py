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
def like_comment(comment_id: str, current_user: dict) -> dict:
    return set_comment_like(comment_id, active=True, current_user=current_user)


def unlike_comment(comment_id: str, current_user: dict) -> dict:
    return set_comment_like(comment_id, active=False, current_user=current_user)
    
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
            Users(display_name),
            Comments(
                comment_id,
                content,
                created_at,
                user_id,
                Users(display_name)
            )
        """)
        .eq("post_id", post_id)
        .order("created_at", foreign_table="Comments", desc=False)
        .single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = result.data
    # flatten Communities / Users like list_for_you does
    # pull Comments out into post["comments"]
    return post

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

def set_comment_like(comment_id: str, active: bool, current_user: dict) -> dict:
    user_id = current_user["user_id"]

    # 1. Get the comment (404 if missing) + current like count
    comment_result = (
        admin_supabase
        .table("Comments")
        .select("comment_id, like")
        .eq("comment_id", comment_id)
        .execute()
    )
    if not comment_result.data:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = comment_result.data[0]
    like_count = comment["like"]

    # 2. Does this user already have a reaction row?
    reaction_result = (
        admin_supabase
        .table("User_Reaction")
        .select("reaction_id, active")
        .eq("user_id", user_id)
        .eq("comment_id", comment_id)
        .eq("reaction_type", "like")
        .execute()
    )
    existing = reaction_result.data[0] if reaction_result.data else None
    currently_liked = existing["active"] if existing else False

    # 3. Already in the desired state? Do nothing (prevents double-like)
    if active == currently_liked:
        return {
            "comment_id": comment_id,
            "like_count": like_count,
            "liked_by_me": currently_liked,
        }

    # 4. Update User_Reaction
    if existing:
        admin_supabase.table("User_Reaction").update({"active": active}).eq(
            "reaction_id", existing["reaction_id"]
        ).execute()
    elif active:
        admin_supabase.table("User_Reaction").insert({
            "user_id": user_id,
            "comment_id": comment_id,
            "post_id": None,
            "reaction_type": "like",
            "active": True,
        }).execute()
    # elif not active and no row: nothing to do (handled by step 3)

    # 5. Update count on Comments (+1 or -1, never below 0)
    new_count = like_count + 1 if active else max(0, like_count - 1)
    admin_supabase.table("Comments").update({"like": new_count}).eq(
        "comment_id", comment_id
    ).execute()

    return {
        "comment_id": comment_id,
        "like_count": new_count,
        "liked_by_me": active,
    }


