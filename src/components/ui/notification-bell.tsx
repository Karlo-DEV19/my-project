'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosApiClient } from '@/app/api/axiosApiClient';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Notification } from '@/schema/notifications/notifications.schema';

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  role: 'admin' | 'customer';
  /** Required when role === 'customer'. The user's UUID from localStorage. */
  userId?: string;
  hasNotifications?: boolean;
}

// ─── Unified display type ─────────────────────────────────────────────────────

type NotifItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  is_read: boolean;
  type: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(dateString: Date | string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function toNotifItem(n: Notification): NotifItem {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    time: formatTimeAgo(n.createdAt),
    is_read: n.isRead,
    type: n.type ?? 'system',
  };
}

// ─── useNotifications hook ────────────────────────────────────────────────────

function useNotifications(role: 'admin' | 'customer', userId?: string) {
  const queryClient = useQueryClient();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  // ── Admin: fetch all notifications ──────────────────────────────────────────
  const { data: adminRaw = [], isLoading: adminLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosApiClient.get<{ success: boolean; data: Notification[] }>(
        '/notifications'
      );
      return res.data.data;
    },
    enabled: role === 'admin',
    refetchInterval: 30_000,
  });

  // ── Customer: fetch user-specific + global notifications ────────────────────
  const { data: customerRaw = [], isLoading: customerLoading } = useQuery<Notification[]>({
    queryKey: ['customer-notifications', userId],
    queryFn: async () => {
      const res = await axiosApiClient.get<{ success: boolean; data: Notification[] }>(
        `/notifications/user/${userId}`
      );
      return res.data.data;
    },
    enabled: role === 'customer' && !!userId,
    refetchInterval: 30_000,
  });

  // ── Admin: Supabase real-time for instant push ───────────────────────────────
  useEffect(() => {
    if (role !== 'admin') return;

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Supabase real-time returns raw DB column names (snake_case),
          // so we must read target_role, NOT targetRole
          const raw = payload.new as Record<string, unknown>;
          if (raw['target_role'] !== 'admin') return;
          queryClient.setQueryData<Notification[]>(['notifications'], (prev = []) => [
            raw as unknown as Notification,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, role]);

  // ── Admin mutations ──────────────────────────────────────────────────────────
  const adminMarkAllMutation = useMutation({
    mutationFn: async () => {
      await axiosApiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const adminMarkOneMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosApiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // ── Customer mutations ───────────────────────────────────────────────────────
  const customerMarkAllMutation = useMutation({
    mutationFn: async () => {
      await axiosApiClient.patch(`/notifications/user/${userId}/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notifications', userId] });
    },
  });

  const customerMarkOneMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosApiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: (_data, id) => {
      // Optimistic local update — avoids a full refetch round-trip
      queryClient.setQueryData<Notification[]>(
        ['customer-notifications', userId],
        (prev = []) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    },
  });

  // ── Assemble return value ────────────────────────────────────────────────────
  if (role === 'customer') {
    return {
      items: customerRaw.map(toNotifItem),
      isLoading: customerLoading,
      markAllRead: () => customerMarkAllMutation.mutate(),
      markRead: (id: string) => customerMarkOneMutation.mutate(id),
      isPendingMarkAll: customerMarkAllMutation.isPending,
    };
  }

  return {
    items: adminRaw.map(toNotifItem),
    isLoading: adminLoading,
    markAllRead: () => adminMarkAllMutation.mutate(),
    markRead: (id: string) => adminMarkOneMutation.mutate(id),
    isPendingMarkAll: adminMarkAllMutation.isPending,
  };
}

// ─── NotificationItem ─────────────────────────────────────────────────────────

function NotificationItem({
  item,
  onRead,
  isFullView,
}: {
  item: NotifItem;
  onRead: (id: string) => void;
  isFullView: boolean;
}) {
  return (
    <div
      onClick={() => {
        if (!item.is_read) onRead(item.id);
      }}
      className={[
        'border-b border-border/50 last:border-0 flex flex-col gap-1',
        'hover:bg-muted/50 transition-colors',
        isFullView ? 'px-5 py-4' : 'px-4 py-3',
        !item.is_read ? 'cursor-pointer bg-primary/5' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-none text-foreground text-sm">
          {item.title}
        </p>
        {!item.is_read && (
          <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        )}
      </div>
      <p className="text-muted-foreground leading-relaxed text-xs">{item.message}</p>
      <p className="mt-1 text-[10px] font-medium text-muted-foreground/70">{item.time}</p>
    </div>
  );
}

// ─── NotificationDropdown ─────────────────────────────────────────────────────

function NotificationDropdown({
  items,
  isLoading,
  onMarkAllRead,
  onMarkRead,
  isPendingMarkAll,
  isFullView,
}: {
  items: NotifItem[];
  isLoading: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  isPendingMarkAll: boolean;
  isFullView: boolean;
}) {
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <>
      {/* ── Header ── */}
      <div
        className={[
          'flex items-center justify-between border-b border-border',
          isFullView ? 'px-5 py-4' : 'px-4 py-3',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <h3
            className={[
              'font-semibold',
              isFullView ? 'text-base' : 'text-sm',
            ].join(' ')}
          >
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            className="h-auto p-0 text-xs text-primary hover:bg-transparent"
            onClick={onMarkAllRead}
            disabled={isPendingMarkAll}
          >
            {isPendingMarkAll ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Check className="h-3 w-3 mr-1" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* ── Scrollable list ── */}
      <div
        className={[
          'flex flex-col overflow-y-auto transition-all duration-300',
          isFullView ? 'max-h-[480px]' : 'max-h-[300px]',
        ].join(' ')}
      >
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : items.length > 0 ? (
          items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onRead={onMarkRead}
              isFullView={isFullView}
            />
          ))
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        )}
      </div>

      {/* ── Footer — hidden in full view ── */}
      {!isFullView && (
        <div className="border-t border-border bg-muted/20 p-2">
          <Button variant="ghost" className="w-full h-8 text-xs font-medium">
            View all notifications
          </Button>
        </div>
      )}
    </>
  );
}

// ─── NotificationBell (main export) ──────────────────────────────────────────

export const NotificationBell: React.FC<NotificationBellProps> = ({
  role,
  userId,
  hasNotifications = true,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isFullView, setIsFullView] = useState(false);

  // ── Detect URL query params → auto-open in full-view mode ─────────────────
  useEffect(() => {
    const shouldOpen = searchParams.get('openNotifications') === 'true';
    const shouldFullView = searchParams.get('view') === 'full';

    if (shouldOpen) setIsOpen(true);
    if (shouldFullView) setIsFullView(true);

    if (shouldOpen || shouldFullView) {
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);

  // ── Close → also reset full-view ──────────────────────────────────────────
  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) setIsFullView(false);
  }

  const { items, isLoading, markAllRead, markRead, isPendingMarkAll } =
    useNotifications(role, userId);

  const unreadCount = items.filter((n) => !n.is_read).length;
  const showBadge = hasNotifications && unreadCount > 0;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {showBadge && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-background animate-pulse" />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className={[
          'p-0 rounded-xl shadow-lg border border-border overflow-hidden',
          'transition-all duration-300 ease-out',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
          isFullView ? 'w-[420px]' : 'w-80',
        ].join(' ')}
      >
        <NotificationDropdown
          items={items}
          isLoading={isLoading}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          isPendingMarkAll={isPendingMarkAll}
          isFullView={isFullView}
        />
      </PopoverContent>
    </Popover>
  );
};