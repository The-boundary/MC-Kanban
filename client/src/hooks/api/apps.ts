import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';

export interface AppEntry {
  slug: string;
  name: string;
}

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: () => fetchApi<AppEntry[]>('/apps'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
