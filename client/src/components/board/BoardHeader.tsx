import { useState, useCallback } from 'react';
import { useUpdateBoard } from '@/hooks/api/boards';
import type { Board } from '@shared/types';

interface BoardHeaderProps {
  board: Board;
}

export function BoardHeader({ board }: BoardHeaderProps) {
  const updateBoard = useUpdateBoard();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(board.title);

  const handleTitleSave = useCallback(() => {
    setIsEditingTitle(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== board.title) {
      updateBoard.mutate({ id: board.id, title: trimmed });
    } else {
      setTitle(board.title);
    }
  }, [title, board.title, board.id, updateBoard]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTitleSave();
      } else if (e.key === 'Escape') {
        setTitle(board.title);
        setIsEditingTitle(false);
      }
    },
    [handleTitleSave, board.title],
  );

  return (
    <div className="mb-2 flex items-center gap-3">
      {isEditingTitle ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleSave}
          onKeyDown={handleTitleKeyDown}
          autoFocus
          className="rounded border border-border bg-card px-2 py-1 text-lg font-semibold text-foreground outline-none focus:border-sb-brand"
        />
      ) : (
        <h1
          className="cursor-pointer text-lg font-semibold text-foreground hover:text-sb-brand transition-colors"
          onClick={() => setIsEditingTitle(true)}
          title="Click to edit title"
        >
          {board.title}
        </h1>
      )}
      {board.description && (
        <span className="text-sm text-muted-foreground">{board.description}</span>
      )}
    </div>
  );
}
