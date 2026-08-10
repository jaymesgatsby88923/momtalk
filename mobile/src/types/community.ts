export type Community = {
  community_id: string;
  name: string;
  description: string;
  is_joined: boolean;
  /** TODO: wire when backend returns member counts */
  members_count?: number;
  /** TODO: wire when backend returns new post counts */
  new_posts_count?: number;
  category?: string;
};

export type CommunityPost = {
  post_id: string;
  title: string;
  content: string;
  user_id?: string;
  community_id?: string;
  created_at?: string;
  display_name?: string;
  comment_count?: number;
  love_this?: number;
  im_here?: number;
  me_too?: number;
  /** TODO: wire when backend supports pinned posts */
  is_pinned?: boolean;
};

export type CommunityDetailResponse = {
  community: {
    community_id: string;
    name: string;
    description: string;
    members_count?: number;
    category?: string;
  };
  posts: CommunityPost | CommunityPost[] | null;
};

export type CommunitiesTab = 'my' | 'discover';
