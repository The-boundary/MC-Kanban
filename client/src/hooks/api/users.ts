import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { UserSummary } from '@shared/types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => fetchApi<UserSummary[]>('/users'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
