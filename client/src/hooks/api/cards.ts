import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Card } from '@shared/types';

export function useCard(id: string | undefined) {
  return useQuery({
    queryKey: ['card', id],
    queryFn: () => fetchApi<Card>(`/cards/${id}`),
    enabled: !!id,
  });
}

export function useMyCards() {
  return useQuery({
    queryKey: ['cards', 'mine'],
    queryFn: () => fetchApi<Card[]>('/cards/mine'),
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      boardId,
      ...body
    }: {
      boardId: string;
      column_id: string;
      title: string;
      description?: string;
      priority?: string;
      due_date?: string;
      assignee_id?: string;
      label_ids?: string[];
    }) =>
      fetchApi<Card>(`/boards/${boardId}/cards`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['board', vars.boardId] });
      qc.invalidateQueries({ queryKey: ['cards', 'mine'] });
    },
  });
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      description?: string;
      priority?: string | null;
      due_date?: string | null;
      assignee_id?: string | null;
      is_archived?: boolean;
    }) => fetchApi<Card>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['card', vars.id] });
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['cards', 'mine'] });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/cards/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['cards', 'mine'] });
    },
  });
}

export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      column_id,
      position,
    }: {
      id: string;
      column_id: string;
      position: number;
    }) =>
      fetchApi<Card>(`/cards/${id}/move`, {
        method: 'POST',
        body: JSON.stringify({ column_id, position }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useReorderCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      boardId,
      card_ids,
      column_id,
    }: {
      boardId: string;
      card_ids: string[];
      column_id: string;
    }) =>
      fetchApi(`/boards/${boardId}/cards/reorder`, {
        method: 'POST',
        body: JSON.stringify({ card_ids, column_id }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
