import { Paperclip, FileText } from 'lucide-react';
import type { Attachment } from '@shared/types';

interface CardAttachmentsProps {
  attachments: Attachment[];
}

function formatFileSize(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export function CardAttachments({ attachments }: CardAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <div>
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">
          Attachments ({attachments.length})
        </h3>
      </div>

      {/* Attachment list */}
      <div className="space-y-1">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/30"
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
          </div>
        ))}
      </div>
    </div>
  );
}
