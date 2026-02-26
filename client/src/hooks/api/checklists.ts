import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Checklist, ChecklistItem } from '@shared/types';

export function useCreateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, title }: { cardId: string; title: string }) =>
      fetchApi<Checklist>(`/cards/${cardId}/checklists`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['card', vars.cardId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      position?: number;
    }) =>
      fetchApi<Checklist>(`/checklists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/checklists/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useCreateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ checklistId, title }: { checklistId: string; title: string }) =>
      fetchApi<ChecklistItem>(`/checklists/${checklistId}/items`, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      title?: string;
      is_checked?: boolean;
      position?: number;
      assignee_id?: string | null;
    }) =>
      fetchApi<ChecklistItem>(`/checklist-items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/checklist-items/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
