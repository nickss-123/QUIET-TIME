import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']
const BYPASS_PATHS = ['/api/health', '/sw.js', '/offline.html', '/manifest.json']

export async function middleware(request: NextRequest) {
  if (BYPASS_PATHS.some((p) => request.nextUrl.pathname === p)) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list: { name: string; value: string; options?: CookieOptions }[]) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p))

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active, must_change_password')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=deactivated', request.url))
    }

    if (profile.must_change_password && path !== '/change-password') {
      return NextResponse.redirect(new URL('/change-password', request.url))
    }

    const home = profile.role === 'admin' ? '/dashboard' : '/morning'

    if (path.startsWith('/admin') && profile.role !== 'admin') {
      return NextResponse.redirect(new URL(home, request.url))
    }

    if ((path === '/dashboard' && profile.role !== 'admin') || isPublic) {
      return NextResponse.redirect(new URL(home, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|offline.html|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|zip)$).*)',
  ],
}
