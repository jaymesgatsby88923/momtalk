import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useAuth } from './useAuth';

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authService.getCurrentUser,
    enabled: isAuthenticated,
  });
}
