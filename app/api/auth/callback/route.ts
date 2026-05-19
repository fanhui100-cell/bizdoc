import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as 'recovery' | 'signup' | 'magiclink' | null
  const next = searchParams.get('next') ?? '/zh/dashboard'
  const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL ?? origin).replace(/\/$/, '')
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/zh/dashboard'

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${siteOrigin}${safeNext}`)
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return NextResponse.redirect(`${siteOrigin}${safeNext}`)
  }

  return NextResponse.redirect(`${siteOrigin}/zh/login?error=auth-callback-failed`)
}
