import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiErrorResponse } from '../types/api';

export const API_BASE_URL = 'http://127.0.0.1:8000';
export const TOKEN_STORAGE_KEY = '@momtalk:access_token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

function parseErrorMessage(data: unknown, status: number): string {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = (data as ApiErrorResponse).detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((item) => item.msg).join(', ');
    }
  }
  return `Request failed with status ${status}`;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, parseErrorMessage(data, response.status));
  }

  return data as T;
}
