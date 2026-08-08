import { apiRequest } from './api';
import { PostCreateRequest } from '../types/post';

export const postService = {
  createPost: (payload: PostCreateRequest) =>
    apiRequest<unknown>('/posts/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
