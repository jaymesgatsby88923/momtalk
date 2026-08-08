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
  clearStoredToken,
  getStoredToken,
  setStoredToken,
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

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getStoredToken();
        setToken(storedToken);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authService.login(payload);
      await setStoredToken(response.access_token);
      setToken(response.access_token);
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      return response;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
    queryClient.clear();
  }, [queryClient]);

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
