import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Column } from '@shared/types';
import { cn } from '@/lib/utils';
import { ColumnHeader } from './ColumnHeader';
import { CardItem } from './CardItem';
import { AddCard } from './AddCard';

interface BoardColumnProps {
  column: Column;
  boardId: string;
  onCardClick?: (cardId: string) => void;
}

export function BoardColumn({ column, boardId, onCardClick }: BoardColumnProps) {
  const cards = useMemo(
    () => [...(column.cards || [])].sort((a, b) => a.position - b.position),
    [column.cards],
  );

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  const isOverWipLimit =
    column.wip_limit !== null && column.wip_limit > 0 && cards.length >= column.wip_limit;

  // Column is both sortable (for column reorder) and droppable (for cards)
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: 'column', column },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: { type: 'column', column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={cn(
        'flex h-full w-72 min-w-[288px] flex-shrink-0 flex-col rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm',
        isDragging && 'opacity-40',
        isOver && 'ring-1 ring-sb-brand/40',
      )}
    >
      {/* Color stripe */}
      {column.color && (
        <div
          className="h-0.5 w-full rounded-t-lg"
          style={{ backgroundColor: column.color }}
        />
      )}

      <ColumnHeader
        column={column}
        boardId={boardId}
        cardCount={cards.length}
        isOverWipLimit={isOverWipLimit}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      <div
        className={cn(
          'flex-1 overflow-y-auto px-2 pb-2',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50',
        )}
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <CardItem key={card.id} card={card} boardId={boardId} onCardClick={onCardClick} />
            ))}
          </div>
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/40">
            <p className="text-xs text-muted-foreground/60">No cards</p>
          </div>
        )}
      </div>

      <AddCard boardId={boardId} columnId={column.id} />
    </div>
  );
}
