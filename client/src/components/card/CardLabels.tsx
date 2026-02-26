import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Tag, Plus, Check } from 'lucide-react';
import { useLabels, useCreateLabel, useAttachLabel, useDetachLabel } from '@/hooks/api/labels';
import { LabelBadge } from '@/components/shared/LabelBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Card } from '@shared/types';

const LABEL_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
  '#14b8a6', // teal
];

interface CardLabelsProps {
  card: Card;
  boardId: string;
}

export function CardLabels({ card, boardId }: CardLabelsProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);

  const { data: allLabels = [] } = useLabels(boardId);
  const createLabel = useCreateLabel();
  const attachLabel = useAttachLabel();
  const detachLabel = useDetachLabel();

  const cardLabelIds = new Set((card.labels || []).map((l) => l.id));

  const handleToggleLabel = (labelId: string) => {
    if (cardLabelIds.has(labelId)) {
      detachLabel.mutate({ cardId: card.id, labelId });
    } else {
      attachLabel.mutate({ cardId: card.id, label_id: labelId });
    }
  };

  const handleCreateLabel = () => {
    const name = newName.trim();
    if (!name) return;
    createLabel.mutate(
      { boardId, name, color: newColor },
      {
        onSuccess: () => {
          setNewName('');
          setCreating(false);
        },
      },
    );
  };

  return (
    <div>
      {/* Section header */}
      <div className="mb-1.5 flex items-center gap-2">
        <Tag className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Labels</span>
      </div>

      {/* Current labels */}
      <div className="flex flex-wrap gap-1">
        {(card.labels || []).map((label) => (
          <LabelBadge key={label.id} label={label} />
        ))}

        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="inline-flex h-5 items-center gap-1 rounded-full border border-dashed border-border px-2 text-[11px] text-muted-foreground transition-colors hover:border-sb-brand/40 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              className="z-50 w-60 rounded-lg border border-border bg-card p-3 shadow-xl"
              sideOffset={4}
              align="start"
            >
              <p className="mb-2 text-xs font-medium text-foreground">Labels</p>

              {/* Label list */}
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {allLabels.map((label) => {
                  const isActive = cardLabelIds.has(label.id);
                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => handleToggleLabel(label.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted/50',
                        isActive && 'bg-muted/30',
                      )}
                    >
                      <span
                        className="h-4 w-4 flex-shrink-0 rounded"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="flex-1 truncate text-foreground">{label.name}</span>
                      {isActive && <Check className="h-3 w-3 flex-shrink-0 text-sb-brand" />}
                    </button>
                  );
                })}
              </div>

              {allLabels.length === 0 && !creating && (
                <p className="py-2 text-center text-xs text-muted-foreground">No labels yet</p>
              )}

              {/* Create new label */}
              {creating ? (
                <div className="mt-2 space-y-2 border-t border-border pt-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateLabel();
                      if (e.key === 'Escape') setCreating(false);
                    }}
                    placeholder="Label name..."
                    className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
                    autoFocus
                  />

                  {/* Color picker */}
                  <div className="flex flex-wrap gap-1.5">
                    {LABEL_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewColor(color)}
                        className={cn(
                          'h-5 w-5 rounded-full transition-transform',
                          newColor === color && 'ring-2 ring-white ring-offset-1 ring-offset-card scale-110',
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleCreateLabel}
                      disabled={createLabel.isPending || !newName.trim()}
                      className="h-6 text-xs"
                    >
                      Create
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreating(false)}
                      className="h-6 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="mt-2 flex w-full items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  Create new label
                </button>
              )}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
}
