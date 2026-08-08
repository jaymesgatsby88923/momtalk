export type Post = {
  post_id: string;
  title: string;
  content: string;
  created_at: string;
  im_here: number;
  me_too: number;
  love_this: number;
  comment_count: number;
  community_name: string | null;
};

export type FeedType = 'forYou' | 'popular' | 'latest' | 'provideSupport';
