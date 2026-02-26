import { useState, useRef, useEffect } from 'react';
import { AlignLeft, Eye, Edit3 } from 'lucide-react';
import { useUpdateCard } from '@/hooks/api/cards';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardDescriptionProps {
  cardId: string;
  description: string | null;
}

export function CardDescription({ cardId, description }: CardDescriptionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description ?? '');
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const updateCard = useUpdateCard();

  // Sync draft when description prop changes externally
  useEffect(() => {
    if (!editing) {
      setDraft(description ?? '');
    }
  }, [description, editing]);

  // Auto-focus and auto-resize textarea
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [editing]);

  const handleSave = () => {
    const trimmed = draft.trim();
    const newValue = trimmed || null;
    if (newValue !== description) {
      updateCard.mutate({ id: cardId, description: newValue ?? undefined });
    }
    setEditing(false);
    setPreview(false);
  };

  const handleCancel = () => {
    setDraft(description ?? '');
    setEditing(false);
    setPreview(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  return (
    <div>
      {/* Section header */}
      <div className="mb-2 flex items-center gap-2">
        <AlignLeft className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Description</h3>
        {!editing && description && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="ml-auto h-6 px-2">
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          {/* Toggle bar */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={cn(
                'rounded px-2 py-1 text-xs',
                !preview ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Edit3 className="mr-1 inline-block h-3 w-3" />
              Write
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={cn(
                'rounded px-2 py-1 text-xs',
                preview ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Eye className="mr-1 inline-block h-3 w-3" />
              Preview
            </button>
          </div>

          {preview ? (
            <div className="min-h-[100px] rounded-md border border-border bg-background p-3">
              {draft.trim() ? (
                <MarkdownRenderer content={draft} />
              ) : (
                <p className="text-sm italic text-muted-foreground">Nothing to preview</p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Add a more detailed description..."
              className="min-h-[100px] w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
            />
          )}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateCard.isPending}>
              {updateCard.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <span className="ml-auto text-[11px] text-muted-foreground">Ctrl+Enter to save</span>
          </div>
        </div>
      ) : description ? (
        <div
          className="cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/30"
          onClick={() => setEditing(true)}
        >
          <MarkdownRenderer content={description} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="w-full rounded-md border border-dashed border-border p-4 text-left text-sm text-muted-foreground transition-colors hover:border-sb-brand/40 hover:bg-muted/20"
        >
          Add a more detailed description...
        </button>
      )}
    </div>
  );
}
