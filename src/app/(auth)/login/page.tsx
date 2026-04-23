"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Lock,
    ArrowRight,
    ShieldAlert,
    KeyRound,
    Loader2,
    LogIn,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { TwoFactorModal } from "@/components/auth/otp-code-dialog"
import { initiateSignIn, verifyAdminPasscode, verifyOtpCode } from "../../../../actions/auth"

// ─────────────────────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────────────────────
const gatekeeperSchema = z.object({
    passcode: z.string().min(1, "Passcode is required"),
})

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})

type GatekeeperValues = z.infer<typeof gatekeeperSchema>
type LoginValues = z.infer<typeof loginSchema>

// ─────────────────────────────────────────────────────────────
// GatekeeperScreen — Step 0
//
// Shown before the login form. The user must enter the master
// passcode (ADMIN_PASSCODE env var) before the login fields
// are revealed. A cookie keeps them unlocked for 24 hours.
// ─────────────────────────────────────────────────────────────
function GatekeeperScreen({ onSuccess }: { onSuccess: () => void }) {
    const [serverError, setServerError] = useState("")

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<GatekeeperValues>({
        resolver: zodResolver(gatekeeperSchema),
        defaultValues: { passcode: "" },
    })

    const onSubmit = async (data: GatekeeperValues) => {
        setServerError("")
        const result = await verifyAdminPasscode(data.passcode)
        if (result.success) {
            onSuccess()
        } else {
            setServerError(result.error ?? "Verification failed.")
        }
    }

    return (
        <div className="w-full max-w-[400px] p-6 sm:p-8 space-y-6 sm:space-y-8 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5">
            {/* Header */}
            <div className="flex flex-col items-center space-y-3 text-center">
                <div className="p-3 sm:p-4 bg-primary/10 rounded-2xl shadow-inner">
                    <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        Restricted Access
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Enter the master passcode to unlock the staff authentication portal.
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <div className="relative group">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                            type="password"
                            placeholder="Enter passcode..."
                            autoComplete="current-password"
                            className={`pl-10 h-11 sm:h-12 bg-background ${errors.passcode || serverError
                                ? "border-destructive focus-visible:ring-destructive/20"
                                : ""
                                }`}
                            {...register("passcode")}
                        />
                    </div>

                    {(errors.passcode?.message || serverError) && (
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive animate-in fade-in slide-in-from-top-1">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>{errors.passcode?.message ?? serverError}</span>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 sm:h-12 text-sm font-semibold tracking-wide"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            Verify Access
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </form>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────
// StaffLoginScreen — Step 1 (credentials) + Step 2 (OTP)
//
// onSubmit → initiateSignIn → opens OTP modal on success
// handleOtpVerify → verifyOtpCode → redirects to /admin on success
//
// Errors from either action are shown inline — never swallowed.
// ─────────────────────────────────────────────────────────────
function AdminLoginScreen() {
    const router = useRouter()

    // Stored after Step 1 so Step 2 (verifyOtpCode) knows the account
    const [pendingEmail, setPendingEmail] = useState<string | null>(null)
    const [is2FAOpen, setIs2FAOpen] = useState(false)
    const [authError, setAuthError] = useState("")

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    })

    // Step 1 — validate credentials, trigger OTP send
    const onSubmit = async (data: LoginValues) => {
        setAuthError("")

        const result = await initiateSignIn(data.email, data.password)

        if (result.success) {
            setPendingEmail(data.email)
            setIs2FAOpen(true)
        } else {
            setAuthError(result.error ?? "An unexpected error occurred.")
        }
    }

    // Step 2 — verify OTP entered in the modal.
    // Throwing an Error causes TwoFactorModal to display it inline.
    const handleOtpVerify = async (code: string) => {
        if (!pendingEmail) {
            throw new Error("Session error. Please try signing in again.")
        }

        const result = await verifyOtpCode(pendingEmail, code)

        if (!result.success) {
            throw new Error(result.error ?? "Invalid or expired code.")
        }

        // Success — close modal, navigate to dashboard
        setIs2FAOpen(false)
        router.push("/admin")
        router.refresh() // forces the auth provider to re-read the new session
    }

    return (
        <>
            <div className="w-full max-w-[400px] p-6 sm:p-8 space-y-6 sm:space-y-8 bg-card border border-border/60 rounded-2xl shadow-xl shadow-black/5 animate-in fade-in zoom-in-95 duration-300">
                {/* Brand mark */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-foreground text-background rounded-xl flex items-center justify-center shadow-sm">
                        <span className="font-serif font-bold text-lg sm:text-xl tracking-tighter">
                            MJ
                        </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
                        Admin Portal
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in to manage your workspace.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <Label
                            htmlFor="email"
                            className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
                        >
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@mjdecors.com"
                            autoComplete="email"
                            className={`h-11 ${errors.email
                                ? "border-destructive focus-visible:ring-destructive/20"
                                : ""
                                }`}
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.email.message}
                            </p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="password"
                                className="text-xs uppercase tracking-wider font-semibold text-muted-foreground"
                            >
                                Password
                            </Label>
                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-primary hover:underline transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className={`h-11 ${errors.password
                                ? "border-destructive focus-visible:ring-destructive/20"
                                : ""
                                }`}
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-sm font-medium text-destructive">
                                {errors.password.message}
                            </p>
                        )}
                    </div>

                    {/* Server-side auth error (wrong password, inactive account, etc.) */}
                    {authError && (
                        <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 animate-in fade-in">
                            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{authError}</span>
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 text-sm font-semibold tracking-wide"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <LogIn className="w-4 h-4 mr-2 opacity-80" />
                                Sign In
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* Rendered outside the card so it isn't clipped by overflow rules */}
            <TwoFactorModal
                isOpen={is2FAOpen}
                onClose={() => setIs2FAOpen(false)}
                onVerify={handleOtpVerify}
                email={pendingEmail ?? ""}
            />
        </>
    )
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default function LoginPage() {
    const [isAuthorized, setIsAuthorized] = useState(false)

    return (
        <div className="flex min-h-screen w-full items-center justify-center p-4 bg-muted/20">
            {!isAuthorized ? (
                <GatekeeperScreen onSuccess={() => setIsAuthorized(true)} />
            ) : (
                <AdminLoginScreen />
            )}
        </div>
    )
}