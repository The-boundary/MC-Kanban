import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type User = {
  id: string;
  email?: string | null;
  user_metadata?: unknown;
};

type Session = {
  user: User;
} | null;

type AuthError = {
  message: string;
};

type AppAccess = {
  role_slug: string;
  role_name: string;
  is_admin: boolean;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  access: AppAccess | null;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshAccess: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Safely parse an unknown access payload into AppAccess or null. */
function parseAccess(raw: unknown): AppAccess | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const a = raw as Record<string, unknown>;
  return {
    role_slug: String(a.role_slug ?? ''),
    role_name: String(a.role_name ?? ''),
    is_admin: Boolean(a.is_admin),
  };
}

/** Safely parse an unknown user payload into User or null. */
function parseUser(raw: unknown): User | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const u = raw as Record<string, unknown>;
  const id = typeof u.id === 'string' ? u.id : '';
  if (!id) return null;
  return {
    id,
    email: typeof u.email === 'string' ? u.email : null,
    user_metadata: u.user_metadata ?? null,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AppAccess | null>(null);

  const refreshAccess = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      if (!res.ok) return;
      const data: unknown = await res.json();
      if (typeof data !== 'object' || data === null) return;
      const obj = data as Record<string, unknown>;
      setAccess(parseAccess(obj.access));
    } catch {
      setAccess(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const payload: unknown = res.ok ? await res.json() : null;
        if (!mounted) return;

        if (typeof payload !== 'object' || payload === null) {
          setSession(null);
          setUser(null);
          setAccess(null);
          setLoading(false);
          return;
        }

        const obj = payload as Record<string, unknown>;
        const sess =
          typeof obj.session === 'object' && obj.session !== null
            ? (obj.session as Record<string, unknown>)
            : null;
        const parsedUser = sess ? parseUser(sess.user) : null;

        setUser(parsedUser);
        setSession(parsedUser ? { user: parsedUser } : null);
        setAccess(parseAccess(obj.access));
        setLoading(false);
      } catch (err) {
        // Gracefully handle AbortError from Web Locks API (navigation during auth)
        if (err instanceof Error && err.name === 'AbortError') {
          console.debug('Auth initialization aborted (navigation or unmount)');
          return;
        }
        console.error('Auth initialization error:', err);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    window.location.assign('/api/auth/login/google');
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setSession(null);
      setUser(null);
      setAccess(null);
      return { error: null };
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Sign out failed' } };
    }
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      session,
      loading,
      access,
      signInWithGoogle,
      signOut,
      refreshAccess,
    }),
    [user, session, loading, access, signInWithGoogle, signOut, refreshAccess],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
