import { apiRequest } from './api';
import {
  Community,
  CommunityDetailResponse,
  CommunityPost,
} from '../types/community';

function normalizePosts(
  posts: CommunityDetailResponse['posts'],
): CommunityPost[] {
  if (!posts) {
    return [];
  }

  const list = Array.isArray(posts) ? posts : [posts];

  return list.map((post) => ({
    ...post,
    im_here: post.im_here ?? 0,
    me_too: post.me_too ?? 0,
    you_got_this: post.you_got_this ?? 0,
    love_this: post.love_this ?? 0,
    comment_count: post.comment_count ?? 0,
    created_at: post.created_at ?? '',
  }));
}

export const communityService = {
  listCommunities: () => apiRequest<Community[]>('/communities/list'),

  getCommunityDetail: async (communityId: string) => {
    const response = await apiRequest<CommunityDetailResponse>(
      `/communities/detail/${communityId}`,
    );

    return {
      community: response.community,
      posts: normalizePosts(response.posts),
    };
  },

  joinCommunity: (communityId: string) =>
    apiRequest<{ message: string }>('/communities/join', {
      method: 'POST',
      body: JSON.stringify({ community_id: communityId }),
    }),

  leaveCommunity: (communityId: string) =>
    apiRequest<{ message: string }>('/communities/leave', {
      method: 'PATCH',
      body: JSON.stringify({ community_id: communityId }),
    }),
};
