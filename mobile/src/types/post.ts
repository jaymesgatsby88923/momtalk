export type ReactionType = 'im_here' | 'me_too' | 'you_got_this' | 'love_this';

export type Post = {
  post_id: string;
  title: string;
  content: string;
  created_at: string;
  im_here: number;
  me_too: number;
  you_got_this?: number;
  love_this: number;
  comment_count: number;
  community_name?: string | null;
  display_name?: string | null;
  user_id?: string;
  community_id?: string;
  my_reaction?: ReactionType | null;
  is_pinned?: boolean;
};

export type PostComment = {
  comment_id: string;
  content: string;
  created_at: string;
  user_id: string;
  display_name: string | null;
  parent_comment_id: string | null;
  like_count: number;
  liked_by_me: boolean;
};

export type PostDetail = {
  post_id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  im_here: number;
  me_too: number;
  you_got_this?: number;
  love_this: number;
  my_reaction?: ReactionType | null;
  image_url: string | null;
  community_id: string | null;
  community_name: string | null;
  display_name: string | null;
  comments: PostComment[];
};

export type CommentLikeResponse = {
  comment_id: string;
  like_count: number;
  liked_by_me: boolean;
};

export type PostReactionResponse = {
  post_id: string;
  im_here: number;
  me_too: number;
  you_got_this: number;
  love_this: number;
  my_reaction: ReactionType | null;
};

export type FeedType = 'forYou' | 'popular' | 'latest' | 'provideSupport';

/** Matches backend PostCreateRequest in backend/models/posts.py */
export type PostCreateRequest = {
  title: string;
  content: string;
  image_url?: string;
  post_type: string;
  post_category: string;
  user_id: string;
};
