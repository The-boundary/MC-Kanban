import { useMemo } from 'react';
import { formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: string | null;
  onChange: (date: string | null) => void;
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const relativeText = useMemo(() => {
    if (!value) return null;
    const date = parseISO(value);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return `Overdue by ${formatDistanceToNow(date)}`;
    return `in ${formatDistanceToNow(date)}`;
  }, [value]);

  const isOverdue = useMemo(() => {
    if (!value) return false;
    const date = parseISO(value);
    return isPast(date) && !isToday(date);
  }, [value]);

  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
          <Calendar className={cn('h-3.5 w-3.5', isOverdue ? 'text-red-400' : 'text-muted-foreground')} />
        </div>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand [&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>
      {relativeText && (
        <span className={cn('text-[11px]', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
          {relativeText}
        </span>
      )}
    </div>
  );
}
