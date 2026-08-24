import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { ApiErrorResponse } from '../types/api';

export const API_BASE_URL = 'https://momtalk-backend.onrender.com';

const ACCESS_KEY = 'momtalk_access_token';
const REFRESH_KEY = 'momtalk_refresh_token';
const LEGACY_ACCESS_KEY = '@momtalk:access_token';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type TokenPair = {
  access_token: string;
  refresh_token: string;
};

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  _didRefresh?: boolean;
};

function memoryGet(key: string) {
  return globalThis.localStorage?.getItem(key) ?? null;
}

function memorySet(key: string, value: string) {
  globalThis.localStorage?.setItem(key, value);
}

function memoryClear(key: string) {
  globalThis.localStorage?.removeItem(key);
}

async function nativeGet(key: string): Promise<string | null> {
  try {
    const fromSecure = await SecureStore.getItemAsync(key);
    if (fromSecure) {
      return fromSecure;
    }
  } catch {
    // Fall through to AsyncStorage (e.g. token larger than SecureStore's limit).
  }

  return AsyncStorage.getItem(key);
}

async function nativeSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    await AsyncStorage.removeItem(key);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function nativeClear(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Ignore missing SecureStore entries.
  }
  await AsyncStorage.removeItem(key);
}

export const authToken = {
  get: async () => {
    if (Platform.OS === 'web') {
      return memoryGet(ACCESS_KEY) ?? (await AsyncStorage.getItem(LEGACY_ACCESS_KEY));
    }

    return (await nativeGet(ACCESS_KEY)) ?? (await AsyncStorage.getItem(LEGACY_ACCESS_KEY));
  },
  getRefresh: async () => {
    if (Platform.OS === 'web') {
      return memoryGet(REFRESH_KEY);
    }

    return nativeGet(REFRESH_KEY);
  },
  set: async (accessToken: string, refreshToken: string) => {
    if (Platform.OS === 'web') {
      memorySet(ACCESS_KEY, accessToken);
      memorySet(REFRESH_KEY, refreshToken);
      await AsyncStorage.removeItem(LEGACY_ACCESS_KEY);
      return;
    }

    await nativeSet(ACCESS_KEY, accessToken);
    await nativeSet(REFRESH_KEY, refreshToken);
    await AsyncStorage.removeItem(LEGACY_ACCESS_KEY);
  },
  clear: async () => {
    if (Platform.OS === 'web') {
      memoryClear(ACCESS_KEY);
      memoryClear(REFRESH_KEY);
      await AsyncStorage.removeItem(LEGACY_ACCESS_KEY);
      return;
    }

    await nativeClear(ACCESS_KEY);
    await nativeClear(REFRESH_KEY);
    await AsyncStorage.removeItem(LEGACY_ACCESS_KEY);
  },
};

let onSessionInvalid: (() => void) | null = null;

export function setOnSessionInvalid(handler: (() => void) | null) {
  onSessionInvalid = handler;
}

async function invalidateSession() {
  await authToken.clear();
  onSessionInvalid?.();
}

let refreshInFlight: Promise<boolean> | null = null;

export async function tryRefreshSession(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = await authToken.getRefresh();
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = (await response.json()) as TokenPair;
      if (!data.access_token || !data.refresh_token) {
        return false;
      }

      await authToken.set(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
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
  options: ApiRequestOptions = {},
): Promise<T> {
  const { auth = true, _didRefresh = false, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  if (auth) {
    const token = await authToken.get();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
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

  if (response.status === 401 && auth && !_didRefresh) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, auth, _didRefresh: true });
    }
    await invalidateSession();
  }

  if (!response.ok) {
    throw new ApiError(response.status, parseErrorMessage(data, response.status));
  }

  return data as T;
}
