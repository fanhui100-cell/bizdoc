import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { proxy } from './proxy'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Let Next.js serve sitemap and robots directly without locale redirect
  if (pathname === '/sitemap.xml' || pathname === '/robots.txt') {
    return NextResponse.next()
  }

  return proxy(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
