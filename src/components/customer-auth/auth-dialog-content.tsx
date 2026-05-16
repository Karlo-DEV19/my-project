'use client'

import { useState, useCallback, useEffect } from 'react'
import { MagicLinkForm } from './magic-link-form'
import { SentConfirmation } from './sent-confirmation'
import { createClient } from '@/lib/supabase/client'
import type { MagicLinkStep } from '@/lib/types/customer-auth.types'

interface AuthDialogContentProps {
    /** Called when session is detected while waiting for the magic link. */
    onAuthenticated?: (email: string) => void
}

export function AuthDialogContent({ onAuthenticated }: AuthDialogContentProps) {
    const [step, setStep] = useState<MagicLinkStep>('form')
    const [sentEmail, setSentEmail] = useState<string>('')

    // ── Poll for session while on the 'sent' step ─────────────────────────────
    // BroadcastChannel handles the fast path (same browser, cross-tab).
    // This polling handles the slow path: user clicks link in same tab,
    // or BroadcastChannel is blocked. A fresh client is created each poll
    // because createBrowserClient reads fresh cookies on init — the existing
    // in-memory cached client (in the header) would return stale null.
    useEffect(() => {
        if (step !== 'sent') return

        let cancelled = false

        const poll = async () => {
            if (cancelled) return
            try {
                // Fresh client reads updated session cookie from callback tab
                const supabase = await createClient()
                const { data: { session } } = await supabase.auth.getSession()
                if (!cancelled && session?.user?.email) {
                    onAuthenticated?.(session.user.email)
                }
            } catch {
                // Non-fatal — next interval will retry
            }
        }

        // Poll every 1.5 s while 'Check your inbox' is visible
        const id = setInterval(poll, 1500)
        return () => {
            cancelled = true
            clearInterval(id)
        }
    }, [step, onAuthenticated])

    const handleSuccess = useCallback((email: string) => {
        setSentEmail(email)
        setStep('sent')
    }, [])

    const handleReset = useCallback(() => {
        setSentEmail('')
        setStep('form')
    }, [])

    if (step === 'sent') {
        return <SentConfirmation email={sentEmail} onReset={handleReset} />
    }

    return <MagicLinkForm onSuccess={handleSuccess} />
}
