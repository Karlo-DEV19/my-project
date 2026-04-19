'use client';

import { LogOut, Package, Settings, User } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type StoredUser = {
  id: string;
  name?: string;
  email?: string;
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

type AccountButtonProps = {
  onClick: () => void;
};

const AccountButton = React.forwardRef<HTMLButtonElement, AccountButtonProps>(
  ({ onClick }, ref) => {
    const [user, setUser] = useState<StoredUser | null>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Read user from localStorage on mount
    useEffect(() => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {
        // corrupted storage — ignore
      }
    }, []);

    // Listen for login/logout events from account-form
    useEffect(() => {
      function onStorage(e: StorageEvent) {
        if (e.key !== 'user') return;
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
      if (!dropdownOpen) return;
      function onClickOutside(e: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setDropdownOpen(false);
        }
      }
      document.addEventListener('mousedown', onClickOutside);
      return () => document.removeEventListener('mousedown', onClickOutside);
    }, [dropdownOpen]);

    function handleLogout() {
      localStorage.removeItem('user');
      setUser(null);
      setDropdownOpen(false);
    }

    // ── Logged-in view: initials avatar + dropdown ────────────────────────────
    if (user) {
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label={`Account menu for ${user.name ?? user.email}`}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            {getInitials(user.name)}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-border bg-background shadow-xl z-[300] animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">

              {/* Email — muted, non-interactive */}
              <div className="px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground truncate">
                  {user.email ?? 'No email'}
                </p>
              </div>

              {/* Nav items */}
              <div className="flex flex-col">
                <button
                  onClick={() => { setDropdownOpen(false); router.push('/profile'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors focus:outline-none focus:bg-accent"
                >
                  <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  Profile
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push('/profile?tab=settings'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors focus:outline-none focus:bg-accent"
                >
                  <Settings className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  Settings
                </button>

                <button
                  onClick={() => { setDropdownOpen(false); router.push('/profile?tab=orders'); }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent transition-colors focus:outline-none focus:bg-accent"
                >
                  <Package className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  My Orders
                </button>

                {/* Logout — destructive */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus:bg-destructive/10"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  Log out
                </button>
              </div>

            </div>
          )}
        </div>
      );
    }

    // ── Logged-out view: original icon button ────────────────────────────────
    return (
      <button
        ref={ref}
        onClick={onClick}
        className="relative flex items-center justify-center w-10 h-10 text-foreground hover:bg-accent transition-colors border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-ring"
        aria-label="Open account"
        aria-haspopup="dialog"
      >
        <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
      </button>
    );
  }
);

AccountButton.displayName = 'AccountButton';

export default AccountButton;
