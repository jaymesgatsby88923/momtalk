import { apiRequest } from './api';
import { LoginRequest, LoginResponse, SignUpRequest, User } from '../types/auth';

export const authService = {
  login: (payload: LoginRequest) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  signup: (payload: SignUpRequest) =>
    apiRequest<unknown>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () => apiRequest<User>('/auth/current-user'),
};
