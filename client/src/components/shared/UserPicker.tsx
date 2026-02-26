import { useState, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, X, Search } from 'lucide-react';
import { useUsers } from '@/hooks/api/users';
import { cn } from '@/lib/utils';

interface UserPickerProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  label?: string;
}

export function UserPicker({ value, onChange, label }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data: users = [] } = useUsers();

  const selectedUser = useMemo(
    () => users.find((u) => u.id === value) ?? null,
    [users, value],
  );

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.display_name?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, search]);

  const displayName = (u: { display_name: string | null; full_name: string | null; email: string }) =>
    u.display_name || u.full_name || u.email;

  const initial = (u: { display_name: string | null; full_name: string | null; email: string }) => {
    const name = displayName(u);
    return name.charAt(0).toUpperCase();
  };

  return (
    <div>
      {label && (
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-2 text-xs text-foreground hover:border-sb-brand/40 focus:outline-none focus:ring-1 focus:ring-sb-brand"
          >
            {selectedUser ? (
              <div className="flex items-center gap-2 truncate">
                {selectedUser.avatar_url ? (
                  <img
                    src={selectedUser.avatar_url}
                    alt=""
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-sb-brand/20 text-[9px] font-medium text-sb-brand">
                    {initial(selectedUser)}
                  </div>
                )}
                <span className="truncate">{displayName(selectedUser)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Unassigned</span>
            )}
            <ChevronDown className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="z-50 w-56 rounded-lg border border-border bg-card p-2 shadow-xl"
            sideOffset={4}
            align="start"
          >
            {/* Search input */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 w-full rounded-md border border-border bg-background pl-7 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sb-brand"
                autoFocus
              />
            </div>

            {/* Unassign option */}
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
              >
                <X className="h-3 w-3" />
                <span>Unassign</span>
              </button>
            )}

            {/* User list */}
            <div className="max-h-48 overflow-y-auto">
              {filtered.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    onChange(user.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50',
                    user.id === value ? 'bg-sb-brand/10 text-sb-brand' : 'text-foreground',
                  )}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sb-brand/20 text-[10px] font-medium text-sb-brand">
                      {initial(user)}
                    </div>
                  )}
                  <span className="truncate">{displayName(user)}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">No users found</p>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
