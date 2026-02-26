import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Home, LogOut, LayoutGrid, FolderKanban, User, Users, Plus } from 'lucide-react';

import {
  MissionControlSidebar,
  SidebarMobileMenuButton,
  type SidebarSection,
  type SidebarUserAction,
} from '@the-boundary/design-system';

import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/context/AuthContext';
import { useApps } from '@/hooks/api/apps';
import { useProjects } from '@/hooks/api/projects';
import { useBoards, useCreateBoard } from '@/hooks/api/boards';

const SHORT_COMMIT_HASH =
  typeof __GIT_COMMIT_HASH__ === 'string' && __GIT_COMMIT_HASH__
    ? __GIT_COMMIT_HASH__.slice(0, 7)
    : 'dev';

function getDisplayName(user: { email?: string | null; user_metadata?: unknown } | null): string {
  const meta = user?.user_metadata;
  const fullName =
    typeof meta === 'object' &&
    meta !== null &&
    typeof (meta as Record<string, unknown>).full_name === 'string'
      ? ((meta as Record<string, unknown>).full_name as string)
      : null;

  return fullName?.trim() || user?.email?.split('@')[0] || 'User';
}

export function MobileMenuButton() {
  const setSidebarMobileOpen = useUIStore((state) => state.setSidebarMobileOpen);
  const handleOpen = useCallback(() => setSidebarMobileOpen(true), [setSidebarMobileOpen]);
  return <SidebarMobileMenuButton onOpen={handleOpen} />;
}

export function Sidebar() {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const sidebarMobileOpen = useUIStore((state) => state.sidebarMobileOpen);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const setSidebarMobileOpen = useUIStore((state) => state.setSidebarMobileOpen);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: apps } = useApps();
  const { data: projects } = useProjects();
  const { data: personalBoards } = useBoards('personal');
  const createBoard = useCreateBoard();

  const [isCreating, setIsCreating] = useState(false);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate('/auth/login');
  }, [signOut, navigate]);

  const handleNavigateItem = useCallback(
    (item: { href: string | null }) => {
      if (item.href) navigate(item.href);
    },
    [navigate],
  );

  const handleNewBoard = useCallback(async () => {
    if (isCreating) return;
    const title = window.prompt('New board title:');
    if (!title?.trim()) return;
    setIsCreating(true);
    try {
      const board = await createBoard.mutateAsync({ title: title.trim() });
      navigate(`/board/${board.id}`);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, createBoard, navigate]);

  const sections: SidebarSection[] = useMemo(() => {
    const result: SidebarSection[] = [
      {
        key: 'main',
        items: [
          {
            key: 'dashboard',
            label: 'Dashboard',
            href: '/',
            icon: <Home className="h-4 w-4" />,
            match: 'exact' as const,
          },
        ],
      },
    ];

    // App boards
    if (apps && apps.length > 0) {
      result.push({
        key: 'apps',
        label: 'App Boards',
        items: apps.map((app) => ({
          key: `app-${app.slug}`,
          label: app.name,
          href: `/board/app/${app.slug}`,
          icon: <LayoutGrid className="h-4 w-4" />,
          match: 'prefix' as const,
        })),
      });
    }

    // Project boards
    if (projects && projects.length > 0) {
      result.push({
        key: 'projects',
        label: 'Project Boards',
        items: projects.slice(0, 20).map((p) => ({
          key: `project-${p.kantata_id}`,
          label: p.title,
          href: `/board/project/${p.kantata_id}`,
          icon: <FolderKanban className="h-4 w-4" />,
          match: 'prefix' as const,
        })),
      });
    }

    // Personal boards
    const myBoards = personalBoards?.filter((b) => b.created_by === user?.id) || [];
    const sharedBoards = personalBoards?.filter((b) => b.created_by !== user?.id) || [];

    if (myBoards.length > 0 || true) {
      result.push({
        key: 'personal',
        label: 'My Boards',
        items: [
          ...myBoards.map((b) => ({
            key: `board-${b.id}`,
            label: b.title,
            href: `/board/${b.id}`,
            icon: <User className="h-4 w-4" />,
            match: 'prefix' as const,
          })),
          {
            key: 'new-board',
            label: '+ New Board',
            href: null,
            icon: <Plus className="h-4 w-4" />,
          },
        ],
      });
    }

    // Shared with me
    if (sharedBoards.length > 0) {
      result.push({
        key: 'shared',
        label: 'Shared With Me',
        items: sharedBoards.map((b) => ({
          key: `shared-${b.id}`,
          label: b.title,
          href: `/board/${b.id}`,
          icon: <Users className="h-4 w-4" />,
          match: 'prefix' as const,
        })),
      });
    }

    return result;
  }, [apps, projects, personalBoards, user?.id]);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const email = user?.email ?? '';
  const userInfo = useMemo(() => ({ name: displayName, email }), [displayName, email]);

  const userActions: SidebarUserAction[] = useMemo(
    () => [
      {
        key: 'logout',
        label: 'Log out',
        icon: LogOut,
        onSelect: handleSignOut,
      },
    ],
    [handleSignOut],
  );

  const handleNavigate = useCallback(
    (item: { href: string | null; key: string }) => {
      if (item.key === 'new-board') {
        handleNewBoard();
        return;
      }
      handleNavigateItem(item);
    },
    [handleNavigateItem, handleNewBoard],
  );

  return (
    <MissionControlSidebar
      brandAlt="Kanban"
      sections={sections}
      pathname={location.pathname}
      collapsed={sidebarCollapsed}
      mobileOpen={sidebarMobileOpen}
      onToggleCollapsed={toggleSidebar}
      onMobileOpenChange={setSidebarMobileOpen}
      onNavigateItem={handleNavigate}
      user={userInfo}
      userActions={userActions}
      commitHash={SHORT_COMMIT_HASH}
      statusLabel="Connected"
    />
  );
}
