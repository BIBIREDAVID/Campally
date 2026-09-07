import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup')

  // Browsing content doesn't require an account — only identity-specific
  // actions (cases, profile, notifications, admin) do. Each public route
  // still personalises itself when a session IS present; this list is only
  // what stays reachable when there isn't one.
  const isPublicContent =
    path === '/' ||
    path.startsWith('/news') ||
    path.startsWith('/events') ||
    path.startsWith('/clubs') ||
    path.startsWith('/campus') ||
    path.startsWith('/deals') ||
    path.startsWith('/search') ||
    path.startsWith('/more')

  const isPublic =
    isAuthRoute ||
    isPublicContent ||
    path.startsWith('/verify') ||
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/auth/callback')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
