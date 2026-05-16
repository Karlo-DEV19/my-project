'use client'

// ─────────────────────────────────────────────────────────────
// Customer Auth — Sent Confirmation Screen
//
// Step 2 of 2: shown after the magic link is successfully sent.
// Displays the recipient email, expiry note, and a reset option.
//
// Props:
//   email   — the email the link was sent to
//   onReset — resets the flow back to step 1 (email form)
// ─────────────────────────────────────────────────────────────

import { Mail, ArrowLeft, ShieldCheck } from 'lucide-react'

// ─── Props ────────────────────────────────────────────────────

interface SentConfirmationProps {
    /** The email the magic link was dispatched to. */
    email: string
    /** Resets the dialog back to the email input form. */
    onReset: () => void
}

// ─────────────────────────────────────────────────────────────

export function SentConfirmation({ email, onReset }: SentConfirmationProps) {
    return (
        <div className="flex flex-col items-center gap-5 py-2 text-center">

            {/* ── Animated mail icon ─────────────────────────── */}
            <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-foreground/5 animate-ping [animation-duration:2s]" />
                <div className="relative w-14 h-14 rounded-full bg-foreground/[0.06] border border-border flex items-center justify-center">
                    <Mail
                        className="w-6 h-6 text-foreground"
                        strokeWidth={1.5}
                    />
                </div>
            </div>

            {/* ── Heading ────────────────────────────────────── */}
            <div className="space-y-1.5">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    Check your inbox
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                    We sent a secure sign-in link to
                </p>
                <p className="text-xs font-semibold text-foreground break-all">
                    {email}
                </p>
                <p className="text-xs text-muted-foreground/70 leading-relaxed">
                    Click the link in the email to sign in.
                </p>
            </div>

            {/* ── Security notice ────────────────────────────── */}
            <div className="w-full border border-border bg-muted/30 p-3 flex gap-2.5 items-start text-left">
                <ShieldCheck
                    className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5"
                    strokeWidth={1.5}
                />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                    The link expires in{' '}
                    <strong className="text-foreground font-medium">60 minutes</strong>{' '}
                    and can only be used once. If you didn&apos;t request this, you can safely ignore it.
                </p>
            </div>

            {/* ── Reset / different email ─────────────────────── */}
            <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                aria-label="Use a different email address"
            >
                <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
                Use a different email
            </button>
        </div>
    )
}
