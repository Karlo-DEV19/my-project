import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Keep your existing prefixes, but we'll handle '/admin' specially below
const PROTECTED_PREFIXES = [
    '/dashboard',
    '/backoffice',
    // '/settings',
]

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // =======================================================================
    // 1. ADMIN ROUTE PROTECTION
    // =======================================================================
    const isAdminRoute = pathname.startsWith('/admin');
    const isAdminLoginPage = pathname === '/login';

    if (isAdminRoute) {
        // If they are NOT logged in and trying to view the admin dashboard
        if (!user && !isAdminLoginPage) {
            const url = request.nextUrl.clone();
            url.pathname = '/login'; // Kick them to the admin-specific login
            return NextResponse.redirect(url);
        }

        // If they ARE logged in but trying to view the login page again
        if (user && isAdminLoginPage) {
            const url = request.nextUrl.clone();
            url.pathname = '/admin'; // Push them directly into the dashboard
            return NextResponse.redirect(url);
        }
    }

    // =======================================================================
    // 2. GENERAL PROTECTED ROUTES (Customers/Users)
    // =======================================================================
    const isInProtectedGroup = PROTECTED_PREFIXES.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
    )

    // If it's a general protected route (like /dashboard) and they aren't logged in
    if (!user && isInProtectedGroup) {
        const url = request.nextUrl.clone()
        url.pathname = '/login' // Kick them to the general customer login
        url.search = ''
        return NextResponse.redirect(url)
    }

    // Keep Supabase cookies in sync
    return supabaseResponse
}