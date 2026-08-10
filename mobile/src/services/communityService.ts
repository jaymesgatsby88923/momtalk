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

  return Array.isArray(posts) ? posts : [posts];
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
