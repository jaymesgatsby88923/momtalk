import { apiRequest } from './api';
import { CommentLikeResponse, PostCreateRequest, PostDetail } from '../types/post';

export const postService = {
  createPost: (payload: PostCreateRequest) =>
    apiRequest<unknown>('/posts/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPostDetail: (postId: string) =>
    apiRequest<PostDetail>(`/posts/detail/${postId}`),

  likeComment: (commentId: string) =>
    apiRequest<CommentLikeResponse>(`/posts/comments/${commentId}/like`, {
      method: 'POST',
    }),

  unlikeComment: (commentId: string) =>
    apiRequest<CommentLikeResponse>(`/posts/comments/${commentId}/like`, {
      method: 'DELETE',
    }),
};
