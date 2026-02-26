import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Edit3, Trash2, Send } from 'lucide-react';
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/api/comments';
import { useAuth } from '@/context/AuthContext';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Comment } from '@shared/types';

interface CardCommentsProps {
  cardId: string;
}

export function CardComments({ cardId }: CardCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();
  const { data: comments = [] } = useComments(cardId);
  const createComment = useCreateComment();

  const sorted = [...comments].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const handleSubmit = () => {
    const body = newComment.trim();
    if (!body) return;
    createComment.mutate(
      { cardId, body },
      { onSuccess: () => setNewComment('') },
    );
  };

  return (
    <div>
      {/* Section header */}
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-foreground">Comments</h3>
        {sorted.length > 0 && (
          <span className="text-xs text-muted-foreground">({sorted.length})</span>
        )}
      </div>

      {/* New comment input */}
      <div className="mb-4 space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Write a comment... (Markdown supported)"
          className="min-h-[72px] w-full resize-none rounded-md border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
        />
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Ctrl+Enter to send</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!newComment.trim() || createComment.isPending}
          >
            <Send className="mr-1 h-3 w-3" />
            {createComment.isPending ? 'Sending...' : 'Comment'}
          </Button>
        </div>
      </div>

      {/* Comment list */}
      <div className="space-y-3">
        {sorted.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isOwn={comment.author_id === user?.id}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">No comments yet</p>
      )}
    </div>
  );
}

// --- Individual Comment ---

interface CommentItemProps {
  comment: Comment;
  isOwn: boolean;
}

function CommentItem({ comment, isOwn }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const authorName =
    comment.author?.display_name || comment.author?.full_name || comment.author?.email || 'Unknown';

  const initial = authorName.charAt(0).toUpperCase();

  const handleSave = () => {
    const trimmed = editBody.trim();
    if (!trimmed || trimmed === comment.body) {
      setEditBody(comment.body);
      setEditing(false);
      return;
    }
    updateComment.mutate(
      { id: comment.id, body: trimmed },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <div className="group flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {comment.author?.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sb-brand/20 text-xs font-medium text-sb-brand">
            {initial}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">{authorName}</span>
          <span className="text-[11px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {comment.updated_at !== comment.created_at && (
            <span className="text-[11px] italic text-muted-foreground">(edited)</span>
          )}

          {/* Edit/Delete actions */}
          {isOwn && !editing && (
            <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => {
                  setEditBody(comment.body);
                  setEditing(true);
                }}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                title="Edit"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => deleteComment.mutate(comment.id)}
                className="rounded p-1 text-muted-foreground hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  setEditBody(comment.body);
                  setEditing(false);
                }
              }}
              className={cn(
                'min-h-[60px] w-full resize-none rounded-md border border-border bg-background p-2 text-sm text-foreground',
                'focus:outline-none focus:ring-1 focus:ring-sb-brand',
              )}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateComment.isPending}>
                Save
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditBody(comment.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-1">
            <MarkdownRenderer content={comment.body} />
          </div>
        )}
      </div>
    </div>
  );
}
