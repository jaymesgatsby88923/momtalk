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
import { LoginRequest, LoginResponse, SignUpRequest } from '../types/auth';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<LoginResponse>;
  signupAndEnter: (payload: SignUpRequest) => Promise<void>;
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

  const applySession = useCallback(
    async (accessToken: string, refreshToken: string) => {
      await authToken.set(accessToken, refreshToken);
      setToken(accessToken);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    [queryClient],
  );

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authService.login(payload);
      await applySession(response.access_token, response.refresh_token);
      return response;
    },
    [applySession],
  );

  const signupAndEnter = useCallback(
    async (payload: SignUpRequest) => {
      const response = await authService.signup(payload);
      if (response.access_token && response.refresh_token) {
        await applySession(response.access_token, response.refresh_token);
        return;
      }

      await login({ email: payload.email, password: payload.password });
    },
    [applySession, login],
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
      signupAndEnter,
      logout,
    }),
    [token, isLoading, login, signupAndEnter, logout],
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
