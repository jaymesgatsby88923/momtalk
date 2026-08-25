import type { Post } from './post';

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

export type CommunityPost = Post;

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
