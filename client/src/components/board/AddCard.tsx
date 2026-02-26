import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useCreateCard } from '@/hooks/api/cards';
import { cn } from '@/lib/utils';

interface AddCardProps {
  boardId: string;
  columnId: string;
}

export function AddCard({ boardId, columnId }: AddCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createCard = useCreateCard();

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;

    createCard.mutate(
      { boardId, column_id: columnId, title: trimmed },
      {
        onSuccess: () => {
          setTitle('');
          // Keep the form open for quick multi-add
          textareaRef.current?.focus();
        },
      },
    );
  }, [title, boardId, columnId, createCard]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        setTitle('');
        setIsOpen(false);
      }
    },
    [handleSubmit],
  );

  const handleCancel = useCallback(() => {
    setTitle('');
    setIsOpen(false);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex w-full items-center gap-1 rounded-b-lg px-3 py-2 text-xs text-muted-foreground/70',
          'hover:bg-muted/30 hover:text-muted-foreground transition-colors',
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Add card
      </button>
    );
  }

  return (
    <div className="px-2 pb-2">
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title..."
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-card p-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-sb-brand"
      />
      <div className="mt-1 flex items-center gap-1">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || createCard.isPending}
          className={cn(
            'rounded-md bg-sb-brand-500 px-3 py-1 text-xs font-medium text-white',
            'hover:bg-sb-brand-500/80 disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          Add
        </button>
        <button
          onClick={handleCancel}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
