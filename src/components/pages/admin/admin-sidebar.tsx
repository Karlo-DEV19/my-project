'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    Settings,
    LogOut,
    Home,
    ClipboardList,
    ShieldCheck,
    Boxes,
    TrendingUp,
    MessageSquare 
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from '@/components/ui/sidebar';


import { LogoutDialog } from '@/components/ui/logout-alert-dialog'; // Check your exact path
import { useAuth } from '@/lib/providers/auth-provider';

type SidebarLink = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const sidebarGroups: Array<{ label: string; links: SidebarLink[] }> = [
    {
        label: 'Overview',
        links: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
    },
    {
        label: 'Operations',
        links: [
            { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
            { name: 'Products', href: '/admin/products', icon: Package },
            { name: 'Customers', href: '/admin/customers', icon: Users },
            { name: 'Inventory', href: '/admin/inventory', icon: Boxes },            
            { name: 'Chat', href: '/admin/chat', icon: MessageSquare },
        ],
    },
    {
        label: 'Analytics',
        links: [
            { name: 'Sales', href: '/admin/sales', icon: TrendingUp },
            { name: 'Logs', href: '/admin/logs', icon: ClipboardList },
            { name: 'Audit Trail', href: '/admin/audit-trail', icon: ShieldCheck },
        ],
    },
    {
        label: 'Preferences',
        links: [{ name: 'Settings', href: '/admin/settings', icon: Settings }],
    },
];

const AdminSidebar = () => {
    const pathname = usePathname();

    
    const { user } = useAuth();

    
    const renderedGroups = useMemo(() => {
        return sidebarGroups.map((group) => {
            return (
                <SidebarGroup key={group.label} className="px-0">
                    <SidebarGroupLabel className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {group.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-2">
                            {group.links.map((link) => {
                                const isActive = pathname === link.href;

                                return (
                                    <SidebarMenuItem key={link.href}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={link.name}
                                            className={`h-11 rounded-none transition-all duration-300 ${isActive
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                                                : 'text-muted-foreground hover:text-accent-foreground hover:bg-accent'
                                                }`}
                                        >
                                            <Link href={link.href} className="flex items-center gap-4 px-2">
                                                <link.icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
                                                <span className="tracking-wide font-medium text-sm">{link.name}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            );
        });
    }, [pathname]);

    return (
        <Sidebar className="border-r border-border bg-background font-sans">
            <SidebarHeader className="pt-8 pb-6 px-6 flex flex-col items-start gap-4 border-b border-border">
                <div className="flex flex-col gap-2">
                    <span className="font-serif text-2xl tracking-wide text-foreground">
                        MJ Decors
                    </span>
                    <div className="w-8 h-px bg-border"></div>
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium mt-2">
                        {user?.role === 'admin' ? 'Admin Portal' : 'Staff Portal'}
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent className="pt-6 px-4">
                <div className="space-y-3">
                    {renderedGroups}
                </div>
            </SidebarContent>

            <SidebarFooter className="p-6 border-t border-border space-y-4">
                <div className="w-8 h-px bg-border mb-4"></div>

                <SidebarMenu className="space-y-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Back to Store"
                            className="h-11 rounded-none text-muted-foreground hover:text-accent-foreground hover:bg-accent transition-all duration-300"
                        >
                            <Link href="/" className="flex items-center gap-4 px-2">
                                <Home className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                <span className="tracking-wide font-medium text-sm">Back to Store</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <LogoutDialog>
                            <SidebarMenuButton
                                tooltip="Logout"
                                className="h-11 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300 flex items-center gap-4 px-2 cursor-pointer"
                            >
                                <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                                <span className="tracking-wide font-medium text-sm">Logout</span>
                            </SidebarMenuButton>
                        </LogoutDialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
};

export default AdminSidebar;