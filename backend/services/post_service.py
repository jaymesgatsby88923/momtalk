from database.supabase import admin_supabase
from models.posts import PostReactionRequest, PostCreateRequest
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException
from datetime import datetime


def like_comment(comment_id: str, current_user: dict) -> dict:
    return set_comment_like(comment_id, active=True, current_user=current_user)


def unlike_comment(comment_id: str, current_user: dict) -> dict:
    return set_comment_like(comment_id, active=False, current_user=current_user)


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
                likes,
                parent_comment,
                Users(display_name)
            )
        """)
        .eq("post_id", post_id)
        .order("created_at", foreign_table="Comments", desc=False)
        .maybe_single()
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = result.data

    community = post.pop("Communities", None)
    post["community_name"] = community["name"] if community else None

    user = post.pop("Users", None)
    post["display_name"] = user["display_name"] if user else None

    raw_comments = post.pop("Comments", None) or []
    comment_ids = [c["comment_id"] for c in raw_comments]

    liked_comment_ids = set()
    if comment_ids:
        user_id = current_user["user_id"]
        reaction_result = (
            admin_supabase
            .table("User_Reaction")
            .select("comment_id")
            .eq("user_id", user_id)
            .eq("reaction_type", "like")
            .eq("active", True)
            .in_("comment_id", comment_ids)
            .execute()
        )
        liked_comment_ids = {
            r["comment_id"] for r in (reaction_result.data or [])
        }

    post["comments"] = [
        {
            "comment_id": c["comment_id"],
            "content": c["content"],
            "created_at": c.get("created_at"),
            "user_id": c.get("user_id"),
            "parent_comment": c.get("parent_comment"),
            "display_name": (c.pop("Users") or {}).get("display_name"),
            "like_count": c.get("likes") or 0,
            "liked_by_me": c["comment_id"] in liked_comment_ids,
        }
        for c in raw_comments
    ]

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
        .select("comment_id, likes")
        .eq("comment_id", comment_id)
        .execute()
    )
    if not comment_result.data:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = comment_result.data[0]
    like_count = comment["likes"]

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
    admin_supabase.table("Comments").update({"likes": new_count}).eq(
        "comment_id", comment_id
    ).execute()

    return {
        "comment_id": comment_id,
        "like_count": new_count,
        "liked_by_me": active,
    }


