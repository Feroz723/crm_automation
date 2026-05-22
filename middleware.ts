import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware to enforce authentication on protected routes.
 * 
 * Uses a simple cookie-based check. The actual token verification happens
 * server-side in API routes using firebase-admin. The middleware only checks
 * for the presence of the auth cookie, since firebase-admin cannot run in
 * the Edge Runtime that Next.js middleware uses.
 */
export async function middleware(request: NextRequest) {
    const token = request.cookies.get('fb-token')?.value
    const { pathname } = request.nextUrl

    // 1. If no token and trying to access protected routes -> redirect to login
    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // 2. If token exists and trying to access auth pages -> redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
