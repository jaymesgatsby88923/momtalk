import { apiRequest } from './api';
import { LoginRequest, LoginResponse, SignUpRequest, SignUpResponse } from '../types/auth';

export const authService = {
  login: (payload: LoginRequest) =>
    apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: false,
    }),

  signup: (payload: SignUpRequest) =>
    apiRequest<SignUpResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
      auth: false,
    }),

  logout: (refreshToken: string, accessToken: string | null) =>
    apiRequest<{ ok: boolean }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: refreshToken,
        access_token: accessToken,
      }),
      auth: false,
    }),
};
