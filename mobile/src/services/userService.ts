import { apiRequest } from './api';
import { ProfileResponse, ProfileUpdateRequest, UserResponse } from '../types/user';

export const userService = {
  getMyProfile: () => apiRequest<ProfileResponse>('/users/me'),

  updateMyProfile: (payload: ProfileUpdateRequest) =>
    apiRequest<ProfileResponse>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getUserById: (userId: string) => apiRequest<UserResponse>(`/users/${userId}`),
};
