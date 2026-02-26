import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useCreateColumn } from '@/hooks/api/columns';
import { cn } from '@/lib/utils';

interface AddColumnProps {
  boardId: string;
}

export function AddColumn({ boardId }: AddColumnProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const createColumn = useCreateColumn();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    const trimmed = title.trim();
    if (!trimmed) return;

    createColumn.mutate(
      { boardId, title: trimmed },
      {
        onSuccess: () => {
          setTitle('');
          setIsOpen(false);
        },
      },
    );
  }, [title, boardId, createColumn]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
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
          'flex h-10 w-72 min-w-[288px] flex-shrink-0 items-center gap-2 rounded-lg border border-dashed border-border/40 px-3',
          'text-sm text-muted-foreground/60 hover:border-border hover:text-muted-foreground transition-colors',
        )}
      >
        <Plus className="h-4 w-4" />
        Add Column
      </button>
    );
  }

  return (
    <div className="w-72 min-w-[288px] flex-shrink-0 rounded-lg border border-border/40 bg-card/50 p-2">
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Column title..."
        className="w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-sb-brand"
      />
      <div className="mt-2 flex items-center gap-1">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || createColumn.isPending}
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
