import React, { useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface NotificationBellProps {
  hasNotifications?: boolean;
}

const mockNotifications = [
  {
    id: 1,
    title: 'New Order Received',
    description: 'Order #ORD-2044 was just placed by Mark Reyes.',
    time: '2 mins ago',
    unread: true,
  },
  {
    id: 2,
    title: 'Payment Confirmed',
    description: 'Payment for order #ORD-2041 has been received.',
    time: '1 hour ago',
    unread: true,
  },
  {
    id: 3,
    title: 'Low Stock Alert',
    description: 'Evergreen Blackout Blinds is running low on stock.',
    time: '3 hours ago',
    unread: false,
  },
];

export const NotificationBell: React.FC<NotificationBellProps> = ({ hasNotifications = true }) => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;
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
            <Button variant="ghost" className="h-auto p-0 text-xs text-primary hover:bg-transparent" onClick={markAllAsRead}>
              <Check className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </div>
        <div className="flex flex-col max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col gap-1 ${notification.unread ? 'bg-primary/5' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium leading-none text-foreground">{notification.title}</p>
                  {notification.unread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-0.5"></span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{notification.description}</p>
                <p className="text-[10px] font-medium text-muted-foreground/70 mt-1">{notification.time}</p>
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
