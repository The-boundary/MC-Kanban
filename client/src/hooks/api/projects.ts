import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';

export interface KantataProject {
  kantata_id: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  due_date: string | null;
  archived: boolean;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchApi<KantataProject[]>('/projects'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
