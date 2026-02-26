import { Link } from 'react-router';
import { LayoutGrid, Users, StickyNote } from 'lucide-react';
import type { Board } from '@shared/types';
import { cn } from '@/lib/utils';

const SCOPE_BADGES: Record<string, { label: string; className: string }> = {
  app: { label: 'App', className: 'bg-blue-500/20 text-blue-400' },
  project: { label: 'Project', className: 'bg-emerald-500/20 text-emerald-400' },
  personal: { label: 'Personal', className: 'bg-purple-500/20 text-purple-400' },
};

interface RecentBoardsProps {
  boards: Board[];
}

export function RecentBoards({ boards }: RecentBoardsProps) {
  const sorted = [...boards]
    .filter((b) => !b.is_archived)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
        <LayoutGrid className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No boards yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sorted.map((board) => {
        const badge = SCOPE_BADGES[board.scope_type] || SCOPE_BADGES.personal;
        return (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className="group rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-sb-brand/40 hover:bg-muted/30"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium text-foreground group-hover:text-sb-brand transition-colors line-clamp-2">
                {board.title}
              </h3>
              <span
                className={cn(
                  'flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
                  badge.className,
                )}
              >
                {badge.label}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <StickyNote className="h-3 w-3" />
                {board.card_count ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {board.member_count ?? 0}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
