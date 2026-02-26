import { useState, useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useQueryClient } from '@tanstack/react-query';

import type { Board, Card, Column as ColumnType } from '@shared/types';
import { useMoveCard, useReorderCards } from '@/hooks/api/cards';
import { useReorderColumns } from '@/hooks/api/columns';
import { BoardColumn } from './Column';
import { AddColumn } from './AddColumn';
import { CardItem } from './CardItem';
import { BoardHeader } from './BoardHeader';

interface BoardViewProps {
  board: Board;
}

export function BoardView({ board }: BoardViewProps) {
  const queryClient = useQueryClient();
  const moveCard = useMoveCard();
  const reorderCards = useReorderCards();
  const reorderColumns = useReorderColumns();

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  // Track which column a card is currently hovering over
  const overColumnRef = useRef<string | null>(null);

  const columns = useMemo(
    () => [...(board.columns || [])].sort((a, b) => a.position - b.position),
    [board.columns],
  );

  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // Find which column a card belongs to
  const findColumnOfCard = useCallback(
    (cardId: string): ColumnType | undefined => {
      return columns.find((col) => col.cards?.some((c) => c.id === cardId));
    },
    [columns],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const data = active.data.current;

      if (data?.type === 'card') {
        setActiveCard(data.card as Card);
        setActiveColumnId(null);
      } else if (data?.type === 'column') {
        setActiveColumnId(active.id as string);
        setActiveCard(null);
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        overColumnRef.current = null;
        return;
      }

      const overData = over.data.current;
      if (overData?.type === 'column') {
        overColumnRef.current = over.id as string;
      } else if (overData?.type === 'card') {
        const col = findColumnOfCard(over.id as string);
        overColumnRef.current = col?.id || null;
      }
    },
    [findColumnOfCard],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveCard(null);
      setActiveColumnId(null);
      overColumnRef.current = null;

      if (!over) return;

      const activeData = active.data.current;

      // Column reorder
      if (activeData?.type === 'column') {
        if (active.id !== over.id) {
          const oldIndex = columnIds.indexOf(active.id as string);
          const overIsColumn = over.data.current?.type === 'column';
          const overIdx = overIsColumn
            ? columnIds.indexOf(over.id as string)
            : -1;

          if (oldIndex !== -1 && overIdx !== -1 && oldIndex !== overIdx) {
            const newOrder = arrayMove(columnIds, oldIndex, overIdx);

            // Optimistic update
            queryClient.setQueryData(['board', board.id], (old: Board | undefined) => {
              if (!old?.columns) return old;
              const reordered = newOrder
                .map((id, i) => {
                  const col = old.columns!.find((c) => c.id === id);
                  return col ? { ...col, position: (i + 1) * 1000 } : null;
                })
                .filter(Boolean) as ColumnType[];
              return { ...old, columns: reordered };
            });

            reorderColumns.mutate(
              { boardId: board.id, column_ids: newOrder },
              {
                onError: () => {
                  queryClient.invalidateQueries({ queryKey: ['board', board.id] });
                },
              },
            );
          }
        }
        return;
      }

      // Card drag
      if (activeData?.type === 'card') {
        const activeCardId = active.id as string;
        const sourceColumn = findColumnOfCard(activeCardId);
        if (!sourceColumn) return;

        let targetColumnId: string;
        let targetCardIndex: number;

        const overData = over.data.current;

        if (overData?.type === 'column') {
          // Dropped on a column (empty area)
          targetColumnId = over.id as string;
          const targetColumn = columns.find((c) => c.id === targetColumnId);
          const targetCards = (targetColumn?.cards || []).filter((c) => c.id !== activeCardId);
          targetCardIndex = targetCards.length; // append at end
        } else if (overData?.type === 'card') {
          // Dropped on another card
          const overColumn = findColumnOfCard(over.id as string);
          if (!overColumn) return;
          targetColumnId = overColumn.id;
          const targetCards = (overColumn.cards || []).filter((c) => c.id !== activeCardId);
          const overIndex = targetCards.findIndex((c) => c.id === over.id);
          targetCardIndex = overIndex >= 0 ? overIndex : targetCards.length;
        } else {
          return;
        }

        const targetColumn = columns.find((c) => c.id === targetColumnId);
        if (!targetColumn) return;

        if (sourceColumn.id === targetColumnId) {
          // Same column reorder
          const currentCards = [...(sourceColumn.cards || [])];
          const oldIdx = currentCards.findIndex((c) => c.id === activeCardId);
          if (oldIdx === -1) return;

          const newCards = arrayMove(currentCards, oldIdx, targetCardIndex);
          const newCardIds = newCards.map((c) => c.id);

          // Optimistic update
          queryClient.setQueryData(['board', board.id], (old: Board | undefined) => {
            if (!old?.columns) return old;
            return {
              ...old,
              columns: old.columns.map((col) => {
                if (col.id !== targetColumnId) return col;
                const reordered = newCardIds
                  .map((id, i) => {
                    const card = col.cards?.find((c) => c.id === id);
                    return card ? { ...card, position: (i + 1) * 1000 } : null;
                  })
                  .filter(Boolean) as Card[];
                return { ...col, cards: reordered };
              }),
            };
          });

          reorderCards.mutate(
            { boardId: board.id, card_ids: newCardIds, column_id: targetColumnId },
            {
              onError: () => {
                queryClient.invalidateQueries({ queryKey: ['board', board.id] });
              },
            },
          );
        } else {
          // Different column move
          const targetCards = (targetColumn.cards || []).filter((c) => c.id !== activeCardId);
          // Insert at the target position
          const position =
            targetCards.length === 0
              ? 1000
              : targetCardIndex >= targetCards.length
                ? (targetCards[targetCards.length - 1]?.position ?? 0) + 1000
                : targetCardIndex === 0
                  ? (targetCards[0]?.position ?? 2000) / 2
                  : ((targetCards[targetCardIndex - 1]?.position ?? 0) +
                      (targetCards[targetCardIndex]?.position ?? 0)) /
                    2;

          // Optimistic update
          queryClient.setQueryData(['board', board.id], (old: Board | undefined) => {
            if (!old?.columns) return old;
            const movedCard = sourceColumn.cards?.find((c) => c.id === activeCardId);
            if (!movedCard) return old;

            return {
              ...old,
              columns: old.columns.map((col) => {
                if (col.id === sourceColumn.id) {
                  return {
                    ...col,
                    cards: (col.cards || []).filter((c) => c.id !== activeCardId),
                  };
                }
                if (col.id === targetColumnId) {
                  const existingCards = (col.cards || []).filter((c) => c.id !== activeCardId);
                  const updatedCard = {
                    ...movedCard,
                    column_id: targetColumnId,
                    position,
                  };
                  const newList = [...existingCards];
                  newList.splice(targetCardIndex, 0, updatedCard);
                  return { ...col, cards: newList };
                }
                return col;
              }),
            };
          });

          moveCard.mutate(
            { id: activeCardId, column_id: targetColumnId, position },
            {
              onError: () => {
                queryClient.invalidateQueries({ queryKey: ['board', board.id] });
              },
            },
          );
        }
      }
    },
    [
      board.id,
      columns,
      columnIds,
      findColumnOfCard,
      moveCard,
      reorderCards,
      reorderColumns,
      queryClient,
    ],
  );

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    setActiveColumnId(null);
    overColumnRef.current = null;
  }, []);

  return (
    <div className="flex h-full flex-col">
      <BoardHeader board={board} />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4 pt-2">
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                boardId={board.id}
              />
            ))}
          </SortableContext>

          <AddColumn boardId={board.id} />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div className="w-72 rotate-2 opacity-90">
              <CardItem card={activeCard} boardId={board.id} isOverlay />
            </div>
          ) : null}
          {activeColumnId ? (
            <div className="w-72 rotate-1 opacity-70 rounded-lg border border-border bg-card/80 p-4">
              <p className="text-sm font-medium text-foreground">
                {columns.find((c) => c.id === activeColumnId)?.title}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
