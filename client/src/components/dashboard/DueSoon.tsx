import { useMemo } from 'react';
import { Link } from 'react-router';
import { format, isPast, differenceInDays } from 'date-fns';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import type { Card } from '@shared/types';
import { cn } from '@/lib/utils';

type MyCard = Card & { column_title?: string; board_title?: string; board_id: string };

interface DueSoonProps {
  cards: Card[];
}

export function DueSoon({ cards }: DueSoonProps) {
  const dueSoonCards = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return (cards as MyCard[])
      .filter((card) => {
        if (!card.due_date) return false;
        const dueDate = new Date(card.due_date);
        return dueDate <= sevenDaysFromNow;
      })
      .sort((a, b) => {
        const aDate = new Date(a.due_date!);
        const bDate = new Date(b.due_date!);
        const aOverdue = isPast(aDate);
        const bOverdue = isPast(bDate);
        // Overdue first
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return aDate.getTime() - bDate.getTime();
      });
  }, [cards]);

  if (dueSoonCards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
        <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {dueSoonCards.map((card) => {
        const dueDate = new Date(card.due_date!);
        const overdue = isPast(dueDate);
        const daysLeft = differenceInDays(dueDate, new Date());

        let dueLabel: string;
        if (overdue) {
          const daysOverdue = Math.abs(daysLeft);
          dueLabel = daysOverdue === 0 ? 'Due today' : `${daysOverdue}d overdue`;
        } else if (daysLeft === 0) {
          dueLabel = 'Due today';
        } else if (daysLeft === 1) {
          dueLabel = 'Due tomorrow';
        } else {
          dueLabel = `${daysLeft}d left`;
        }

        return (
          <Link
            key={card.id}
            to={`/boards/${card.board_id}`}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30',
              overdue && 'bg-red-500/5',
            )}
          >
            {overdue ? (
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-400" />
            ) : (
              <Calendar className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{card.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {card.board_title}
              </p>
            </div>

            <div className="flex flex-shrink-0 flex-col items-end gap-0.5">
              <span
                className={cn(
                  'text-[11px] font-medium',
                  overdue ? 'text-red-400' : 'text-muted-foreground',
                )}
              >
                {dueLabel}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {format(dueDate, 'MMM d')}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
