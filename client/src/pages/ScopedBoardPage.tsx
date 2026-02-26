import { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useBoardByScope } from '@/hooks/api/boards';
import { Loader2 } from 'lucide-react';

export function ScopedBoardPage() {
  const { scopeRef } = useParams<{ scopeRef: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Derive scope type from the URL path
  const scopeType = location.pathname.startsWith('/board/app/') ? 'app' : 'project';

  const {
    data: board,
    isLoading,
    error,
  } = useBoardByScope(scopeType, scopeRef || '');

  useEffect(() => {
    if (board?.id) {
      navigate(`/board/${board.id}`, { replace: true });
    }
  }, [board?.id, navigate]);

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

  // Waiting for redirect
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
