import type { Label } from '@shared/types';

interface LabelBadgeProps {
  label: Label;
}

export function LabelBadge({ label }: LabelBadgeProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: label.color }}
    >
      {label.name}
    </span>
  );
}
