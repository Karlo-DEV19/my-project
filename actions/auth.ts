"use server"

import { encrypt } from '@/lib/helpers/crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// 🚨 THE FIX: Use your Server utility, not the Client utility!
// Adjust this path to wherever your Supabase server client is located. 
// Based on your earlier code, it might be '@/lib/utils/supabase/server'
import { createClient } from '@/lib/supabase/server';

// Response types
type SuccessResponse<T> = { status: "success"; data: T }
type ErrorResponse = { status: "error"; message: string }
type AuthResponse<T> = SuccessResponse<T> | ErrorResponse


interface SignInData {
    email: string;
    password: string;
}

export async function signIn(formData: SignInData) {
    const supabase = await createClient();

    // 1. Verify Email & Password
    const { error: authError, data: authData } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
    });

    if (authError) return { success: false, error: authError.message };
    const userId = authData.user.id;

    // 2. Fetch from BOTH tables using .maybeSingle()
    // No .catch() needed. Supabase safely catches its own errors and returns them.
    const [adminResponse, employeeResponse] = await Promise.all([
        supabase.from("admins").select("role, is_active").eq("id", userId).maybeSingle(),
        supabase.from("employees").select("role, is_active").eq("id", userId).maybeSingle()
    ]);

    // 🚨 DEBUG: Let's see exactly what we get back
    console.log("--> Admin Data:", adminResponse.data);
    console.log("--> Admin Error:", adminResponse.error?.message || "None");

    const userProfile = adminResponse.data || employeeResponse.data;

    // 3. Reject if they don't exist in either table
    if (!userProfile) {
        await supabase.auth.signOut();
        return {
            success: false,
            error: "Unauthorized access. This portal is strictly for active personnel."
        };
    }

    // 4. Reject if deactivated
    if (!userProfile.is_active) {
        await supabase.auth.signOut();
        return {
            success: false,
            error: "Your account is currently inactive. Please contact administration."
        };
    }

    // 5. Success! 
    revalidatePath("/", "layout");
    return {
        success: true,
        user: authData.user,
        role: userProfile.role
    };
}

export async function getUserSession() {
    const supabase = await createClient();

    // 1. Get the raw Supabase Auth user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { isAuthenticated: false, user: null, role: null };
    }

    // 2. Verify they are actually staff/admin (Parallel Fetch)
    const [adminResponse, employeeResponse] = await Promise.all([
        supabase.from("admins").select("role, is_active").eq("id", user.id).maybeSingle(),
        supabase.from("employees").select("role, is_active").eq("id", user.id).maybeSingle()
    ]);

    const userProfile = adminResponse.data || employeeResponse.data;

    // 3. Security checks
    if (!userProfile || !userProfile.is_active) {
        return { isAuthenticated: false, user: null, role: null };
    }

    // 4. Return the safe, combined profile
    return {
        isAuthenticated: true,
        user: {
            id: user.id,
            email: user.email,
            role: userProfile.role,
        }
    };
}


/**
 * Sign Out
 */
export async function signOut(): Promise<AuthResponse<null>> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        return {
            status: "error",
            message: error.message
        }
    }

    const cookieStore = await cookies();
    cookieStore.delete('gatekeeper_token');

    return {
        status: "success",
        data: null
    }
}

export async function verifyAdminPasscode(passcode: string) {
    try {
        const correctPasscode = process.env.ENCRYPTION_KEY;

        if (!correctPasscode) {
            console.error("CRITICAL: ENCRYPTION_KEY is missing from .env");
            return { success: false, error: 'Server configuration error.' };
        }

        if (passcode !== correctPasscode) {
            return { success: false, error: 'Invalid authorization code.' };
        }

        const tokenPayload = JSON.stringify({
            authorized: true,
            role: 'admin',
            timestamp: Date.now()
        });

        const encryptedToken = encrypt(tokenPayload);

        // Sets the gatekeeper UI cookie so they don't have to type the passcode again for 24 hours
        const cookieStore = await cookies();
        cookieStore.set('gatekeeper_token', encryptedToken, {
            maxAge: 60 * 60 * 24, // 1 day
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
        });

        return { success: true };

    } catch (error) {
        console.error('Passcode verification error:', error);
        return { success: false, error: 'An unexpected error occurred during verification.' };
    }
}