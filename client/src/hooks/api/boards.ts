import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Board } from '@shared/types';

export function useBoards(scope?: string) {
  const params = new URLSearchParams();
  if (scope && scope !== 'all') params.set('scope', scope);
  const qs = params.toString();
  return useQuery({
    queryKey: ['boards', scope || 'all'],
    queryFn: () => fetchApi<Board[]>(`/boards${qs ? `?${qs}` : ''}`),
  });
}

export function useBoard(id: string | undefined) {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => fetchApi<Board>(`/boards/${id}`),
    enabled: !!id,
    refetchInterval: 30_000,
  });
}

export function useBoardByScope(scopeType: string, scopeRef: string) {
  return useQuery({
    queryKey: ['board', 'by-scope', scopeType, scopeRef],
    queryFn: () =>
      fetchApi<Board>(
        `/boards/by-scope?scope_type=${encodeURIComponent(scopeType)}&scope_ref=${encodeURIComponent(scopeRef)}`,
      ),
    enabled: !!scopeType && !!scopeRef,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      fetchApi<Board>('/boards', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      description?: string;
      is_archived?: boolean;
    }) => fetchApi<Board>(`/boards/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['boards'] });
      qc.invalidateQueries({ queryKey: ['board', vars.id] });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/boards/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['boards'] }),
  });
}
