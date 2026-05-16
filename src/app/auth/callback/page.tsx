'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { syncUserWithDb } from '@/lib/helpers/sync-user-with-db';

// ─────────────────────────────────────────────────────────────
// Customer Auth — Magic Link Callback Page
//
// Handles BOTH redirect formats Supabase may use:
//   A) Implicit flow: #access_token=xxx&refresh_token=xxx (hash)
//   B) OTP flow:      ?token_hash=xxx&type=email          (query)
//
// After exchanging the session, posts tokens over BroadcastChannel
// so the original tab can call setSession() and close the dialog.
// ─────────────────────────────────────────────────────────────

export interface AuthCallbackMessage {
    event: 'SIGNED_IN';
    accessToken: string;
    refreshToken: string;
}

// ─────────────────────────────────────────────────────────────

function CallbackHandler() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const run = async () => {
            try {
                const supabase = await createClient();

                // ── A) Implicit flow: tokens in URL hash ──────────────────────
                const hashParams = new URLSearchParams(window.location.hash.slice(1));
                const hashAccessToken = hashParams.get('access_token');
                const hashRefreshToken = hashParams.get('refresh_token');

                // ── B) OTP flow: token_hash in query params ───────────────────
                const token_hash = params.get('token_hash');
                const type = params.get('type') as EmailOtpType | null;

                let accessToken: string | null = null;
                let refreshToken: string | null = null;

                if (hashAccessToken && hashRefreshToken) {
                    // Implicit flow — set session directly from hash tokens
                    const { data, error } = await supabase.auth.setSession({
                        access_token: hashAccessToken,
                        refresh_token: hashRefreshToken,
                    });
                    if (error || !data.session) {
                        console.error('[auth/callback] setSession failed:', error?.message);
                        router.replace('/');
                        return;
                    }
                    accessToken = data.session.access_token;
                    refreshToken = data.session.refresh_token;

                    // ── Sync user record with DB ─────────────────────────────
                    const user = data.session.user;
                    const name =
                        (user.user_metadata?.full_name as string | undefined) ??
                        (user.user_metadata?.name as string | undefined);
                    void syncUserWithDb(user.email!, name);

                } else if (token_hash && type) {
                    // OTP flow — exchange token_hash for session
                    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
                    if (error) {
                        console.error('[auth/callback] verifyOtp failed:', error.message);
                        router.replace('/');
                        return;
                    }
                    const { data: sessionData } = await supabase.auth.getSession();
                    if (!sessionData.session) {
                        console.error('[auth/callback] No session after verifyOtp');
                        router.replace('/');
                        return;
                    }
                    accessToken = sessionData.session.access_token;
                    refreshToken = sessionData.session.refresh_token;

                    // ── Sync user record with DB ─────────────────────────────
                    const user = sessionData.session.user;
                    const name =
                        (user.user_metadata?.full_name as string | undefined) ??
                        (user.user_metadata?.name as string | undefined);
                    void syncUserWithDb(user.email!, name);

                } else {
                    console.warn('[auth/callback] No recognizable auth params in URL');
                    router.replace('/');
                    return;
                }

                // ── Signal original tab with session tokens ───────────────────
                // Original tab calls setSession() with these tokens to hydrate
                // its in-memory cache and trigger onAuthStateChange → dialog closes.
                try {
                    const channel = new BroadcastChannel('mj-auth-callback');
                    const message: AuthCallbackMessage = {
                        event: 'SIGNED_IN',
                        accessToken,
                        refreshToken,
                    };
                    channel.postMessage(message);
                    channel.close();
                } catch {
                    // BroadcastChannel not supported — onAuthStateChange covers this
                }

                // ── Resolve redirect destination (same-origin guard) ──────────
                const redirectParam = params.get('redirect');
                let destination = '/';
                if (redirectParam) {
                    try {
                        const resolved = new URL(redirectParam, window.location.origin);
                        if (resolved.origin === window.location.origin) {
                            destination = resolved.pathname + resolved.search;
                        }
                    } catch { /* keep '/' */ }
                }

                router.replace(destination);

            } catch (err) {
                console.error('[auth/callback] Unexpected error:', err);
                router.replace('/');
            }
        };

        run();
    }, [params, router]);

    return null;
}

// ─── Loading screen ───────────────────────────────────────────

function LoadingScreen() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
            <div className="fixed top-0 left-0 right-0 h-[3px]"
                style={{ background: 'linear-gradient(90deg, #8a7450 0%, #c9a96e 50%, #8a7450 100%)' }} />
            <div className="flex flex-col items-center gap-5 animate-in fade-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 opacity-20 animate-ping [animation-duration:2.5s]"
                        style={{ background: 'radial-gradient(circle, #c9a96e 0%, transparent 70%)' }} />
                    <div className="relative w-12 h-12 flex items-center justify-center bg-foreground text-background font-serif font-bold text-lg tracking-tight">
                        MJ
                    </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.42em] text-muted-foreground">MJ Decor 888</p>
                    <p className="text-[8px] uppercase tracking-[0.22em] text-muted-foreground/50">Window Solutions</p>
                </div>
                <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }} />
                <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground animate-pulse">Signing you in…</p>
            </div>
            <div className="fixed bottom-0 left-0 right-0 h-[3px]"
                style={{ background: 'linear-gradient(90deg, #8a7450 0%, #c9a96e 50%, #8a7450 100%)' }} />
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <LoadingScreen />
            <CallbackHandler />
        </Suspense>
    );
}
