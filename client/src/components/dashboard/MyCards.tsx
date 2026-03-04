import { Link } from 'react-router';
import { format } from 'date-fns';
import { Calendar, ClipboardList } from 'lucide-react';
import type { Card } from '@shared/types';
import { cn } from '@/lib/utils';

const PRIORITY_DOTS: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

interface MyCardsProps {
  cards: Card[];
}

// Extended card type from /cards/mine which adds column_title and board_title
type MyCard = Card & { column_title?: string; board_title?: string; board_id: string };

export function MyCards({ cards }: MyCardsProps) {
  const myCards = cards as MyCard[];

  if (myCards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
        <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No cards assigned to you</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {myCards.map((card) => (
        <Link
          key={card.id}
          to={`/board/${card.board_id}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30"
        >
          {/* Priority dot */}
          {card.priority && (
            <span
              className={cn(
                'h-2 w-2 flex-shrink-0 rounded-full',
                PRIORITY_DOTS[card.priority] || 'bg-gray-400',
              )}
              title={card.priority}
            />
          )}
          {!card.priority && <span className="w-2 flex-shrink-0" />}

          {/* Card info */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{card.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {card.board_title}
              {card.column_title && (
                <>
                  {' '}
                  <span className="text-muted-foreground/50">/</span> {card.column_title}
                </>
              )}
            </p>
          </div>

          {/* Due date */}
          {card.due_date && (
            <span className="flex flex-shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(card.due_date), 'MMM d')}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
