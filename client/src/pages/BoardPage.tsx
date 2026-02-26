import { useParams } from 'react-router';
import { useBoard } from '@/hooks/api/boards';
import { BoardView } from '@/components/board/BoardView';
import { Loader2 } from 'lucide-react';

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: board, isLoading, error } = useBoard(id);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-2">
        <p className="text-sm text-destructive">Failed to load board</p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Board not found</p>
      </div>
    );
  }

  return <BoardView board={board} />;
}
