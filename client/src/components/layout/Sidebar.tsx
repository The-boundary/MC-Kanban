import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Home, LayoutDashboard, LogOut, Settings } from 'lucide-react';

import {
  MissionControlSidebar,
  SidebarMobileMenuButton,
  type SidebarSection,
  type SidebarUserAction,
} from '@the-boundary/design-system';

import { useUIStore } from '@/stores/ui-store';
import { useAuth } from '@/context/AuthContext';

const sections: SidebarSection[] = [
  {
    key: 'main',
    items: [
      { key: 'dashboard', label: 'Dashboard', href: '/', icon: <Home className="h-4 w-4" /> },
      {
        key: 'boards',
        label: 'Boards',
        href: '/',
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ],
  },
];

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

  return (
    <MissionControlSidebar
      brandAlt="Kanban"
      sections={sections}
      pathname={location.pathname}
      collapsed={sidebarCollapsed}
      mobileOpen={sidebarMobileOpen}
      onToggleCollapsed={toggleSidebar}
      onMobileOpenChange={setSidebarMobileOpen}
      onNavigateItem={handleNavigateItem}
      user={userInfo}
      userActions={userActions}
      commitHash={SHORT_COMMIT_HASH}
      statusLabel="Connected"
    />
  );
}
