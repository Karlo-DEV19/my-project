"use client"

import { useState, useEffect, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldAlert, Loader2, Mail } from "lucide-react"

interface TwoFactorModalProps {
    isOpen: boolean
    onClose: () => void
    // Throw an Error from this callback to display an inline error in the modal
    onVerify: (code: string) => Promise<void>
    // Displayed in the description so the user knows where the code was sent
    email: string
    /**
     * Controls dynamic copy inside the modal.
     * - "login"  (default) → "Verify & Sign In"
     * - "signup"           → "Verify & Continue"
     * Omit for the admin 2FA flow — it defaults to "login" with no change.
     */
    mode?: "login" | "signup"
}

export function TwoFactorModal({ isOpen, onClose, onVerify, email, mode = "login" }: TwoFactorModalProps) {
    const [otp, setOtp] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Use a ref to track the latest OTP value for the auto-submit timeout.
    // This avoids stale closures without needing otp in the effect dependency array.
    const otpRef = useRef(otp)
    otpRef.current = otp

    // Reset all state when the modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setOtp("")
            setError(null)
            setIsLoading(false)
        }
    }, [isOpen])

    const submitCode = async (code: string) => {
        if (code.length !== 6 || isLoading) return

        setIsLoading(true)
        setError(null)

        try {
            await onVerify(code)
            // On success the parent handles redirect — modal will close via isOpen → false
        } catch (err) {
            setError(err instanceof Error ? err.message : "Verification failed. Please try again.")
            setOtp("") // Clear so user can type a fresh code
        } finally {
            setIsLoading(false)
        }
    }

    const handleOtpChange = (value: string) => {
        setError(null)
        setOtp(value)

        // Auto-submit once all 6 digits are entered.
        // 150ms delay so the last digit slot visually fills before the spinner appears.
        if (value.length === 6) {
            setTimeout(() => submitCode(otpRef.current), 150)
        }
    }

    // Mask email: name@domain.com → n***@domain.com
    const maskedEmail = email.replace(
        /^(.)(.*)(@.*)$/,
        (_, first, middle, domain) => `${first}${"*".repeat(Math.min(middle.length, 4))}${domain}`
    )

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isLoading) onClose() }}>
            <DialogContent
                className="
                    w-[calc(100vw-2rem)] max-w-[360px]
                    sm:max-w-md
                    p-6 sm:p-8
                    rounded-2xl
                    bg-card border border-border/60
                    gap-0
                    z-9999
                "
                // Block closing by clicking outside while a verification is in flight
                onInteractOutside={(e) => { if (isLoading) e.preventDefault() }}
            >
                <DialogHeader className="flex flex-col items-center text-center space-y-3 mb-6">
                    <div className="p-3 rounded-2xl bg-primary/10">
                        <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={2} />
                    </div>

                    <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                        Check your email
                    </DialogTitle>

                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        We sent a 6-digit verification code to{" "}
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            <Mail className="w-3 h-3" />
                            {maskedEmail}
                        </span>
                        .{" "}
                        {mode === "signup"
                            ? "Enter it below to verify your new account."
                            : "Enter it below to sign in."}
                    </DialogDescription>
                </DialogHeader>

                {/* OTP input */}
                <div className="flex flex-col items-center gap-3 mb-6">
                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={isLoading}
                        inputMode="numeric" // triggers numpad on iOS/Android
                        autoFocus
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

                    {/* Error message */}
                    {error ? (
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Code expires in 5 minutes
                        </p>
                    )}
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={() => submitCode(otp)}
                        disabled={otp.length !== 6 || isLoading}
                        className="w-full h-11 text-sm font-semibold"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                            </>
                        ) : mode === "signup" ? (
                            "Verify & Continue"
                        ) : (
                            "Verify & Sign In"
                        )}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-full h-10 text-sm text-muted-foreground"
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}