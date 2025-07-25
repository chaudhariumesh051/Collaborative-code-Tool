import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ["/project", "/dashboard", "/settings", "/api/projects"]
  const isProtectedRoute = protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Admin routes
  const adminRoutes = ["/admin"]
  const isAdminRoute = adminRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // API routes that require authentication
  const protectedApiRoutes = ["/api/projects", "/api/user"]
  const isProtectedApiRoute = protectedApiRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/", req.url)
    redirectUrl.searchParams.set("redirect", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check admin access
  if (isAdminRoute && session) {
    try {
      const { data: user } = await supabase.from("users").select("role").eq("id", session.user.id).single()

      if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Handle API authentication
  if (isProtectedApiRoute && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting for auth endpoints
  const authEndpoints = ["/api/auth/login", "/api/auth/signup", "/api/auth/reset"]
  const isAuthEndpoint = authEndpoints.some((endpoint) => req.nextUrl.pathname.startsWith(endpoint))

  if (isAuthEndpoint) {
    // Simple rate limiting based on IP
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"

    // In production, you'd want to use a proper rate limiting solution
    // like Upstash Redis or similar
    const rateLimitKey = `rate_limit:${ip}:${req.nextUrl.pathname}`

    // For now, we'll just add headers for monitoring
    res.headers.set("X-RateLimit-IP", ip)
    res.headers.set("X-RateLimit-Endpoint", req.nextUrl.pathname)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
