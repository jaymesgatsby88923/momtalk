import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  authToken,
  setOnSessionInvalid,
  tryRefreshSession,
} from '../services/api';
import { authService } from '../services/authService';
import { LoginRequest, LoginResponse } from '../types/auth';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await authToken.clear();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    async function restoreSession() {
      try {
        let storedToken = await authToken.get();
        if (!storedToken) {
          const refreshed = await tryRefreshSession();
          storedToken = refreshed ? await authToken.get() : null;
        }
        setToken(storedToken);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    setOnSessionInvalid(() => {
      setToken(null);
      queryClient.clear();
    });

    return () => setOnSessionInvalid(null);
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authService.login(payload);
      await authToken.set(response.access_token, response.refresh_token);
      setToken(response.access_token);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      return response;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    const refreshToken = await authToken.getRefresh();
    const accessToken = await authToken.get();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken, accessToken);
      } catch {
        // Local logout still happens if revoke fails.
      }
    }
    await clearSession();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
