import { useState, useRef, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, GripVertical } from 'lucide-react';
import {
  useCreateChecklist,
  useUpdateChecklist,
  useDeleteChecklist,
  useCreateChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/api/checklists';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Checklist } from '@shared/types';

interface CardChecklistProps {
  checklists: Checklist[];
  cardId: string;
}

export function CardChecklist({ checklists, cardId }: CardChecklistProps) {
  const [showNewChecklist, setShowNewChecklist] = useState(false);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const newChecklistRef = useRef<HTMLInputElement>(null);

  const createChecklist = useCreateChecklist();

  useEffect(() => {
    if (showNewChecklist && newChecklistRef.current) {
      newChecklistRef.current.focus();
    }
  }, [showNewChecklist]);

  const handleCreateChecklist = () => {
    const title = newChecklistTitle.trim();
    if (!title) return;
    createChecklist.mutate(
      { cardId, title },
      {
        onSuccess: () => {
          setNewChecklistTitle('');
          setShowNewChecklist(false);
        },
      },
    );
  };

  return (
    <div className="space-y-4">
      {checklists.map((checklist) => (
        <ChecklistSection key={checklist.id} checklist={checklist} cardId={cardId} />
      ))}

      {/* Add checklist */}
      {showNewChecklist ? (
        <div className="space-y-2">
          <input
            ref={newChecklistRef}
            type="text"
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateChecklist();
              if (e.key === 'Escape') {
                setShowNewChecklist(false);
                setNewChecklistTitle('');
              }
            }}
            placeholder="Checklist title..."
            className="h-8 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreateChecklist} disabled={createChecklist.isPending}>
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewChecklist(false);
                setNewChecklistTitle('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowNewChecklist(true)}
          className="text-muted-foreground"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add checklist
        </Button>
      )}
    </div>
  );
}

// --- Individual Checklist Section ---

interface ChecklistSectionProps {
  checklist: Checklist;
  cardId: string;
}

function ChecklistSection({ checklist }: ChecklistSectionProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(checklist.title);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const addItemRef = useRef<HTMLInputElement>(null);

  const updateChecklist = useUpdateChecklist();
  const deleteChecklist = useDeleteChecklist();
  const createItem = useCreateChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const items = [...(checklist.items || [])].sort((a, b) => a.position - b.position);
  const total = items.length;
  const checked = items.filter((i) => i.is_checked).length;
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  useEffect(() => {
    if (showAddItem && addItemRef.current) {
      addItemRef.current.focus();
    }
  }, [showAddItem]);

  const handleTitleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== checklist.title) {
      updateChecklist.mutate({ id: checklist.id, title: trimmed });
    } else {
      setTitle(checklist.title);
    }
    setEditingTitle(false);
  };

  const handleAddItem = () => {
    const t = newItemTitle.trim();
    if (!t) return;
    createItem.mutate(
      { checklistId: checklist.id, title: t },
      {
        onSuccess: () => setNewItemTitle(''),
      },
    );
  };

  return (
    <div>
      {/* Checklist header */}
      <div className="mb-2 flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        {editingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTitle(checklist.title);
                setEditingTitle(false);
              }
            }}
            className="h-6 flex-1 rounded border border-border bg-background px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
            autoFocus
          />
        ) : (
          <h4
            className="flex-1 cursor-pointer text-sm font-medium text-foreground hover:text-sb-brand"
            onClick={() => setEditingTitle(true)}
          >
            {checklist.title}
          </h4>
        )}
        <button
          type="button"
          onClick={() => deleteChecklist.mutate(checklist.id)}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Delete checklist"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">{progress}%</span>
          <div className="h-1.5 flex-1 rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progress === 100 ? 'bg-emerald-500' : 'bg-sb-brand',
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-0.5">
        {items.map((item) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            onToggle={(checked) => updateItem.mutate({ id: item.id, is_checked: checked })}
            onUpdateTitle={(title) => updateItem.mutate({ id: item.id, title })}
            onDelete={() => deleteItem.mutate(item.id)}
          />
        ))}
      </div>

      {/* Add item */}
      {showAddItem ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            ref={addItemRef}
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
              if (e.key === 'Escape') {
                setShowAddItem(false);
                setNewItemTitle('');
              }
            }}
            placeholder="Add an item..."
            className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
          />
          <Button size="sm" onClick={handleAddItem} disabled={createItem.isPending} className="h-7">
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowAddItem(false);
              setNewItemTitle('');
            }}
            className="h-7"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddItem(true)}
          className="mt-1 flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Add an item
        </button>
      )}
    </div>
  );
}

// --- Individual Checklist Item Row ---

interface ChecklistItemRowProps {
  item: { id: string; title: string; is_checked: boolean };
  onToggle: (checked: boolean) => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
}

function ChecklistItemRow({ item, onToggle, onUpdateTitle, onDelete }: ChecklistItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);

  const handleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== item.title) {
      onUpdateTitle(trimmed);
    } else {
      setTitle(item.title);
    }
    setEditing(false);
  };

  return (
    <div className="group flex items-center gap-2 rounded px-1 py-1 hover:bg-muted/30">
      <GripVertical className="h-3 w-3 flex-shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60" />
      <input
        type="checkbox"
        checked={item.is_checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-3.5 w-3.5 flex-shrink-0 cursor-pointer rounded border-border accent-sb-brand"
      />
      {editing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setTitle(item.title);
              setEditing(false);
            }
          }}
          className="h-6 flex-1 rounded border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
          autoFocus
        />
      ) : (
        <span
          className={cn(
            'flex-1 cursor-pointer text-xs',
            item.is_checked ? 'text-muted-foreground line-through' : 'text-foreground',
          )}
          onClick={() => setEditing(true)}
        >
          {item.title}
        </span>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-0.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground hover:!text-red-400"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}
