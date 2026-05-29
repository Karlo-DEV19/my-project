'use client'

// ─────────────────────────────────────────────────────────────
// Customer Auth — Verify Code Form (Step 2)
//
// OTP code entry screen — step 2 of the "Get the Code" flow.
// Calls verifyCustomerOtpCode server action which:
//   • Validates the 6-digit code against otp_codes table
//   • Signs the customer in via Supabase (session cookie set)
//   • Preserves combined sign-in / sign-up behaviour
//
// Props:
//   email         — the email the code was sent to (display only)
//   onSuccess     — called when verification succeeds
//   onChangeEmail — resets back to step 1 (email form)
// ─────────────────────────────────────────────────────────────

import { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from '@/components/ui/input-otp'

import { customerOtpSchema, type CustomerOtpValues } from '@/lib/zod-schema/customer-auth.schema'
import { verifyCustomerOtpCode } from '../../../actions/auth'

// ─── Props ────────────────────────────────────────────────────

interface VerifyCodeFormProps {
    /** The email address the OTP was sent to. */
    email: string
    /** Called when the code is verified and the session is active. */
    onSuccess: () => void
    /** Resets back to the email input (step 1). */
    onChangeEmail: () => void
}

// ─────────────────────────────────────────────────────────────

export function VerifyCodeForm({ email, onSuccess, onChangeEmail }: VerifyCodeFormProps) {
    const [isPending, setIsPending] = useState(false)

    // Ref keeps submitCode stable across OTP change events (avoids stale closure)
    const isPendingRef = useRef(isPending)
    isPendingRef.current = isPending

    const form = useForm<CustomerOtpValues>({
        resolver: zodResolver(customerOtpSchema),
        defaultValues: { code: '' },
        mode: 'onSubmit',
    })

    const submitCode = useCallback(
        async (code: string) => {
            if (code.length !== 6 || isPendingRef.current) return

            setIsPending(true)
            form.clearErrors()

            try {
                const result = await verifyCustomerOtpCode(email, code)
                if (result.success) {
                    onSuccess()
                } else {
                    form.setError('code', {
                        message: result.error ?? 'Invalid or expired code.',
                    })
                    form.setValue('code', '') // clear so user can re-enter
                }
            } catch {
                toast.error('Something went wrong. Please try again.')
                form.setValue('code', '')
            } finally {
                setIsPending(false)
            }
        },
        [email, form, onSuccess],
    )

    const onSubmit = (values: CustomerOtpValues) => submitCode(values.code)

    const handleOtpChange = (value: string) => {
        form.clearErrors('code')
        form.setValue('code', value, { shouldValidate: false })

        // Auto-submit once all 6 digits are entered (150 ms delay for visual feedback)
        if (value.length === 6) {
            setTimeout(() => submitCode(value), 150)
        }
    }

    return (
        <Form {...form}>
            <form
                id="verify-code-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4"
                noValidate
            >
                {/* ── MJ Decors brand mark ─────────────────────── */}
                <div className="flex flex-col items-center gap-3 pb-2">
                    <div className="w-10 h-10 flex items-center justify-center bg-foreground text-background font-serif font-bold text-sm tracking-tight shrink-0">
                        MJ
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
                            MJ Decor 888
                        </p>
                    </div>
                </div>

                {/* ── Heading ──────────────────────────────────── */}
                <div className="text-center space-y-1">
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                        Enter your code
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Check your email, then paste the code here to continue.
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 break-all">
                        {email}
                    </p>
                </div>

                {/* ── Divider ─────────────────────────────────── */}
                <div className="h-px bg-border" />

                {/* ── OTP input ────────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field, fieldState }) => (
                        <FormItem className="flex flex-col items-center gap-2">
                            <FormControl>
                                <InputOTP
                                    maxLength={6}
                                    value={field.value}
                                    onChange={handleOtpChange}
                                    disabled={isPending}
                                    inputMode="numeric"
                                    autoFocus
                                    id="customer-auth-otp"
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                    </InputOTPGroup>
                                    <InputOTPSeparator />
                                    <InputOTPGroup>
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </FormControl>

                            {fieldState.error ? (
                                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                    <FormMessage className="text-xs" />
                                </div>
                            ) : (
                                <p className="text-[11px] text-muted-foreground/70">
                                    Code expires in 5 minutes.
                                </p>
                            )}
                        </FormItem>
                    )}
                />

                {/* ── Submit ───────────────────────────────────── */}
                <Button
                    id="customer-auth-verify"
                    type="submit"
                    disabled={isPending || form.watch('code').length !== 6}
                    className="w-full h-10 rounded-none bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.22em] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                            Verifying&hellip;
                        </>
                    ) : (
                        'VERIFY CODE'
                    )}
                </Button>

                {/* ── Change email ─────────────────────────────── */}
                <button
                    type="button"
                    onClick={onChangeEmail}
                    disabled={isPending}
                    className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Use a different email address"
                >
                    <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
                    Change email
                </button>
            </form>
        </Form>
    )
}
