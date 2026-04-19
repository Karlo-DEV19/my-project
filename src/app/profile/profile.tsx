'use client';

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, KeyRound, Pencil, Settings, User } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredUser = {
  id: string;
  name?: string;
  email?: string;
};

type Tab = 'profile' | 'settings' | 'orders';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Orders Section ──────────────────────────────────────────────────────────

type MockOrder = {
  id: string;
  date: string;
  total: string;
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
};

const STATUS_COLORS: Record<MockOrder['status'], string> = {
  Pending:    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  Processing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Delivered:  'bg-green-500/10 text-green-600 dark:text-green-400',
  Cancelled:  'bg-destructive/10 text-destructive',
};

const MOCK_ORDERS: MockOrder[] = [
  { id: 'MJD-00124', date: 'Apr 18, 2026', total: '₱4,500.00', status: 'Delivered'  },
  { id: 'MJD-00098', date: 'Mar 5, 2026',  total: '₱8,200.00', status: 'Processing' },
];

function OrdersSection() {
  if (MOCK_ORDERS.length === 0) {
    return (
      <CardContent className="px-6 pb-10 pt-6">
        <div className="flex flex-col items-center gap-2 py-10">
          <div className="mb-2 h-px w-8 bg-border" />
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            No orders yet
          </p>
          <p className="text-xs text-muted-foreground/60">
            Your orders will appear here once placed.
          </p>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent className="mt-2 space-y-3 px-6 pb-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
        My Orders
      </p>
      {MOCK_ORDERS.map((order) => (
        <div
          key={order.id}
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2"
        >
          {/* Order ID + status */}
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-xs font-semibold text-foreground">{order.id}</p>
            <span
              className={[
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                STATUS_COLORS[order.status],
              ].join(' ')}
            >
              {order.status}
            </span>
          </div>
          {/* Date + total */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{order.date}</p>
            <p className="text-xs font-semibold tabular-nums text-foreground">{order.total}</p>
          </div>
        </div>
      ))}
    </CardContent>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection() {
  const items: { icon: React.ReactNode; label: string; description: string }[] = [
    {
      icon: <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />,
      label: 'Change Password',
      description: 'Update your account password',
    },
    {
      icon: <Bell className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />,
      label: 'Notifications',
      description: 'Manage email and push preferences',
    },
    {
      icon: <User className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />,
      label: 'Account Settings',
      description: 'Privacy, data, and linked accounts',
    },
  ];

  return (
    <CardContent className="mt-2 space-y-2 px-6 pb-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
        Account Settings
      </p>
      {items.map(({ icon, label, description }) => (
        <button
          key={label}
          className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-left transition-colors hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {icon}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-[11px] text-muted-foreground truncate">{description}</p>
          </div>
        </button>
      ))}
    </CardContent>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive tab from URL query param; default to 'profile'
  const rawTab = searchParams.get('tab');
  const activeTab: Tab =
    rawTab === 'settings' ? 'settings'
    : rawTab === 'orders'  ? 'orders'
    : 'profile';

  const [user, setUser] = useState<StoredUser | null>(null);

  // Read from localStorage — same pattern as account-button.tsx
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored) as StoredUser);
    } catch {
      // corrupted storage — ignore
    }
  }, []);

  function switchTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'profile') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    router.replace(`/profile?${params.toString()}`);
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">You are not logged in.</p>
      </div>
    );
  }

  const initials = getInitials(user.name);
  const displayName = user.name ?? 'User';

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile',  label: 'Profile'  },
    { id: 'settings', label: 'Settings' },
    { id: 'orders',   label: 'Orders'   },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-10">

      {/* ── Back button ── */}
      <div className="mb-6 w-full max-w-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back
        </button>
      </div>

      <Card className="w-full max-w-sm rounded-xl border border-border shadow-sm">

        {/* ── Avatar + name + email ── */}
        <CardHeader className="flex flex-col items-center gap-4 pb-2 pt-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-background text-xl font-bold select-none">
            {initials}
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-base font-semibold text-foreground leading-tight">
              {displayName}
            </h1>
            <p className="text-xs text-muted-foreground truncate max-w-[220px]">
              {user.email ?? '—'}
            </p>
          </div>
        </CardHeader>

        {/* ── Tab bar ── */}
        <div className="mt-4 flex border-b border-border mx-6">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => switchTab(id)}
              className={[
                'flex-1 py-2 text-xs font-semibold uppercase tracking-[0.15em] transition-colors focus:outline-none',
                activeTab === id
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        {activeTab === 'profile' ? (
          <>
            {/* Info rows */}
            <CardContent className="mt-4 space-y-3 px-6">
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Name
                </p>
                <p className="text-sm font-medium text-foreground">{displayName}</p>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Email
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email ?? '—'}
                </p>
              </div>
            </CardContent>

            {/* Actions */}
            <CardFooter className="flex flex-col gap-2 px-6 pb-8 pt-4">
              <Button
                variant="outline"
                className="w-full h-9 rounded-none text-xs font-semibold uppercase tracking-[0.15em]"
              >
                <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
                Edit Profile
              </Button>

              <Button
                variant="ghost"
                onClick={() => switchTab('settings')}
                className="w-full h-9 rounded-none text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
              >
                <Settings className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
                Settings
              </Button>
            </CardFooter>
          </>
        ) : activeTab === 'orders' ? (
          <OrdersSection />
        ) : (
          <SettingsSection />
        )}

      </Card>
    </div>
  );
}