import { useCallback } from 'react';
import { Archive, Trash2 } from 'lucide-react';
import { useUpdateCard, useDeleteCard } from '@/hooks/api/cards';
import { UserPicker } from '@/components/shared/UserPicker';
import { DatePicker } from '@/components/shared/DatePicker';
import { PriorityBadge } from '@/components/shared/PriorityBadge';
import { CardLabels } from './CardLabels';
import { Button } from '@/components/ui/button';
import type { Card, Priority } from '@shared/types';

const PRIORITIES: Array<{ value: Priority | 'none'; label: string }> = [
  { value: 'none', label: 'No priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

interface CardSidebarProps {
  card: Card;
  boardId: string;
  onClose: () => void;
}

export function CardSidebar({ card, boardId, onClose }: CardSidebarProps) {
  const updateCard = useUpdateCard();
  const deleteCard = useDeleteCard();

  const handleFieldChange = useCallback(
    (field: string, value: unknown) => {
      updateCard.mutate({ id: card.id, [field]: value });
    },
    [card.id, updateCard],
  );

  const handleArchive = () => {
    updateCard.mutate(
      { id: card.id, is_archived: !card.is_archived },
      { onSuccess: () => card.is_archived && onClose() },
    );
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this card? This cannot be undone.')) return;
    deleteCard.mutate(card.id, { onSuccess: onClose });
  };

  return (
    <div className="space-y-5">
      {/* Assignee */}
      <div>
        <UserPicker
          label="Assignee"
          value={card.assignee_id}
          onChange={(userId) => handleFieldChange('assignee_id', userId)}
        />
      </div>

      {/* Labels */}
      <CardLabels card={card} boardId={boardId} />

      {/* Due Date */}
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Due Date</span>
        <DatePicker
          value={card.due_date}
          onChange={(date) => handleFieldChange('due_date', date)}
        />
      </div>

      {/* Priority */}
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Priority</span>
        <div className="flex items-center gap-2">
          <select
            value={card.priority ?? 'none'}
            onChange={(e) => {
              const val = e.target.value;
              handleFieldChange('priority', val === 'none' ? null : val);
            }}
            className="h-8 flex-1 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
          >
            {PRIORITIES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <PriorityBadge priority={card.priority} />
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Actions */}
      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">Actions</span>
        <div className="space-y-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchive}
            className="w-full justify-start text-muted-foreground"
          >
            <Archive className="mr-2 h-3.5 w-3.5" />
            {card.is_archived ? 'Unarchive' : 'Archive'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="w-full justify-start text-red-400 hover:text-red-300"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
