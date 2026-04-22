'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { AlertTriangle, ArrowLeft, Check, Eye, EyeOff, KeyRound, Bell, Loader2, Pencil, Settings, Trash2, User, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type StoredUser = {
  id: string;
  name?: string;
  email?: string;
};

type Tab = 'profile' | 'settings' | 'orders' | 'delete-account';

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

// Password strength scorer
function getPasswordStrength(pw: string): 'weak' | 'medium' | 'strong' | null {
  if (!pw) return null;
  const checks = [
    /[A-Z]/.test(pw),
    /[a-z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  if (pw.length < 6) return 'weak';
  if (pw.length >= 10 && checks >= 3) return 'strong';
  if (pw.length >= 6 && checks >= 2) return 'medium';
  return 'weak';
}

// Single password input row with show/hide toggle
function PasswordField({
  id, label, value, onChange, placeholder, show, onToggle, disabled, fieldError,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
  fieldError?: string;
}) {
  return (
    <div
      className={[
        'rounded-xl border px-5 py-4 space-y-1.5 transition-colors',
        fieldError ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/20',
      ].join(' ')}
    >
      <label htmlFor={id} className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={id === 'pw-current' ? 'current-password' : 'new-password'}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm font-medium text-foreground border-b border-border pb-0.5 focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/50 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {fieldError && (
        <p className="text-[10px] font-medium text-destructive pt-0.5">{fieldError}</p>
      )}
    </div>
  );
}

// ─── Orders Section ───────────────────────────────────────────────────────────

// ─── Orders Section ───────────────────────────────────────────────────────────

type OrderSummary = {
  id: string;
  trackingNumber: string;
  status: string;
  totalAmount: string;
  createdAt: Date | string;
};

const STATUS_COLORS: Record<string, string> = {
  pending:          'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-300/50',
  confirmed:        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300/50',
  processing:       'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300/50',
  ready:            'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-300/50',
  out_for_delivery: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300/50',
  delivered:        'bg-green-500/10 text-green-600 dark:text-green-400 border-green-300/50',
  completed:        'bg-green-500/10 text-green-600 dark:text-green-400 border-green-300/50',
  cancelled:        'bg-destructive/10 text-destructive border-destructive/30',
};

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatCurrency(v: string | number): string {
  return `₱${parseFloat(String(v)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function OrdersSection({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [orderList, setOrderList] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!userEmail) { setIsLoading(false); return; }
    setIsLoading(true);
    setFetchError(null);
    fetch(`/api/v1/orders/my-orders?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOrderList(json.data ?? []);
        else setFetchError(json.message ?? 'Failed to load orders.');
      })
      .catch(() => setFetchError('Network error. Please try again.'))
      .finally(() => setIsLoading(false));
  }, [userEmail]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <p className="text-sm text-destructive">{fetchError}</p>
      </div>
    );
  }

  if (orderList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No orders yet</p>
        <p className="text-xs text-muted-foreground/60">Your orders will appear here once placed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        My Orders
      </p>
      {orderList.map((order) => (
        <button
          key={order.id}
          onClick={() => router.push(`/profile/orders/${order.id}`)}
          className="w-full text-left rounded-xl border border-border bg-background px-5 py-4 space-y-2 hover:bg-muted/40 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-xs font-semibold text-foreground">{order.trackingNumber}</p>
            <span
              className={[
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground border-border',
              ].join(' ')}
            >
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">{formatDate(order.createdAt)}</p>
            <p className="text-xs font-semibold tabular-nums text-foreground">{formatCurrency(order.totalAmount)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── ChangePasswordForm ─────────────────────────────────────────────────────────

function ChangePasswordForm({ onBack, userEmail }: { onBack: () => void; userEmail: string }) {
  const router = useRouter();

  // ── Field values ────────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Show/hide toggles ─────────────────────────────────────────────────────────
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const strength = getPasswordStrength(newPassword);

  function clearErrors() {
    setGlobalError(null);
    setFieldErrors({});
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearErrors();

    // Client-side validation
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.current = 'Current password is required.';
    if (!newPassword) errs.new = 'New password is required.';
    else if (newPassword.length < 6) errs.new = 'Must be at least 6 characters.';
    if (!confirmPassword) errs.confirm = 'Please confirm your new password.';
    else if (newPassword && newPassword !== confirmPassword) errs.confirm = 'Passwords do not match.';

    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setIsLoading(true);
    try {
      // ── STEP 1: Re-authenticate with current password ───────────────────────────────
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (signInError) {
        setFieldErrors({ current: 'Current password is incorrect.' });
        return;
      }

      // ── STEP 2: Update password ────────────────────────────────────────────────────
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setGlobalError(updateError.message);
        return;
      }

      // ── STEP 3: Security notification ─────────────────────────────────────────
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}') as { id?: string };
        if (storedUser?.id) {
          await fetch('/api/v1/notifications/security-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: storedUser.id }),
          });
        }
      } catch { /* non-fatal — never block the UX flow */ }

      // ── STEP 4: Sign out + redirect ───────────────────────────────────────────────────
      setSuccess(true);
      await supabase.auth.signOut();
      // Clear localStorage session
      localStorage.removeItem('user');
      // Small delay so user sees the success message
      setTimeout(() => router.push('/'), 2200);
    } catch {
      setGlobalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled = isLoading || success;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>

      {/* ── Header row ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isDisabled}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back
        </button>
        <span className="text-border select-none">·</span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Change Password
        </p>
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          Password updated successfully. Signing out…
        </div>
      )}

      {/* ── Global error banner ── */}
      {globalError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive animate-in fade-in duration-200"
        >
          <X className="h-3.5 w-3.5 shrink-0" />
          {globalError}
        </div>
      )}

      {/* ── 1. Current Password ── */}
      <PasswordField
        id="pw-current"
        label="Current Password"
        value={currentPassword}
        onChange={(v) => { setCurrentPassword(v); if (fieldErrors.current) setFieldErrors((p) => ({ ...p, current: '' })); clearErrors(); }}
        placeholder="Enter your current password"
        show={showCurrent}
        onToggle={() => setShowCurrent((s) => !s)}
        disabled={isDisabled}
        fieldError={fieldErrors.current}
      />

      {/* ── 2. New Password + strength bar ── */}
      <div className="space-y-2">
        <PasswordField
          id="pw-new"
          label="New Password"
          value={newPassword}
          onChange={(v) => { setNewPassword(v); if (fieldErrors.new) setFieldErrors((p) => ({ ...p, new: '' })); if (globalError) setGlobalError(null); }}
          placeholder="At least 6 characters"
          show={showNew}
          onToggle={() => setShowNew((s) => !s)}
          disabled={isDisabled}
          fieldError={fieldErrors.new}
        />

        {/* Strength indicator */}
        {newPassword.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <div className="flex flex-1 gap-1">
              {(['weak', 'medium', 'strong'] as const).map((level, idx) => {
                const filled =
                  strength === 'weak' ? idx < 1 :
                    strength === 'medium' ? idx < 2 :
                      strength === 'strong' ? idx < 3 : false;
                const color =
                  idx === 0 ? 'bg-destructive' :
                    idx === 1 ? 'bg-amber-400' :
                      'bg-green-500';
                return (
                  <div
                    key={level}
                    className={[
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      filled ? color : 'bg-border',
                    ].join(' ')}
                  />
                );
              })}
            </div>
            <span className={[
              'text-[10px] font-semibold uppercase tracking-wider shrink-0',
              strength === 'strong' ? 'text-green-600 dark:text-green-400' :
                strength === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                  'text-destructive',
            ].join(' ')}>
              {strength}
            </span>
          </div>
        )}
      </div>

      {/* ── 3. Confirm New Password ── */}
      <PasswordField
        id="pw-confirm"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={(v) => { setConfirmPassword(v); if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: '' })); }}
        placeholder="Re-enter new password"
        show={showConfirm}
        onToggle={() => setShowConfirm((s) => !s)}
        disabled={isDisabled}
        fieldError={fieldErrors.confirm}
      />

      {/* ── Submit ── */}
      <Button
        id="pw-submit-btn"
        type="submit"
        disabled={isDisabled || !currentPassword || !newPassword || !confirmPassword}
        className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
      >
        {isLoading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <KeyRound className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        {isLoading ? 'Updating…' : 'Update Password'}
      </Button>

    </form>
  );
}

// ─── Settings Section ─────────────────────────────────────────────────────────

function SettingsSection({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [panel, setPanel] = useState<'menu' | 'change-password'>('menu');

  // ── Change-password panel ────────────────────────────────────────────────────
  if (panel === 'change-password') {
    return <ChangePasswordForm onBack={() => setPanel('menu')} userEmail={userEmail} />;
  }

  // ── Main menu ────────────────────────────────────────────────────────────────
  const items: { icon: React.ReactNode; label: string; description: string; onClick?: () => void; destructive?: boolean }[] = [
    {
      icon: <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />,
      label: 'Change Password',
      description: 'Update your account password',
      onClick: () => setPanel('change-password'),
    },
    {
      icon: <Bell className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />,
      label: 'Notifications',
      description: 'Manage email and push preferences',
      onClick: () => router.push('/?openNotifications=true&view=full'),
    },
    {
      icon: <Trash2 className="h-4 w-4 shrink-0 text-destructive" strokeWidth={1.75} />,
      label: 'Delete Account',
      description: 'Permanently delete your account and all associated data',
      onClick: () => router.push('/profile?tab=delete-account'),
      destructive: true,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Account Settings
      </p>
      {items.map(({ icon, label, description, onClick, destructive }) => (
        <button
          key={label}
          onClick={onClick}
          className={[
            'flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-colors focus:outline-none focus:ring-2',
            destructive
              ? 'border-destructive/20 bg-destructive/5 hover:bg-destructive/10 focus:ring-destructive/30'
              : 'border-border bg-background hover:bg-muted/40 focus:ring-ring',
          ].join(' ')}
        >
          <div className={[
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
            destructive ? 'border-destructive/20 bg-destructive/10' : 'border-border bg-muted/50',
          ].join(' ')}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className={['text-sm font-medium', destructive ? 'text-destructive' : 'text-foreground'].join(' ')}>
              {label}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">{description}</p>
          </div>
          <ArrowLeft
            className={['h-3.5 w-3.5 rotate-180 shrink-0', destructive ? 'text-destructive/40' : 'text-muted-foreground/40'].join(' ')}
            strokeWidth={1.75}
          />
        </button>
      ))}
    </div>
  );
}

// ─── DeleteAccountSection ─────────────────────────────────────────────────────

function DeleteAccountSection({
  userId,
  userEmail,
  onBack,
}: {
  userId: string;
  userEmail: string;
  onBack: () => void;
}) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const CONFIRM_PHRASE = 'DELETE';
  const isDisabled = isLoading || success;
  const canSubmit = !!password && confirmText === CONFIRM_PHRASE && !isDisabled;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (!password) errs.password = 'Password is required.';
    if (confirmText !== CONFIRM_PHRASE) errs.confirm = `You must type "${CONFIRM_PHRASE}" exactly.`;
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

    setIsLoading(true);
    try {
      // Step 1: Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password,
      });
      if (signInError) {
        setFieldErrors({ password: 'Incorrect password.' });
        return;
      }

      // Step 2: Delete account via backend API
      const res = await fetch(`/api/v1/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.message ?? 'Failed to delete account. Please try again.');
        return;
      }

      // Step 3: Success — sign out, clear storage, dispatch event, redirect
      setSuccess(true);
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: null }));
      setTimeout(() => router.push('/'), 2200);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isDisabled}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus:outline-none disabled:opacity-40"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back
        </button>
        <span className="text-border select-none">·</span>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-destructive">
          Delete Account
        </p>
      </div>

      {/* ── Warning block ── */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 space-y-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          This action is irreversible
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Deleting your account will permanently remove all your data, orders, and preferences.{' '}
          <strong className="text-foreground">This cannot be undone.</strong>
        </p>
      </div>

      {/* ── Success banner ── */}
      {success && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-medium text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-top-1 duration-300"
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          Account deleted successfully. Redirecting…
        </div>
      )}

      {/* ── Global error banner ── */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive animate-in fade-in duration-200"
        >
          <X className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Password confirmation ── */}
      <PasswordField
        id="del-password"
        label="Confirm Password"
        value={password}
        onChange={(v) => {
          setPassword(v);
          if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
          if (error) setError(null);
        }}
        placeholder="Enter your current password"
        show={showPassword}
        onToggle={() => setShowPassword((s) => !s)}
        disabled={isDisabled}
        fieldError={fieldErrors.password}
      />

      {/* ── Confirmation text ── */}
      <div
        className={[
          'rounded-xl border px-5 py-4 space-y-1.5 transition-colors',
          fieldErrors.confirm ? 'border-destructive/50 bg-destructive/5' : 'border-border bg-muted/20',
        ].join(' ')}
      >
        <label
          htmlFor="del-confirm"
          className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground"
        >
          Type{' '}
          <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span>{' '}
          to confirm
        </label>
        <input
          id="del-confirm"
          type="text"
          value={confirmText}
          onChange={(e) => {
            setConfirmText(e.target.value);
            if (fieldErrors.confirm) setFieldErrors((p) => ({ ...p, confirm: '' }));
          }}
          onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) handleSubmit(e as unknown as React.FormEvent); }}
          placeholder={CONFIRM_PHRASE}
          disabled={isDisabled}
          className="w-full bg-transparent font-mono text-sm font-semibold text-foreground border-b border-border pb-0.5 focus:outline-none focus:border-foreground transition-colors placeholder:text-muted-foreground/30 disabled:opacity-50"
        />
        {fieldErrors.confirm && (
          <p className="text-[10px] font-medium text-destructive pt-0.5">{fieldErrors.confirm}</p>
        )}
      </div>

      {/* ── Submit ── */}
      <Button
        id="del-submit-btn"
        type="submit"
        variant="destructive"
        disabled={!canSubmit}
        className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
      >
        {isLoading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
        )}
        {isLoading ? 'Deleting…' : 'Permanently Delete Account'}
      </Button>

    </form>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: Tab =
    rawTab === 'settings' ? 'settings'
      : rawTab === 'orders' ? 'orders'
        : rawTab === 'delete-account' ? 'delete-account'
          : 'profile';

  // ── User state ───────────────────────────────────────────────────────────────
  const [user, setUser] = useState<StoredUser | null>(null);

  // ── Edit-profile state ───────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored) as StoredUser);
    } catch { /* corrupted storage — ignore */ }
  }, []);

  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => nameInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  // ── Tab navigation ───────────────────────────────────────────────────────────
  function switchTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'profile') params.delete('tab');
    else params.set('tab', tab);
    router.replace(`/profile?${params.toString()}`);
  }

  // ── Edit helpers ─────────────────────────────────────────────────────────────
  function startEditing() {
    setEditedName(user?.name ?? '');
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setSaveError(null);
    setEditedName('');
  }

  async function handleSave() {
    const trimmed = editedName.trim();
    if (!trimmed) { setSaveError('Name cannot be empty.'); return; }
    if (!user?.id) { setSaveError('Unable to identify user. Please log in again.'); return; }

    setSaveError(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/v1/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name: trimmed }),
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setSaveError(json.message ?? 'Something went wrong. Please try again.');
        return;
      }

      const updatedUser = { ...user, name: trimmed };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('A network error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Guard ─────────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">You are not logged in.</p>
      </div>
    );
  }

  const initials = getInitials(isEditing ? editedName || user.name : user.name);
  const displayName = user.name ?? 'User';

  // Tab bar shows 3 main tabs; delete-account highlights Settings
  const tabBarActive = activeTab === 'delete-account' ? 'settings' : activeTab;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
    { id: 'orders', label: 'Orders' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back
        </button>

        {/* ══════════════════════════════════════════════════════════════════════
            HEADER — avatar · name · email · notification bell
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border bg-background shadow-sm px-6 py-6">
          <div className="flex items-center justify-between gap-4">

            {/* Left: avatar + identity */}
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold select-none">
                {initials}
              </div>

              {/* Name + email */}
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
                  {isEditing ? (editedName || displayName) : displayName}
                </h1>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {user.email ?? '—'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TABS
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-border">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={[
                  'flex-1 py-3 text-xs font-semibold uppercase tracking-[0.15em] transition-colors focus:outline-none',
                  tabBarActive === id
                    ? 'border-b-2 border-foreground text-foreground bg-muted/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Tab content ── */}
          <div className="p-6 sm:p-8">

            {/* ── PROFILE tab ── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">

                {/* Feedback banners */}
                {saveSuccess && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-xs font-medium text-green-600 dark:text-green-400 animate-in fade-in duration-300"
                  >
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    Profile updated successfully
                  </div>
                )}
                {saveError && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs font-medium text-destructive animate-in fade-in duration-200"
                  >
                    <X className="h-3.5 w-3.5 shrink-0" />
                    {saveError}
                  </div>
                )}

                {/* Two-column layout — info left, actions right */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">

                  {/* ── Left: info fields ── */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Personal Information
                    </p>

                    {/* Name */}
                    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        Name
                      </p>
                      {isEditing ? (
                        <input
                          ref={nameInputRef}
                          id="profile-name-input"
                          type="text"
                          value={editedName}
                          onChange={(e) => {
                            setEditedName(e.target.value);
                            if (saveError) setSaveError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSave();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          placeholder="Your name"
                          className="w-full bg-transparent text-sm font-medium text-foreground border-b border-border pb-0.5 focus:outline-none focus:border-foreground transition-colors"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">{displayName}</p>
                      )}
                    </div>

                    {/* Email — always locked */}
                    <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        Email
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-muted px-1.5 py-px text-[9px] uppercase tracking-wider text-muted-foreground/70">
                          locked
                        </span>
                      </p>
                      <p className="text-sm font-medium text-foreground opacity-60 truncate">
                        {user.email ?? '—'}
                      </p>
                    </div>
                  </div>

                  {/* ── Right: actions ── */}
                  <div className="flex flex-col gap-3 sm:min-w-[160px]">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Actions
                    </p>

                    {isEditing ? (
                      <>
                        <Button
                          id="profile-save-btn"
                          type="button"
                          onClick={handleSave}
                          disabled={isSaving || !editedName.trim()}
                          className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
                        >
                          {isSaving ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                          )}
                          {isSaving ? 'Saving…' : 'Save'}
                        </Button>

                        <Button
                          id="profile-cancel-btn"
                          type="button"
                          variant="outline"
                          onClick={cancelEditing}
                          disabled={isSaving}
                          className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        id="profile-edit-btn"
                        type="button"
                        variant="outline"
                        onClick={startEditing}
                        className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
                        Edit Profile
                      </Button>
                    )}

                    <Button
                      id="profile-settings-btn"
                      type="button"
                      variant="ghost"
                      onClick={() => router.push('/profile?tab=settings')}
                      className="w-full h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
                    >
                      <Settings className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
                      Settings
                    </Button>
                  </div>

                </div>
              </div>
            )}

            {/* ── SETTINGS tab ── */}
            {activeTab === 'settings' && <SettingsSection userEmail={user.email ?? ''} />}

            {/* ── DELETE ACCOUNT tab ── */}
            {activeTab === 'delete-account' && (
              <DeleteAccountSection
                userId={user.id}
                userEmail={user.email ?? ''}
                onBack={() => router.replace('/profile?tab=settings')}
              />
            )}

            {/* ── ORDERS tab ── */}
            {activeTab === 'orders' && <OrdersSection userEmail={user.email ?? ''} />}

          </div>
        </div>

      </div>
    </div>
  );
}