import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Label } from '@shared/types';

export function useLabels(boardId: string | undefined) {
  return useQuery({
    queryKey: ['labels', boardId],
    queryFn: () => fetchApi<Label[]>(`/boards/${boardId}/labels`),
    enabled: !!boardId,
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      boardId,
      ...body
    }: {
      boardId: string;
      name: string;
      color: string;
    }) =>
      fetchApi<Label>(`/boards/${boardId}/labels`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['labels', vars.boardId] });
      qc.invalidateQueries({ queryKey: ['board', vars.boardId] });
    },
  });
}

export function useUpdateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      color?: string;
    }) =>
      fetchApi<Label>(`/labels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/labels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['labels'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useAttachLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, label_id }: { cardId: string; label_id: string }) =>
      fetchApi(`/cards/${cardId}/labels`, {
        method: 'POST',
        body: JSON.stringify({ label_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['card'] });
    },
  });
}

export function useDetachLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, labelId }: { cardId: string; labelId: string }) =>
      fetchApi(`/cards/${cardId}/labels/${labelId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['card'] });
    },
  });
}
