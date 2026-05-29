'use client'

// ─────────────────────────────────────────────────────────────
// Customer Auth — Magic Link Form (Step 1: Email)
//
// Email input screen — step 1 of the "Get the Code" flow.
// Calls sendCustomerOtpCode server action which:
//   • Creates the Supabase account if new (preserving sign-in + sign-up)
//   • Stores a 6-digit OTP in otp_codes
//   • Emails the code via Nodemailer (branded)
//
// Props:
//   onSuccess(email) — called when the action returns success:true
//                       (triggers parent to switch to 'verify' step)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { customerMagicLinkSchema, type CustomerMagicLinkValues } from '@/lib/zod-schema/customer-auth.schema'
import { sendCustomerOtpCode } from '../../../actions/auth'

// ─── Props ────────────────────────────────────────────────────

interface MagicLinkFormProps {
    /** Called with the submitted email once the API returns success. */
    onSuccess: (email: string) => void
}

// ─────────────────────────────────────────────────────────────

export function MagicLinkForm({ onSuccess }: MagicLinkFormProps) {
    const [isPending, setIsPending] = useState(false)

    const form = useForm<CustomerMagicLinkValues>({
        resolver: zodResolver(customerMagicLinkSchema),
        defaultValues: { email: '' },
        mode: 'onSubmit',
    })

    const onSubmit = async (values: CustomerMagicLinkValues) => {
        setIsPending(true)
        try {
            const result = await sendCustomerOtpCode(values.email)
            if (result.success) {
                onSuccess(values.email)
            } else {
                toast.error(result.error ?? 'Something went wrong. Please try again.')
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form
                id="magic-link-form"
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
                        Continue with Email
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Enter your email and we&apos;ll send a secure login code.
                        <br />
                        <span className="text-[11px] text-muted-foreground/70">
                            No password required.
                        </span>
                    </p>
                </div>

                {/* ── Divider ─────────────────────────────────── */}
                <div className="h-px bg-border" />

                {/* ── Email field ──────────────────────────────── */}
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs font-medium text-foreground sr-only">
                                Email address
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Mail
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none"
                                        strokeWidth={1.5}
                                    />
                                    <Input
                                        {...field}
                                        id="customer-auth-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        autoComplete="email"
                                        autoFocus
                                        disabled={isPending}
                                        className="pl-9 h-10 text-sm rounded-none border-border focus-visible:ring-1 focus-visible:ring-foreground/30 focus-visible:border-foreground/50 transition-all"
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="text-xs" />
                        </FormItem>
                    )}
                />

                {/* ── Submit ───────────────────────────────────── */}
                <Button
                    id="customer-auth-submit"
                    type="submit"
                    disabled={isPending}
                    className="w-full h-10 rounded-none bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.22em] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                            Sending code…
                        </>
                    ) : (
                        'GET THE CODE'
                    )}
                </Button>

                {/* ── Legal micro-copy ─────────────────────────── */}
                <p className="text-center text-[10px] text-muted-foreground/60 leading-relaxed">
                    By continuing, you agree to our{' '}
                    <a
                        href="/terms-of-service"
                        className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                        tabIndex={-1}
                    >
                        Terms
                    </a>{' '}
                    &amp;{' '}
                    <a
                        href="/privacy-policy"
                        className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                        tabIndex={-1}
                    >
                        Privacy
                    </a>
                    .
                </p>
            </form>
        </Form>
    )
}
