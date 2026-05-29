'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, Check, Loader2, Pencil, ShieldCheck, User, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Shared browser Supabase client (SSR-compatible, reads cookies set by server actions)
function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Customer profile fields that are displayed on the Profile page.
// phone and address are stored as human-readable display strings.
//
// TODO (future — checkout sync):
//   • On order submission → upsert profile: name, phone, address from checkout form.
//   • On future checkout → read profile.name/phone/address to pre-fill the form.
type StoredUser = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;    // e.g. "+639XXXXXXXXX" — sourced from checkout or future profile edit
  address?: string;  // formatted summary string; full structured address lives in orders table
};

// Profile and Settings are the only tabs.
// Orders will be a separate route (/orders) implemented later.
type Tab = 'profile' | 'settings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name?: string): string {
  if (!name?.trim()) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Settings Section ─────────────────────────────────────────────────────────
// Appropriate for passwordless email-code accounts.
// No password management — customers sign in with a code sent to their email.

function SettingsSection() {
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Account &amp; Security
      </p>

      {/* Sign-in method — read-only info card */}
      <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/20 px-5 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium text-foreground">Sign-in Method</p>
          <p className="text-[11px] font-semibold text-foreground/80">Email code</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5">
            You sign in securely using a code sent to your email.
            No password is required.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawTab = searchParams.get('tab');
  const activeTab: Tab = rawTab === 'settings' ? 'settings' : 'profile';

  // ── User state ───────────────────────────────────────────────────────────────
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Edit-name state ──────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 1. Try localStorage first (populated by the header on sign-in)
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        setUser(JSON.parse(stored) as StoredUser);
        setIsLoading(false);
        return;
      }
    } catch { /* corrupted storage — fall through */ }

    // 2. Fallback: read from the Supabase session cookie set by the server action.
    //    This covers the case where the tab was opened before localStorage was written.
    const supabase = getBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const u = data.user;
        const resolved: StoredUser = {
          id: u.id,
          email: u.email ?? undefined,
          name:
            (u.user_metadata?.full_name as string | undefined) ??
            (u.user_metadata?.name as string | undefined),
          phone: u.user_metadata?.phone as string | undefined,
          address: u.user_metadata?.address as string | undefined,
        };
        setUser(resolved);
        // Back-fill localStorage so subsequent loads are instant
        try { localStorage.setItem('user', JSON.stringify(resolved)); } catch { /* noop */ }
      }
    }).finally(() => setIsLoading(false));
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
      const json = (await res.json()) as { success?: boolean; message?: string };

      if (!res.ok || !json.success) {
        setSaveError(json.message ?? 'Something went wrong. Please try again.');
        return;
      }

      const updatedUser: StoredUser = { ...user, name: trimmed };
      setUser(updatedUser);
      try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch { /* noop */ }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('A network error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <User className="h-10 w-10 text-muted-foreground/40" strokeWidth={1.25} />
        <p className="text-sm font-medium text-muted-foreground">You are not signed in.</p>
        <p className="text-xs text-muted-foreground/60">Please sign in to view your profile.</p>
        <Button
          id="profile-signin-btn"
          type="button"
          variant="outline"
          onClick={() => router.push('/')}
          className="mt-2 h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
        >
          Go to Home
        </Button>
      </div>
    );
  }

  // ── Derived display values ───────────────────────────────────────────────────

  const currentName = isEditing ? editedName || user.name : user.name;
  const initials = getInitials(currentName);
  const hasName = Boolean(user.name?.trim());

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'settings', label: 'Settings' },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">

        {/* ── Back ── */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Back
        </button>

        {/* ══════════════════════════════════════════════════════════════════════
            PROFILE HEADER — avatar · name · email
        ══════════════════════════════════════════════════════════════════════ */}
        <div className="rounded-2xl border border-border bg-background shadow-sm px-6 py-6">
          <div className="flex items-center gap-4 min-w-0">

            {/* Avatar: initials if name exists, user icon otherwise */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-foreground text-background text-lg font-bold select-none">
              {initials
                ? initials
                : <User className="h-7 w-7" strokeWidth={1.5} />}
            </div>

            {/* Name + email */}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground leading-tight truncate">
                {isEditing
                  ? (editedName || 'Your name')
                  : (hasName ? user.name! : 'Account')}
              </h1>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {user.email ?? '—'}
              </p>
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
                  activeTab === id
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

                {/* ── Account detail fields ── */}
                <div className="space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Account Details
                  </p>

                  {/* Name — editable */}
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
                      <p className={[
                        'text-sm font-medium',
                        hasName ? 'text-foreground' : 'text-muted-foreground/60 italic',
                      ].join(' ')}>
                        {hasName ? user.name! : 'Not added yet'}
                      </p>
                    )}
                  </div>

                  {/* Phone — read-only for now; populated from checkout on order submission */}
                  <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Phone Number
                    </p>
                    <p className={[
                      'text-sm font-medium',
                      user.phone ? 'text-foreground' : 'text-muted-foreground/60 italic',
                    ].join(' ')}>
                      {user.phone ?? 'Not added yet'}
                    </p>
                  </div>

                  {/* Address — read-only for now; populated from checkout on order submission */}
                  <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Address
                    </p>
                    <p className={[
                      'text-sm font-medium',
                      user.address ? 'text-foreground' : 'text-muted-foreground/60 italic',
                    ].join(' ')}>
                      {user.address ?? 'Not added yet'}
                    </p>
                  </div>

                  {/* Email — always locked */}
                  <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                        Email
                      </p>
                      <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-px text-[9px] uppercase tracking-wider text-muted-foreground/70">
                        locked
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground opacity-60 truncate">
                      {user.email ?? '—'}
                    </p>
                  </div>

                  {/* Sign-in method — read-only */}
                  <div className="rounded-xl border border-border bg-muted/20 px-5 py-4 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Sign-in Method
                    </p>
                    <p className="text-sm font-medium text-foreground">Email code</p>
                  </div>
                </div>

                {/* ── Edit name action ── */}
                <div className="flex items-center gap-3">
                  {isEditing ? (
                    <>
                      <Button
                        id="profile-save-btn"
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving || !editedName.trim()}
                        className="h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
                      >
                        {isSaving
                          ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          : <Check className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.75} />}
                        {isSaving ? 'Saving…' : 'Save'}
                      </Button>

                      <Button
                        id="profile-cancel-btn"
                        type="button"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
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
                      className="h-9 rounded-xl text-xs font-semibold uppercase tracking-[0.15em]"
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" strokeWidth={1.75} />
                      Edit Details
                    </Button>
                  )}
                </div>

              </div>
            )}

            {/* ── SETTINGS tab ── */}
            {activeTab === 'settings' && <SettingsSection />}

          </div>
        </div>

      </div>
    </div>
  );
}