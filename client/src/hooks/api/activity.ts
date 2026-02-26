import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { CardActivity } from '@shared/types';

export function useActivity(cardId: string | undefined) {
  return useQuery({
    queryKey: ['activity', cardId],
    queryFn: () => fetchApi<CardActivity[]>(`/cards/${cardId}/activity`),
    enabled: !!cardId,
  });
}
