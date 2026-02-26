import { Search, X, Filter } from 'lucide-react';
import type { Board } from '@shared/types';
import type { BoardFilters as BoardFiltersType } from '@/hooks/useBoardFilters';
import { cn } from '@/lib/utils';

const PRIORITIES = [
  { value: 'low', label: 'Low', className: 'bg-gray-400' },
  { value: 'medium', label: 'Medium', className: 'bg-blue-400' },
  { value: 'high', label: 'High', className: 'bg-orange-400' },
  { value: 'urgent', label: 'Urgent', className: 'bg-red-500' },
];

interface BoardFiltersProps {
  board: Board;
  filters: BoardFiltersType;
  hasActiveFilters: boolean;
  onSearchChange: (search: string) => void;
  onAssigneeChange: (assigneeId: string | null) => void;
  onLabelChange: (labelId: string | null) => void;
  onPriorityChange: (priority: string | null) => void;
  onClear: () => void;
  members?: Array<{ id: string; display_name: string | null; email: string }>;
}

export function BoardFilters({
  board,
  filters,
  hasActiveFilters,
  onSearchChange,
  onAssigneeChange,
  onLabelChange,
  onPriorityChange,
  onClear,
  members,
}: BoardFiltersProps) {
  const labels = board.labels ?? [];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search cards..."
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-48 rounded-md border border-border bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-sb-brand"
        />
      </div>

      {/* Assignee dropdown */}
      {members && members.length > 0 && (
        <select
          value={filters.assigneeId ?? ''}
          onChange={(e) => onAssigneeChange(e.target.value || null)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.display_name || m.email}
            </option>
          ))}
        </select>
      )}

      {/* Label dropdown */}
      {labels.length > 0 && (
        <select
          value={filters.labelId ?? ''}
          onChange={(e) => onLabelChange(e.target.value || null)}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
        >
          <option value="">All labels</option>
          {labels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      )}

      {/* Priority dropdown */}
      <select
        value={filters.priority ?? ''}
        onChange={(e) => onPriorityChange(e.target.value || null)}
        className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'flex h-8 items-center gap-1 rounded-md border border-border bg-muted/50 px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          )}
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}
    </div>
  );
}
