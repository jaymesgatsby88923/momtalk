import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { ProfileUpdateRequest } from '../types/user';
import { useAuth } from './useAuth';

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: userService.getMyProfile,
    enabled: isAuthenticated,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProfileUpdateRequest) => userService.updateMyProfile(payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(['currentUser'], profile);
    },
  });
}
