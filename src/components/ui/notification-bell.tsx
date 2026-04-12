'use client';

import React, { useEffect, useMemo } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosApiClient } from '@/app/api/axiosApiClient';
import { createBrowserClient } from '@supabase/ssr';
import type { Notification } from '@/schema/notifications/notifications.schema';

interface NotificationBellProps {
  hasNotifications?: boolean;
}

function formatTimeAgo(dateString: Date | string) {
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

export const NotificationBell: React.FC<NotificationBellProps> = ({ hasNotifications = true }) => {
  const queryClient = useQueryClient();

  const supabase = useMemo(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []
  );

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      // ✅ FIXED: was '/api/notifications' → double api bug
      const response = await axiosApiClient.get<{ success: boolean; data: Notification[] }>('/notifications');
      return response.data.data;
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          queryClient.setQueryData<Notification[]>(['notifications'], (prev = []) => [
            payload.new as Notification,
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      // ✅ FIXED: was '/api/notifications/read-all'
      await axiosApiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      // ✅ FIXED: was '/api/notifications/${id}/read'
      await axiosApiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const showBadge = hasNotifications && unreadCount > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {showBadge && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-background"></span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-xl shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              className="h-auto p-0 text-xs text-primary hover:bg-transparent"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
              Mark all as read
            </Button>
          )}
        </div>
        <div className="flex flex-col max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-8 flex justify-center items-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsReadMutation.mutate(notification.id);
                  }
                }}
                className={`px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors ${!notification.isRead ? 'cursor-pointer bg-primary/5' : ''} flex flex-col gap-1`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium leading-none text-foreground">{notification.title}</p>
                  {!notification.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-0.5"></span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{notification.message}</p>
                <p className="text-[10px] font-medium text-muted-foreground/70 mt-1">{formatTimeAgo(notification.createdAt)}</p>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          )}
        </div>
        <div className="p-2 border-t border-border bg-muted/20">
          <Button variant="ghost" className="w-full text-xs h-8 font-medium">
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};