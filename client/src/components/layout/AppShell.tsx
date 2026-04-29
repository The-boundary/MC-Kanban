import { type ReactNode, useMemo } from 'react';

import { MissionControlAppShell } from '@the-boundary/design-system';

import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: ReactNode;
  fullWidth?: boolean;
}

export function AppShell({ children, fullWidth = false }: AppShellProps) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const wideMode = useUIStore((state) => state.wideMode);

  const contentClassName = useMemo(
    () =>
      cn(
        'w-full min-w-0 p-4 sm:p-6 lg:p-8',
        fullWidth || wideMode ? 'mx-0 max-w-none' : 'mx-auto max-w-7xl',
      ),
    [fullWidth, wideMode],
  );

  return (
    <MissionControlAppShell
      sidebar={<Sidebar />}
      collapsed={sidebarCollapsed}
      contentClassName={contentClassName}
    >
      {children}
    </MissionControlAppShell>
  );
}
