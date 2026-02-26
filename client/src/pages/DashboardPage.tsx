import { Loader2, LayoutDashboard } from 'lucide-react';
import { useBoards } from '@/hooks/api/boards';
import { useMyCards } from '@/hooks/api/cards';
import { RecentBoards } from '@/components/dashboard/RecentBoards';
import { MyCards } from '@/components/dashboard/MyCards';
import { DueSoon } from '@/components/dashboard/DueSoon';

export function DashboardPage() {
  const { data: boards, isLoading: boardsLoading } = useBoards();
  const { data: myCards, isLoading: cardsLoading } = useMyCards();

  const isLoading = boardsLoading || cardsLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="h-6 w-6 text-sb-brand" />
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Recent Boards */}
          <section>
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Recent Boards
            </h2>
            <RecentBoards boards={boards ?? []} />
          </section>

          {/* Two-column layout for My Cards and Due Soon */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* My Cards */}
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                My Cards
              </h2>
              <div className="rounded-lg border border-border/60 bg-card/50">
                <MyCards cards={myCards ?? []} />
              </div>
            </section>

            {/* Due Soon */}
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Due Soon
              </h2>
              <div className="rounded-lg border border-border/60 bg-card/50">
                <DueSoon cards={myCards ?? []} />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
