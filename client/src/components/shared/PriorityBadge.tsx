import { cn } from '@/lib/utils';
import type { Priority } from '@shared/types';

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  urgent: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

interface PriorityBadgeProps {
  priority: Priority | null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  if (!priority) return null;

  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
        style.bg,
        style.text,
      )}
    >
      {priority}
    </span>
  );
}
