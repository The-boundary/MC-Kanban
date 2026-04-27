import { useRef } from 'react';
import { Paperclip, FileText, Upload, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import type { Attachment } from '@shared/types';
import { useUploadAttachment, useDeleteAttachment } from '@/hooks/api/attachments';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface CardAttachmentsProps {
  attachments: Attachment[];
  cardId: string;
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function CardAttachments({ attachments, cardId }: CardAttachmentsProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAttachment = useUploadAttachment();
  const deleteAttachment = useDeleteAttachment();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAttachment.mutate({ cardId, file });
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Attachments ({attachments.length})</h3>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAttachment.isPending}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            uploadAttachment.isPending && 'opacity-50',
          )}
        >
          {uploadAttachment.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          Upload
        </button>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {/* Attachment list */}
      <div className="space-y-1">
        {attachments.map((attachment) => {
          const downloadUrl =
            attachment.download_url ?? `/api/attachments/${attachment.id}/download`;
          const isOwner = user?.id === attachment.uploaded_by;

          return (
            <div
              key={attachment.id}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30"
            >
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
                title={`Open ${attachment.file_name}`}
              >
                <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {attachment.file_name}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatFileSize(attachment.file_size)}
                    {attachment.uploader && (
                      <>
                        {' - '}
                        {attachment.uploader.display_name || attachment.uploader.email}
                      </>
                    )}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </a>

              {/* Delete (uploader only) */}
              {isOwner && (
                <button
                  type="button"
                  onClick={() => deleteAttachment.mutate(attachment.id)}
                  disabled={deleteAttachment.isPending}
                  className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state with upload prompt */}
      {attachments.length === 0 && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 px-4 py-6 text-xs text-muted-foreground transition-colors hover:border-sb-brand/40 hover:text-foreground"
        >
          <Upload className="h-4 w-4" />
          Click to upload a file
        </button>
      )}
    </div>
  );
}
