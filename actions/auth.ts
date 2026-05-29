"use server"

import { cache } from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { and, eq, gt } from "drizzle-orm"

import { createClient } from "@/lib/supabase/server"
import { db, supabaseAdmin } from "@/lib/supabase/db"
import { employees } from "@/schema/employees/employees"
import { encrypt } from "@/lib/helpers/crypto"

import type { AuthResponse } from "@/lib/types/auth"
import { admins } from "@/schema/admin/admins"
import { otpCodes } from "@/schema/otp/otp-code"
import { sendOtpEmail } from "@/app/api/services/nodemailer/send-otp-code-service"
import { createActivityLog } from "@/app/api/controller/activity-logs"
import { ActivityAction, ActivityModule } from "@/lib/constans/activity-log"

// ─────────────────────────────────────────────────────────────
// Shared return type for all mutation actions
// ─────────────────────────────────────────────────────────────
type ActionResult =
    | { success: true }
    | { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// getUserSession
// ─────────────────────────────────────────────────────────────
export const getUserSession = cache(async (): Promise<AuthResponse> => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return { isAuthenticated: false, user: null }

    // 1. Admins table
    const admin = await db.query.admins.findFirst({
        where: eq(admins.id, user.id),
        columns: {
            role: true,
            isActive: true,
            firstName: true,
            lastName: true,
        },
    })

    if (admin) {
        if (!admin.isActive) return { isAuthenticated: false, user: null }
        return {
            isAuthenticated: true,
            user: {
                id: user.id,
                email: user.email!,
                role: admin.role,
                name: `${admin.firstName} ${admin.lastName}`,
                table: "admins",
            },
        }
    }

    // 2. Employees table
    // NOTE: employees table is optional.
    // If not migrated yet, this will safely fail.
    // Future: enable when staff system is implemented.
    let employee = null

    try {
        employee = await db.query.employees.findFirst({
            where: eq(employees.id, user.id),
            columns: {
                role: true,
                isActive: true,
                firstName: true,
                lastName: true,
                position: true,
                profileImage: true,
            },
        })
    } catch {
        console.warn("[SAFE] employees table not ready yet — skipping employee lookup")
    }

    if (employee) {
        if (!employee.isActive) return { isAuthenticated: false, user: null }
        return {
            isAuthenticated: true,
            user: {
                id: user.id,
                email: user.email!,
                role: employee.role,
                name: `${employee.firstName} ${employee.lastName}`,
                table: "employees",
                position: employee.position,
                profileImage: employee.profileImage,
            },
        }
    }

    return { isAuthenticated: false, user: null }
})

// ─────────────────────────────────────────────────────────────
// verifyAdminPasscode  (Gatekeeper — Step 0)
// ─────────────────────────────────────────────────────────────
export async function verifyAdminPasscode(passcode: string): Promise<ActionResult> {
    const correctPasscode = process.env.ENCRYPTION_KEY

    if (!correctPasscode) {
        console.error("[AUTH] ENCRYPTION_KEY is not set in environment variables.")
        return { success: false, error: "Server configuration error." }
    }

    if (passcode !== correctPasscode) {
        return { success: false, error: "Invalid authorization code." }
    }

    try {
        const encrypted = encrypt(JSON.stringify({ authorized: true, timestamp: Date.now() }))
        const cookieStore = await cookies()

        cookieStore.set("gatekeeper_token", encrypted, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 24 hours
            path: "/",
        })

        return { success: true }
    } catch (err) {
        console.error("[AUTH] verifyAdminPasscode error:", err)
        return { success: false, error: "An unexpected error occurred." }
    }
}

// ─────────────────────────────────────────────────────────────
// initiateSignIn  (Step 1 — credentials → OTP)
// ─────────────────────────────────────────────────────────────
export async function initiateSignIn(email: string, password: string): Promise<ActionResult> {
    const supabase = await createClient()

    // 1. Supabase credential check
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (authError || !authData.user) {
        return { success: false, error: "Invalid email or password." }
    }

    const userId = authData.user.id

    // 2a. Check admins table
    const admin = await db.query.admins.findFirst({
        where: eq(admins.id, userId),
        columns: { isActive: true },
    })

    // 2b. Fall through to employees if not an admin
    // NOTE: employees table is optional.
    // If not migrated yet, this will safely fail.
    // Future: enable when staff system is implemented.
    let employee = null

    if (!admin) {
        try {
            employee = await db.query.employees.findFirst({
                where: eq(employees.id, userId),
                columns: { isActive: true },
            })
        } catch {
            console.warn("[SAFE] employees table not ready yet — skipping employee lookup")
        }
    }

    const record = admin ?? employee

    if (!record) {
        await supabase.auth.signOut()
        return { success: false, error: "Access denied: account not found in authorized records." }
    }

    if (!record.isActive) {
        await supabase.auth.signOut()
        return { success: false, error: "Your account is inactive. Please contact your administrator." }
    }

    // 3. Generate OTP — invalidate old ones first, then insert fresh
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    try {
        // Invalidate all previous unused OTPs for this email
        await db
            .update(otpCodes)
            .set({ isUsed: true })
            .where(
                and(
                    eq(otpCodes.email, email),
                    eq(otpCodes.isUsed, false)
                )
            )

        // Insert the new OTP
        await db.insert(otpCodes).values({
            email,
            code,
            expiresAt,
            isUsed: false,
        })

        // Send the code via email
        const emailResult = await sendOtpEmail(email, code, "admin")
        if (!emailResult.success) {
            await supabase.auth.signOut()
            return { success: false, error: "Failed to send verification code. Please try again." }
        }

        return { success: true }
    } catch (err) {
        console.error("[AUTH] initiateSignIn OTP error:", err)
        await supabase.auth.signOut()
        return { success: false, error: "A system error occurred. Please try again." }
    }
}

// ─────────────────────────────────────────────────────────────
// verifyOtpCode  (Step 2 — OTP → session unlock)
//
// After OTP is validated, we resolve the userId from Supabase's
// active session (the session was already established in
// initiateSignIn via signInWithPassword) and log the LOGIN event.
// ─────────────────────────────────────────────────────────────
export async function verifyOtpCode(email: string, code: string): Promise<ActionResult> {
    try {
        // All four conditions must pass — any mismatch returns invalid
        const validOtp = await db.query.otpCodes.findFirst({
            where: and(
                eq(otpCodes.email, email),
                eq(otpCodes.code, code),
                eq(otpCodes.isUsed, false),
                gt(otpCodes.expiresAt, new Date())
            ),
        })

        if (!validOtp) {
            return { success: false, error: "Invalid or expired verification code." }
        }

        // Mark consumed — prevents replay attacks
        await db
            .update(otpCodes)
            .set({ isUsed: true })
            .where(eq(otpCodes.id, validOtp.id))

        // Set the 2FA cookie — middleware reads this to unlock /admin
        const cookieStore = await cookies()
        cookieStore.set("2fa_verified", "true", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 12, // 12 hours
            path: "/",
        })

        // ── Resolve userId from the active Supabase session ──────────────
        // signInWithPassword in initiateSignIn already set the session,
        // so getUser() returns the authenticated user here.
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // Log LOGIN — non-blocking, will never throw or break the flow
        if (user?.id) {
            await createActivityLog(db, {
                userId: user.id,
                action: ActivityAction.LOGIN,
                module: ActivityModule.AUTH,
                description: `Login successful for ${email}`,
            })
        }

        revalidatePath("/", "layout")
        return { success: true }
    } catch (err) {
        console.error("[AUTH] verifyOtpCode error:", err)
        return { success: false, error: "An error occurred verifying the code. Please try again." }
    }
}

// ─────────────────────────────────────────────────────────────
// signOut
//
// Resolves the userId BEFORE signing out (getUser() returns
// null after signOut), logs the LOGOUT event, then clears
// all auth cookies and redirects to /login.
// ─────────────────────────────────────────────────────────────
export async function signOut(): Promise<void> {
    const supabase = await createClient()

    // Resolve userId before calling signOut (session is destroyed after)
    const { data: { user } } = await supabase.auth.getUser()

    // Log LOGOUT — non-blocking
    if (user?.id) {
        await createActivityLog(db, {
            userId: user.id,
            action: ActivityAction.LOGOUT,
            module: ActivityModule.AUTH,
            description: `Logout for ${user.email}`,
        })
    }

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Clear 2FA and gatekeeper cookies
    const cookieStore = await cookies()
    cookieStore.delete("2fa_verified")
    cookieStore.delete("gatekeeper_token")

    revalidatePath("/", "layout")
    redirect("/login")
}

// ─────────────────────────────────────────────────────────────
// sendCustomerOtpCode  (Customer Step 1 — email → OTP)
//
// Uses Supabase Admin generateLink() to ensure the customer
// account exists (creates it if new — preserving the combined
// sign-in / sign-up behaviour of the magic-link flow).
// Stores a 6-digit OTP in otp_codes and emails it via Nodemailer.
// The generated token_hash is stored alongside so it can be
// consumed by verifyCustomerOtpCode.
// ─────────────────────────────────────────────────────────────
export async function sendCustomerOtpCode(
    email: string,
): Promise<ActionResult> {
    try {
        // 1. Generate magic link — creates account if new (sign-in + sign-up)
        const { data: linkData, error: linkError } =
            await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/auth/callback`,
                },
            })

        if (linkError) {
            console.error('[customer-otp] generateLink error:', linkError.message)
            // Neutral message — prevents email enumeration
            return { success: true }
        }

        // 2. Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

        // 3. Invalidate previous unused OTPs for this email, then insert fresh one
        await db
            .update(otpCodes)
            .set({ isUsed: true })
            .where(
                and(
                    eq(otpCodes.email, email),
                    eq(otpCodes.isUsed, false)
                )
            )

        await db.insert(otpCodes).values({
            email,
            code,
            expiresAt,
            isUsed: false,
        })

        // 4. Send the code via branded Nodemailer email
        const emailResult = await sendOtpEmail(email, code, 'customer')
        if (!emailResult.success) {
            return { success: false, error: 'Failed to send verification code. Please try again.' }
        }

        // 5. Log activity (non-blocking)
        const userId = linkData.user?.id
        if (userId) {
            void createActivityLog(db, {
                userId,
                action: ActivityAction.MAGIC_LINK_SENT,
                module: ActivityModule.AUTH,
                description: `Customer OTP sent to ${email}`,
            })
        }

        return { success: true }
    } catch (err) {
        console.error('[customer-otp] sendCustomerOtpCode error:', err)
        return { success: false, error: 'An unexpected error occurred. Please try again.' }
    }
}

// ─────────────────────────────────────────────────────────────
// verifyCustomerOtpCode  (Customer Step 2 — OTP → session)
//
// Validates the 6-digit code from otp_codes, then signs the
// customer in via Supabase OTP verification (token_hash).
// Returns success/error so the client can stay in the modal.
// ─────────────────────────────────────────────────────────────
export async function verifyCustomerOtpCode(
    email: string,
    code: string,
): Promise<ActionResult> {
    try {
        // 1. Look up a valid, unexpired, unused OTP for this email+code
        const validOtp = await db.query.otpCodes.findFirst({
            where: and(
                eq(otpCodes.email, email),
                eq(otpCodes.code, code),
                eq(otpCodes.isUsed, false),
                gt(otpCodes.expiresAt, new Date())
            ),
        })

        if (!validOtp) {
            return { success: false, error: 'Invalid or expired verification code.' }
        }

        // 2. Mark consumed — prevents replay attacks
        await db
            .update(otpCodes)
            .set({ isUsed: true })
            .where(eq(otpCodes.id, validOtp.id))

        // 3. Sign in via Supabase using a fresh magic link token_hash
        //    generateLink creates an auto-confirm token the client can consume
        const { data: linkData, error: linkError } =
            await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: {
                    redirectTo: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/auth/callback`,
                },
            })

        if (linkError || !linkData.properties?.hashed_token) {
            console.error('[customer-otp] session generateLink error:', linkError?.message)
            return { success: false, error: 'Failed to establish session. Please try again.' }
        }

        // 4. Exchange the token_hash for a real session on the server
        const supabase = await createClient()
        const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: 'magiclink',
        })

        if (verifyError) {
            console.error('[customer-otp] verifyOtp error:', verifyError.message)
            return { success: false, error: 'Failed to sign in. Please try again.' }
        }

        // 5. Log LOGIN (non-blocking)
        const userId = linkData.user?.id
        if (userId) {
            void createActivityLog(db, {
                userId,
                action: ActivityAction.LOGIN,
                module: ActivityModule.AUTH,
                description: `Customer login via OTP code for ${email}`,
            })
        }

        revalidatePath('/', 'layout')
        return { success: true }
    } catch (err) {
        console.error('[customer-otp] verifyCustomerOtpCode error:', err)
        return { success: false, error: 'An error occurred verifying the code. Please try again.' }
    }
}
