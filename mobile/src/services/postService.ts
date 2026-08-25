import { apiRequest } from './api';
import {
  CommentLikeResponse,
  PostComment,
  PostCreateRequest,
  PostDetail,
  PostReactionResponse,
  ReactionType,
} from '../types/post';

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

  setReaction: (postId: string, reaction: ReactionType) =>
    apiRequest<PostReactionResponse>(`/posts/${postId}/reaction`, {
      method: 'POST',
      body: JSON.stringify({ reaction }),
    }),

  createComment: (postId: string, content: string, parentCommentId?: string) =>
    apiRequest<PostComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        parent_comment_id: parentCommentId ?? null,
      }),
    }),
};
