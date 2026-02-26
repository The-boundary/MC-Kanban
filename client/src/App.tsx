import { Suspense, lazy } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

const LoginPage = lazy(() =>
  import('./pages/Auth/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const BoardPage = lazy(() =>
  import('./pages/BoardPage').then((m) => ({ default: m.BoardPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function RouteFallback() {
  return <div className="h-24 animate-pulse rounded-lg border border-border/50 bg-card/40" />;
}

function AppShellLayout() {
  const location = useLocation();
  return (
    <AppShell>
      <div key={location.pathname} className="animate-kanban-rise">
        <Outlet />
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/auth/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShellLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/board/:id" element={<BoardPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
