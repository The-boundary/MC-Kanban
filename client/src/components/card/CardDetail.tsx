import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { useCard, useUpdateCard } from '@/hooks/api/cards';
import { CardDescription } from './CardDescription';
import { CardChecklist } from './CardChecklist';
import { CardComments } from './CardComments';
import { CardActivity } from './CardActivity';
import { CardAttachments } from './CardAttachments';
import { CardSidebar } from './CardSidebar';
import { cn } from '@/lib/utils';

interface CardDetailProps {
  cardId: string;
  boardId: string;
  open: boolean;
  onClose: () => void;
}

export function CardDetail({ cardId, boardId, open, onClose }: CardDetailProps) {
  const { data: card, isLoading, error } = useCard(open ? cardId : undefined);

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-[900px] translate-x-[-50%] translate-y-[-50%]',
            'max-h-[90vh] overflow-hidden rounded-xl border border-border bg-card shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          )}
        >
          {/* Close button */}
          <Dialog.Close asChild>
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </Dialog.Close>

          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex h-60 items-center justify-center">
              <p className="text-sm text-red-400">Failed to load card</p>
            </div>
          ) : card ? (
            <CardDetailContent card={card} boardId={boardId} onClose={onClose} />
          ) : null}

          <Dialog.Title className="sr-only">Card Detail</Dialog.Title>
          <Dialog.Description className="sr-only">
            View and edit card details
          </Dialog.Description>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// --- Inner content (only rendered when card is loaded) ---

interface CardDetailContentProps {
  card: NonNullable<ReturnType<typeof useCard>['data']>;
  boardId: string;
  onClose: () => void;
}

function CardDetailContent({ card, boardId, onClose }: CardDetailContentProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const updateCard = useUpdateCard();

  // Sync title when card data changes externally
  useEffect(() => {
    if (!editingTitle) setTitle(card.title);
  }, [card.title, editingTitle]);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  const handleTitleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== card.title) {
      updateCard.mutate({ id: card.id, title: trimmed });
    } else {
      setTitle(card.title);
    }
    setEditingTitle(false);
  };

  const checklists = card.checklists ?? [];
  const attachments = card.attachments ?? [];

  return (
    <div className="flex max-h-[90vh] flex-col">
      {/* Title section */}
      <div className="border-b border-border px-6 py-4 pr-10">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSave();
              if (e.key === 'Escape') {
                setTitle(card.title);
                setEditingTitle(false);
              }
            }}
            className="w-full rounded-md border border-border bg-background px-2 py-1 text-lg font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
          />
        ) : (
          <h2
            className="cursor-pointer text-lg font-semibold text-foreground transition-colors hover:text-sb-brand"
            onClick={() => setEditingTitle(true)}
          >
            {card.title}
          </h2>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main body (left) */}
        <div className="flex-[65] overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50">
          <div className="space-y-6">
            <CardDescription cardId={card.id} description={card.description} />

            {checklists.length > 0 && (
              <CardChecklist checklists={checklists} cardId={card.id} />
            )}

            {attachments.length > 0 && <CardAttachments attachments={attachments} />}

            <CardComments cardId={card.id} />

            <CardActivity cardId={card.id} />
          </div>
        </div>

        {/* Sidebar (right) */}
        <div className="flex-[35] border-l border-border overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50">
          <CardSidebar card={card} boardId={boardId} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
