import { useState, useCallback, useMemo } from 'react';
import type { Card } from '@shared/types';

export interface BoardFilters {
  search: string;
  assigneeId: string | null;
  labelId: string | null;
  priority: string | null;
}

const INITIAL_FILTERS: BoardFilters = {
  search: '',
  assigneeId: null,
  labelId: null,
  priority: null,
};

export function useBoardFilters() {
  const [filters, setFilters] = useState<BoardFilters>(INITIAL_FILTERS);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  const setAssigneeId = useCallback((assigneeId: string | null) => {
    setFilters((prev) => ({ ...prev, assigneeId }));
  }, []);

  const setLabelId = useCallback((labelId: string | null) => {
    setFilters((prev) => ({ ...prev, labelId }));
  }, []);

  const setPriority = useCallback((priority: string | null) => {
    setFilters((prev) => ({ ...prev, priority }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.search !== '' ||
      filters.assigneeId !== null ||
      filters.labelId !== null ||
      filters.priority !== null,
    [filters],
  );

  const filterCards = useCallback(
    (cards: Card[]): Card[] => {
      return cards.filter((card) => {
        // Search filter (title and description)
        if (filters.search) {
          const query = filters.search.toLowerCase();
          const titleMatch = card.title.toLowerCase().includes(query);
          const descMatch = card.description?.toLowerCase().includes(query) ?? false;
          if (!titleMatch && !descMatch) return false;
        }

        // Assignee filter
        if (filters.assigneeId) {
          if (card.assignee_id !== filters.assigneeId) return false;
        }

        // Label filter
        if (filters.labelId) {
          const hasLabel = card.labels?.some((l) => l.id === filters.labelId);
          if (!hasLabel) return false;
        }

        // Priority filter
        if (filters.priority) {
          if (card.priority !== filters.priority) return false;
        }

        return true;
      });
    },
    [filters],
  );

  return {
    filters,
    setSearch,
    setAssigneeId,
    setLabelId,
    setPriority,
    clearFilters,
    hasActiveFilters,
    filterCards,
  };
}
