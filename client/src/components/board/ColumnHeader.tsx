import { useState, useCallback } from 'react';
import { MoreHorizontal, GripVertical, Trash2, Palette, Hash } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@the-boundary/design-system';

import type { Column } from '@shared/types';
import { cn } from '@/lib/utils';
import { useUpdateColumn, useDeleteColumn } from '@/hooks/api/columns';

const COLUMN_COLORS = [
  '#6b7280', '#3b82f6', '#f97316', '#22c55e', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#06b6d4',
];

interface ColumnHeaderProps {
  column: Column;
  boardId: string;
  cardCount: number;
  isOverWipLimit: boolean;
  dragHandleProps: Record<string, unknown>;
}

export function ColumnHeader({
  column,
  boardId: _boardId,
  cardCount,
  isOverWipLimit,
  dragHandleProps,
}: ColumnHeaderProps) {
  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);

  const handleTitleSave = useCallback(() => {
    setIsEditing(false);
    const trimmed = title.trim();
    if (trimmed && trimmed !== column.title) {
      updateColumn.mutate({ id: column.id, title: trimmed });
    } else {
      setTitle(column.title);
    }
  }, [title, column.title, column.id, updateColumn]);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTitleSave();
      } else if (e.key === 'Escape') {
        setTitle(column.title);
        setIsEditing(false);
      }
    },
    [handleTitleSave, column.title],
  );

  const handleSetColor = useCallback(
    (color: string) => {
      updateColumn.mutate({ id: column.id, color });
    },
    [column.id, updateColumn],
  );

  const handleSetWipLimit = useCallback(() => {
    const input = window.prompt('WIP Limit (0 to remove):', String(column.wip_limit || 0));
    if (input === null) return;
    const limit = parseInt(input, 10);
    if (isNaN(limit) || limit < 0) return;
    updateColumn.mutate({ id: column.id, wip_limit: limit === 0 ? null : limit });
  }, [column.id, column.wip_limit, updateColumn]);

  const handleDelete = useCallback(() => {
    if (window.confirm(`Delete column "${column.title}"? Cards will be moved to an adjacent column.`)) {
      deleteColumn.mutate(column.id);
    }
  }, [column.id, column.title, deleteColumn]);

  return (
    <div className="flex items-center gap-1 px-2 py-2">
      {/* Drag handle */}
      <button
        className="cursor-grab rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            autoFocus
            className="w-full rounded border border-border bg-card px-1.5 py-0.5 text-sm font-medium text-foreground outline-none focus:border-sb-brand"
          />
        ) : (
          <button
            className="w-full truncate text-left text-sm font-medium text-foreground hover:text-sb-brand transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {column.title}
          </button>
        )}
      </div>

      {/* Card count */}
      <span
        className={cn(
          'flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
          isOverWipLimit
            ? 'bg-red-500/20 text-red-400'
            : 'bg-muted text-muted-foreground',
        )}
      >
        {cardCount}
        {column.wip_limit ? `/${column.wip_limit}` : ''}
      </span>

      {/* Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded p-0.5 text-muted-foreground/50 hover:text-muted-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSetWipLimit}>
            <Hash className="mr-2 h-3.5 w-3.5" />
            Set WIP Limit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="mb-1.5 text-xs text-muted-foreground">
              <Palette className="mr-1 inline-block h-3 w-3" /> Color
            </p>
            <div className="flex flex-wrap gap-1">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    'h-5 w-5 rounded-full border-2 transition-transform hover:scale-110',
                    column.color === color
                      ? 'border-white'
                      : 'border-transparent',
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleSetColor(color)}
                />
              ))}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-400 focus:text-red-400"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete Column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
