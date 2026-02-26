import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isPast } from 'date-fns';
import {
  Calendar,
  MessageSquare,
  Paperclip,
  CheckSquare,
} from 'lucide-react';

import type { Card } from '@shared/types';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-orange-400',
  urgent: 'bg-red-500',
};

interface CardItemProps {
  card: Card;
  boardId: string;
  isOverlay?: boolean;
}

export function CardItem({ card, boardId: _boardId, isOverlay }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card', card },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = useMemo(() => {
    if (!card.due_date) return false;
    return isPast(new Date(card.due_date));
  }, [card.due_date]);

  const formattedDate = useMemo(() => {
    if (!card.due_date) return null;
    return format(new Date(card.due_date), 'MMM d');
  }, [card.due_date]);

  const checklistTotal = card.checklist_progress?.total ?? 0;
  const checklistChecked = card.checklist_progress?.checked ?? 0;
  const commentCount = card.comment_count ?? 0;
  const attachmentCount = card.attachment_count ?? 0;
  const hasMetadata = checklistTotal > 0 || commentCount > 0 || attachmentCount > 0;

  const assigneeInitial = useMemo(() => {
    if (!card.assignee) return null;
    const name = card.assignee.display_name || card.assignee.full_name || card.assignee.email;
    return name ? name.charAt(0).toUpperCase() : '?';
  }, [card.assignee]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-pointer rounded-lg border border-border/60 bg-card p-3 shadow-sm transition-colors hover:bg-muted/50',
        isDragging && 'opacity-40',
        isOverlay && 'shadow-lg',
      )}
    >
      {/* Labels row */}
      {card.labels && card.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {card.labels.slice(0, 5).map((label) => (
            <span
              key={label.id}
              className="inline-block h-1.5 w-6 rounded-full"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
        </div>
      )}

      {/* Title + priority */}
      <div className="flex items-start gap-2">
        {card.priority && (
          <span
            className={cn(
              'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
              PRIORITY_COLORS[card.priority] || 'bg-gray-400',
            )}
            title={card.priority}
          />
        )}
        <p className="flex-1 text-sm font-medium leading-snug text-foreground">
          {card.title}
        </p>
      </div>

      {/* Bottom row: metadata + assignee */}
      {(hasMetadata || card.due_date || card.assignee) && (
        <div className="mt-2 flex items-center gap-2">
          {/* Due date */}
          {formattedDate && (
            <span
              className={cn(
                'flex items-center gap-1 text-[11px]',
                isOverdue ? 'text-red-400' : 'text-muted-foreground',
              )}
            >
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          )}

          {/* Checklist progress */}
          {checklistTotal > 0 && (
            <span
              className={cn(
                'flex items-center gap-1 text-[11px]',
                checklistChecked === checklistTotal
                  ? 'text-emerald-400'
                  : 'text-muted-foreground',
              )}
            >
              <CheckSquare className="h-3 w-3" />
              {checklistChecked}/{checklistTotal}
            </span>
          )}

          {/* Comment count */}
          {commentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </span>
          )}

          {/* Attachment count */}
          {attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {attachmentCount}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Assignee avatar */}
          {card.assignee && (
            <div
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sb-brand/20 text-[10px] font-medium text-sb-brand"
              title={
                card.assignee.display_name ||
                card.assignee.full_name ||
                card.assignee.email
              }
            >
              {card.assignee.avatar_url ? (
                <img
                  src={card.assignee.avatar_url}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                assigneeInitial
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
