from database.supabase import admin_supabase
from models.posts import PostReactionRequest, PostCreateRequest, CommentCreateRequest
from services import user_service
from fastapi import HTTPException
from datetime import datetime, timedelta, timezone

REACTION_TYPES = ("im_here", "me_too", "you_got_this", "love_this")


def like_comment(comment_id: str, current_user: dict) -> dict:
    return set_comment_like(comment_id, active=True, current_user=current_user)


def unlike_comment(comment_id: str, current_user: dict) -> dict:
    return set_comment_like(comment_id, active=False, current_user=current_user)

def create_comment(
    post_id: str,
    request: CommentCreateRequest,
    current_user: dict,
) -> dict:
    content = request.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    # 1. Post must exist
    post_result = (
        admin_supabase
        .table("Posts")
        .select("post_id")
        .eq("post_id", post_id)
        .execute()
    )
    if not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    parent_comment_id = request.parent_comment_id

    # 2. If reply, parent must exist on same post
    if parent_comment_id:
        parent_result = (
            admin_supabase
            .table("Comments")
            .select("comment_id, post_id")
            .eq("comment_id", parent_comment_id)
            .execute()
        )
        if not parent_result.data:
            raise HTTPException(status_code=404, detail="Parent comment not found")

        if parent_result.data[0]["post_id"] != post_id:
            raise HTTPException(status_code=400, detail="Parent comment is not on this post")

    # 3. Insert
    insert_result = (
        admin_supabase
        .table("Comments")
        .insert({
            "post_id": post_id,
            "user_id": current_user["user_id"],
            "content": content,
            "parent_comment_id": parent_comment_id,
            "likes": 0,
        })
        .execute()
    )

    if not insert_result.data:
        raise HTTPException(status_code=500, detail="Failed to create comment")

    comment = insert_result.data[0]

    # 4. Return same shape as get_post_detail comments.
    # Use user_service.get_user so display_name comes from the users domain,
    # not from the auth dependency (which may only carry user_id later).
    author = user_service.get_user(current_user["user_id"])

    return {
        "comment_id": comment["comment_id"],
        "content": comment["content"],
        "created_at": comment["created_at"],
        "user_id": comment["user_id"],
        "parent_comment_id": comment.get("parent_comment_id"),
        "display_name": author["display_name"],
        "like_count": 0,
        "liked_by_me": False,
    }

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
            you_got_this,
            love_this,
            community_id,
            Communities(name),
            Comments(count),
            Users(display_name)
        """)
        .eq("test_only", "for you")
        .execute()
    )

    posts = [_normalize_feed_post(post) for post in (result.data or [])]
    return attach_my_reactions(posts, current_user["user_id"])

POPULAR_WINDOW_DAYS = 14
POPULAR_CANDIDATE_LIMIT = 200
POPULAR_RETURN_LIMIT = 50
POPULAR_GRAVITY = 1.5

POPULAR_WEIGHTS = {
    "im_here": 2,
    "me_too": 2,
    "you_got_this": 2,
    "love_this": 1,
    "comment_count": 4,
}


def _parse_created_at(created_at: str) -> datetime:
    if created_at.endswith("Z"):
        created_at = created_at.replace("Z", "+00:00")
    return datetime.fromisoformat(created_at)


def _normalize_feed_post(post: dict) -> dict:
    comments = post.get("Comments") or []
    post["comment_count"] = comments[0]["count"] if comments else 0
    post.pop("Comments", None)

    community = post.pop("Communities", None)
    post["community_name"] = community["name"] if community else None

    user = post.pop("Users", None)
    post["display_name"] = user["display_name"] if user else None

    for key in REACTION_TYPES:
        post[key] = post.get(key) or 0

    post["my_reaction"] = None
    return post


def attach_my_reactions(posts: list[dict], user_id: str) -> list[dict]:
    for post in posts:
        post["my_reaction"] = None
        for key in REACTION_TYPES:
            post[key] = post.get(key) or 0

    post_ids = [post["post_id"] for post in posts if post.get("post_id")]
    if not post_ids or not user_id:
        return posts

    result = (
        admin_supabase
        .table("User_Reaction")
        .select("post_id, reaction_type")
        .eq("user_id", user_id)
        .eq("active", True)
        .in_("post_id", post_ids)
        .execute()
    )

    by_post = {
        row["post_id"]: row["reaction_type"]
        for row in (result.data or [])
        if row.get("post_id") and row.get("reaction_type") in REACTION_TYPES
    }

    for post in posts:
        post["my_reaction"] = by_post.get(post["post_id"])

    return posts


def _popular_score(post: dict, now: datetime) -> float:
    engagement = (
        POPULAR_WEIGHTS["im_here"] * (post.get("im_here") or 0)
        + POPULAR_WEIGHTS["me_too"] * (post.get("me_too") or 0)
        + POPULAR_WEIGHTS["you_got_this"] * (post.get("you_got_this") or 0)
        + POPULAR_WEIGHTS["love_this"] * (post.get("love_this") or 0)
        + POPULAR_WEIGHTS["comment_count"] * (post.get("comment_count") or 0)
    )

    created_at = _parse_created_at(post["created_at"])
    age_hours = max((now - created_at).total_seconds() / 3600, 0.5)

    return engagement / ((age_hours + 2) ** POPULAR_GRAVITY)


def list_popular(current_user):
    now = datetime.now(timezone.utc)
    cutoff = (now - timedelta(days=POPULAR_WINDOW_DAYS)).isoformat()

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
            you_got_this,
            love_this,
            community_id,
            Communities(name),
            Comments(count),
            Users(display_name)
        """)
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .limit(POPULAR_CANDIDATE_LIMIT)
        .execute()
    )

    posts = [_normalize_feed_post(post) for post in (result.data or [])]

    posts.sort(
        key=lambda post: (
            _popular_score(post, now),
            _parse_created_at(post["created_at"]),
        ),
        reverse=True,
    )

    return attach_my_reactions(posts[:POPULAR_RETURN_LIMIT], current_user["user_id"])

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
            you_got_this,
            love_this,
            image_url,
            community_id,
            Communities(name),
            Comments(count),
            Users(display_name)
        """)
        .order("created_at", desc=True)
        .execute()
    )

    posts = [_normalize_feed_post(post) for post in (result.data or [])]
    return attach_my_reactions(posts, current_user["user_id"])


def _reaction_counts(post: dict) -> dict:
    return {key: post.get(key) or 0 for key in REACTION_TYPES}


def _reaction_payload(post_id: str, counts: dict, my_reaction: str | None) -> dict:
    return {
        "post_id": post_id,
        **counts,
        "my_reaction": my_reaction,
    }


def post_reaction(post_id: str, request: PostReactionRequest, current_user: dict) -> dict:
    reaction = request.reaction
    user_id = current_user["user_id"]

    post_result = (
        admin_supabase
        .table("Posts")
        .select("post_id, im_here, me_too, you_got_this, love_this")
        .eq("post_id", post_id)
        .execute()
    )
    if not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    counts = _reaction_counts(post_result.data[0])

    existing_result = (
        admin_supabase
        .table("User_Reaction")
        .select("reaction_id, reaction_type, active")
        .eq("user_id", user_id)
        .eq("post_id", post_id)
        .execute()
    )
    existing = existing_result.data[0] if existing_result.data else None
    current_type = (
        existing["reaction_type"]
        if existing and existing.get("active") and existing.get("reaction_type") in REACTION_TYPES
        else None
    )

    if current_type == reaction:
        admin_supabase.table("User_Reaction").update({"active": False}).eq(
            "reaction_id", existing["reaction_id"]
        ).execute()
        counts[reaction] = max(0, counts[reaction] - 1)
        admin_supabase.table("Posts").update({reaction: counts[reaction]}).eq(
            "post_id", post_id
        ).execute()
        return _reaction_payload(post_id, counts, None)

    if existing:
        admin_supabase.table("User_Reaction").update({
            "reaction_type": reaction,
            "active": True,
        }).eq("reaction_id", existing["reaction_id"]).execute()
    else:
        admin_supabase.table("User_Reaction").insert({
            "user_id": user_id,
            "post_id": post_id,
            "comment_id": None,
            "reaction_type": reaction,
            "active": True,
        }).execute()

    if current_type:
        counts[current_type] = max(0, counts[current_type] - 1)

    counts[reaction] = counts[reaction] + 1

    counter_update = {reaction: counts[reaction]}
    if current_type:
        counter_update[current_type] = counts[current_type]

    admin_supabase.table("Posts").update(counter_update).eq("post_id", post_id).execute()
    return _reaction_payload(post_id, counts, reaction)

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
            you_got_this,
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
                parent_comment_id,
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
            "parent_comment_id": c.get("parent_comment_id"),
            "display_name": (c.pop("Users") or {}).get("display_name"),
            "like_count": c.get("likes") or 0,
            "liked_by_me": c["comment_id"] in liked_comment_ids,
        }
        for c in raw_comments
    ]

    attach_my_reactions([post], current_user["user_id"])
    return post


def _require_community_membership(community_id: str, user_id: str) -> None:
    community_result = (
        admin_supabase
        .table("Communities")
        .select("community_id")
        .eq("community_id", community_id)
        .execute()
    )
    if not community_result.data:
        raise HTTPException(status_code=404, detail="Community not found")

    membership_result = (
        admin_supabase
        .table("User_Community")
        .select("user_community_id")
        .eq("community_id", community_id)
        .eq("user_id", user_id)
        .eq("active", True)
        .execute()
    )
    if not membership_result.data:
        raise HTTPException(
            status_code=403,
            detail="Join this community before posting in it",
        )


def create_post(post_create_request: PostCreateRequest, current_user):
    community_id = (post_create_request.community_id or "").strip() or None
    if community_id:
        _require_community_membership(community_id, current_user["user_id"])

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
            "community_id": community_id,
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


