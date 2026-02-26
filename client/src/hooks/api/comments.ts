import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Comment } from '@shared/types';

export function useComments(cardId: string | undefined) {
  return useQuery({
    queryKey: ['comments', cardId],
    queryFn: () => fetchApi<Comment[]>(`/cards/${cardId}/comments`),
    enabled: !!cardId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, body }: { cardId: string; body: string }) =>
      fetchApi<Comment>(`/cards/${cardId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.cardId] });
      qc.invalidateQueries({ queryKey: ['card', vars.cardId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      fetchApi<Comment>(`/comments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['card'] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/comments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments'] });
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
