from database.supabase import admin_supabase
from models.communities import Community
from fastapi.security import HTTPBearer
from fastapi import Depends, HTTPException
from datetime import datetime



def list_communities(current_user_id: str):
    # Step 1: get all communities
    communities_response = admin_supabase.table("Communities") \
        .select("community_id, name, description") \
        .execute()

    communities = communities_response.data

    # Step 2: get communities the user has joined
    user_communities_response = admin_supabase.table("User_Community") \
        .select("community_id") \
        .eq("user_id", current_user_id) \
        .eq("active", True) \
        .execute()

    joined_community_ids = {
        user_community["community_id"]
        for user_community in user_communities_response.data
    }

    # Step 3: merge results
    result = []
    for community in communities:
        result.append({
            "community_id": community["community_id"],
            "name": community["name"],
            "description": community["description"],
            "is_joined": community["community_id"] in joined_community_ids
        })

    return result

def get_community_detail(community_id: str, current_user_id: str):
    community_response = (
        admin_supabase.table("Communities")
        .select("community_id, name, description")
        .eq("community_id", community_id)
        .execute()
    )

    if not community_response.data:
        raise HTTPException(status_code=404, detail="Community not found")

    community = community_response.data[0]

    posts_response = (
        admin_supabase.table("Posts")
        .select("""
            post_id,
            title,
            content,
            created_at,
            user_id,
            community_id,
            im_here,
            me_too,
            love_this,
            Comments(count),
            Users(display_name)
        """)
        .eq("community_id", community_id)
        .order("created_at", desc=True)
        .execute()
    )

    posts = []
    for post in posts_response.data:
        comments = post.get("Comments") or []
        post["comment_count"] = comments[0]["count"] if comments else 0
        post.pop("Comments", None)

        user = post.pop("Users", None)
        post["display_name"] = user["display_name"] if user else None

        posts.append(post)

    return {
        "community": community,
        "posts": posts,
    }

def join_community(community: Community, current_user_profile: object):
    admin_supabase.table("User_Community") \
        .insert({
            "user_id": current_user_profile["user_id"],
            "community_id": community.community_id
        }) \
        .execute()

    return {
        "message": "Joined community successfully"
    }

def leave_community(community: Community, current_user_profile: object):
    admin_supabase.table("User_Community") \
        .update({"active": False}) \
        .eq("user_id", current_user_profile["user_id"]) \
        .eq("community_id", community.community_id) \
        .execute()

    return {
        "message": "Left community successfully"
    }