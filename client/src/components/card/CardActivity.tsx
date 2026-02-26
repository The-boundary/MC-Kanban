import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, MessageSquare, List } from 'lucide-react';
import { useActivity } from '@/hooks/api/activity';
import { useComments } from '@/hooks/api/comments';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { cn } from '@/lib/utils';
import type { CardActivity as CardActivityType } from '@shared/types';
import type { Comment } from '@shared/types';

type Tab = 'all' | 'comments' | 'activity';

interface CardActivityProps {
  cardId: string;
}

export function CardActivity({ cardId }: CardActivityProps) {
  const [tab, setTab] = useState<Tab>('all');
  const { data: activities = [] } = useActivity(cardId);
  const { data: comments = [] } = useComments(cardId);

  const feed = useMemo(() => {
    const items: Array<
      | { kind: 'activity'; data: CardActivityType; timestamp: string }
      | { kind: 'comment'; data: Comment; timestamp: string }
    > = [];

    if (tab === 'all' || tab === 'activity') {
      activities.forEach((a) =>
        items.push({ kind: 'activity', data: a, timestamp: a.created_at }),
      );
    }

    if (tab === 'all' || tab === 'comments') {
      comments.forEach((c) =>
        items.push({ kind: 'comment', data: c, timestamp: c.created_at }),
      );
    }

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return items;
  }, [activities, comments, tab]);

  const tabs: { value: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'all', label: 'All', icon: List },
    { value: 'comments', label: 'Comments', icon: MessageSquare },
    { value: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div>
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Activity</h3>
      </div>

      {/* Tab bar */}
      <div className="mb-3 flex gap-1 rounded-md bg-muted/30 p-0.5">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors',
              tab === value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {feed.map((item) => {
          if (item.kind === 'activity') {
            return <ActivityEntry key={`a-${item.data.id}`} activity={item.data} />;
          }
          return <CommentEntry key={`c-${item.data.id}`} comment={item.data} />;
        })}

        {feed.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No activity yet</p>
        )}
      </div>
    </div>
  );
}

// --- Activity entry ---

function ActivityEntry({ activity }: { activity: CardActivityType }) {
  const actorName =
    activity.actor?.display_name || activity.actor?.full_name || activity.actor?.email || 'Someone';

  const description = formatActivityAction(activity.action, activity.details);

  return (
    <div className="flex items-start gap-2 py-1">
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted">
        <Activity className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground">
          <span className="font-medium">{actorName}</span>{' '}
          <span className="text-muted-foreground">{description}</span>
        </p>
        <span className="text-[11px] text-muted-foreground">
          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

// --- Comment entry (compact for activity feed) ---

function CommentEntry({ comment }: { comment: Comment }) {
  const authorName =
    comment.author?.display_name || comment.author?.full_name || comment.author?.email || 'Someone';
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <div className="flex gap-2 py-1">
      <div className="flex-shrink-0">
        {comment.author?.avatar_url ? (
          <img src={comment.author.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sb-brand/20 text-[9px] font-medium text-sb-brand">
            {initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-foreground">{authorName}</span>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-foreground/80">
          <MarkdownRenderer content={comment.body} />
        </div>
      </div>
    </div>
  );
}

// --- Format activity action ---

function formatActivityAction(action: string, details: Record<string, unknown> | null): string {
  const d = details || {};

  switch (action) {
    case 'card_created':
      return 'created this card';
    case 'card_moved':
      return `moved this card from "${d.from_column || '?'}" to "${d.to_column || '?'}"`;
    case 'card_updated':
      if (d.field === 'title') return `renamed this card to "${d.new_value || ''}"`;
      if (d.field === 'priority') return `changed priority to ${d.new_value || 'none'}`;
      if (d.field === 'due_date') return d.new_value ? `set due date to ${d.new_value}` : 'removed due date';
      if (d.field === 'assignee') return d.new_value ? `assigned to ${d.new_value}` : 'unassigned this card';
      if (d.field === 'description') return 'updated the description';
      if (d.field === 'is_archived') return d.new_value ? 'archived this card' : 'unarchived this card';
      return `updated ${d.field || 'this card'}`;
    case 'label_added':
      return `added label "${d.label_name || '?'}"`;
    case 'label_removed':
      return `removed label "${d.label_name || '?'}"`;
    case 'checklist_added':
      return `added checklist "${d.title || '?'}"`;
    case 'checklist_removed':
      return `removed a checklist`;
    case 'checklist_item_completed':
      return `completed "${d.title || '?'}"`;
    case 'checklist_item_uncompleted':
      return `uncompleted "${d.title || '?'}"`;
    case 'comment_added':
      return 'added a comment';
    default:
      return action.replace(/_/g, ' ');
  }
}
