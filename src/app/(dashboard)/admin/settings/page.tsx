'use client';

import React, { useState } from 'react';
import AdminPageHeader from '@/components/pages/admin/components/admin-page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('MJ Decors 888');
  const [supportEmail, setSupportEmail] = useState('mjdecor888@gmail.com');
  const [supportPhone, setSupportPhone] = useState('0917 694 8888');
  const [address, setAddress] = useState(
    '35 20th Avenue, Murphy Cubao, Quezon City, Philippines, 1109'
  );
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [orderNotifications, setOrderNotifications] = useState(true);

  return (
    <section className="min-h-screen bg-background/60">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminPageHeader
          title="Settings"
          description="Configure store preferences, support details, and admin options."
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Store Information
            </h2>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Store Name
                </Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="h-11 rounded-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Support Email
                  </Label>
                  <Input
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="h-11 rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Support Phone
                  </Label>
                  <Input
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="h-11 rounded-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Address
                </Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-[110px] resize-none rounded-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card/80 p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Admin Preferences
            </h2>
            <div className="mt-6 space-y-6">
              <div className="flex items-start justify-between gap-6 rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Maintenance mode
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Temporarily disable public checkout and browsing.
                  </p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>

              <div className="flex items-start justify-between gap-6 rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Order notifications
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Receive notifications for new orders.
                  </p>
                </div>
                <Switch checked={orderNotifications} onCheckedChange={setOrderNotifications} />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="h-11 rounded-none border-border bg-transparent text-xs font-semibold uppercase tracking-[0.18em]"
                >
                  Cancel
                </Button>
                <Button className="h-11 rounded-none bg-primary px-6 text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-[0.18em]">
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}