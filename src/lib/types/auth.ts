// lib/types/auth.ts

// Matches your two actual Drizzle tables — no more "authorized_personnel"
export type UserTable = "admins" | "employees"

export interface UserSessionData {
    id: string
    email: string
    role: string
    name: string
    table: UserTable
    // Only employees have these fields
    position?: string | null
    profileImage?: string | null
}

export type AuthResponse =
    | { isAuthenticated: true; user: UserSessionData }
    | { isAuthenticated: false; user: null }