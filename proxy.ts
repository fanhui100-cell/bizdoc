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

const LOCALE_COOKIE = 'bizdoc-locale'

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Explicit user choice saved in cookie
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookie === 'zh' || cookie === 'en') return cookie

  // 2. Browser Accept-Language header
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  if (/\bzh\b/i.test(acceptLanguage)) return 'zh'

  return 'en'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let crawlers and ownership verification requests hit their files directly.
  if (
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    /^\/baidu_verify_.*\.html$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next()
  }

  // When user navigates to a locale-prefixed path, persist that locale in a cookie
  const activeLocale = locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  )
  if (activeLocale) {
    const response = NextResponse.next()
    const current = request.cookies.get(LOCALE_COOKIE)?.value
    if (current !== activeLocale) {
      response.cookies.set(LOCALE_COOKIE, activeLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
    }
    // Continue to admin guard / session refresh below
    if (!pathname.startsWith('/admin')) {
      // refresh Supabase session cookies on this same response
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cs) => cs.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
          },
        }
      )
      await supabase.auth.getUser()
      return response
    }
  }

  // Root redirect: / → preferred locale
  if (pathname === '/') {
    const locale = getPreferredLocale(request)
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // Non-locale, non-API paths → redirect to preferred locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (!pathnameHasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/admin') && !pathname.startsWith('/view')) {
    const locale = getPreferredLocale(request)
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
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

    const { data: { user } } = await supabase.auth.getUser()

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
