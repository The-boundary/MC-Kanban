import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Column } from '@shared/types';

export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      boardId,
      ...body
    }: {
      boardId: string;
      title: string;
      color?: string;
      wip_limit?: number | null;
    }) =>
      fetchApi<Column>(`/boards/${boardId}/columns`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['board', vars.boardId] });
    },
  });
}

export function useUpdateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      color?: string | null;
      wip_limit?: number | null;
    }) =>
      fetchApi<Column>(`/columns/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/columns/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useReorderColumns() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ boardId, column_ids }: { boardId: string; column_ids: string[] }) =>
      fetchApi(`/boards/${boardId}/columns/reorder`, {
        method: 'POST',
        body: JSON.stringify({ column_ids }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['board', vars.boardId] });
    },
  });
}
