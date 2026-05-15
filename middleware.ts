import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const locales = ['zh', 'en'] as const
type Locale = (typeof locales)[number]
const defaultLocale: Locale = 'zh'

const adminEmails = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean)

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (acceptLanguage.includes('zh')) return 'zh'
  return 'en'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  // Root redirect: / → /zh or /en based on Accept-Language
  if (pathname === '/') {
    const locale = getPreferredLocale(request)
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // If path doesn't start with a locale and isn't an API/admin route, prefix it
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (!pathnameHasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(
      new URL(`/${defaultLocale}${pathname}`, request.url)
    )
  }

  // Admin guard: only ADMIN_EMAILS can access /admin
  if (pathname.startsWith('/admin')) {
    let response = NextResponse.next()

    if (adminEmails.length === 0) {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !adminEmails.includes(user.email ?? '')) {
      return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url))
    }

    return response
  }

  // Refresh session cookies for all other routes
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
