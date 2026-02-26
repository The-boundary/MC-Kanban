import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/fetchApi';
import type { Attachment } from '@shared/types';

export function useAttachments(cardId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', cardId],
    queryFn: () => fetchApi<Attachment[]>(`/cards/${cardId}/attachments`),
    enabled: !!cardId,
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, file }: { cardId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return fetch(`/api/cards/${cardId}/attachments`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      }).then((r) => {
        if (!r.ok) throw new Error('Upload failed');
        return r.json();
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['attachments', vars.cardId] });
      qc.invalidateQueries({ queryKey: ['card', vars.cardId] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/attachments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attachments'] });
      qc.invalidateQueries({ queryKey: ['card'] });
      qc.invalidateQueries({ queryKey: ['board'] });
    },
  });
}
