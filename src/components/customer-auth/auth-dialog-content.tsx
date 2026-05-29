'use client'

import { useState, useCallback } from 'react'
import { MagicLinkForm } from './magic-link-form'
import { VerifyCodeForm } from './verify-code-form'
import type { MagicLinkStep } from '@/lib/types/customer-auth.types'

interface AuthDialogContentProps {
    /** Called when the customer successfully verifies their OTP code. */
    onAuthenticated?: (email: string) => void
}

export function AuthDialogContent({ onAuthenticated }: AuthDialogContentProps) {
    const [step, setStep] = useState<MagicLinkStep>('form')
    const [sentEmail, setSentEmail] = useState<string>('')

    // Step 1 success: code was sent, advance to verify step
    const handleEmailSuccess = useCallback((email: string) => {
        setSentEmail(email)
        setStep('verify')
    }, [])

    // Step 2 success: OTP verified, session is now active
    const handleVerifySuccess = useCallback(() => {
        onAuthenticated?.(sentEmail)
    }, [onAuthenticated, sentEmail])

    // "Change email" — reset back to step 1
    const handleReset = useCallback(() => {
        setSentEmail('')
        setStep('form')
    }, [])

    if (step === 'verify') {
        return (
            <VerifyCodeForm
                email={sentEmail}
                onSuccess={handleVerifySuccess}
                onChangeEmail={handleReset}
            />
        )
    }

    return <MagicLinkForm onSuccess={handleEmailSuccess} />
}
