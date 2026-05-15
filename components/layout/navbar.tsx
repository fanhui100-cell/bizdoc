'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Dictionary, Locale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  locale: Locale
  dict: Dictionary
}

export default function Navbar({ locale, dict }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [quota, setQuota] = useState<{ used: number; monthly: number } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) { setQuota(null); return }
    supabase
      .from('users_profile')
      .select('quota_used, quota_monthly')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setQuota({ used: data.quota_used, monthly: data.quota_monthly })
      })
  }, [user])

  const otherLocale: Locale = locale === 'zh' ? 'en' : 'zh'
  const otherLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${locale}`)
    router.refresh()
  }

  const navLinks = [
    { href: `/${locale}/tools/quote`, label: dict.nav.quote },
    { href: `/${locale}/tools/invoice`, label: dict.nav.invoice },
    { href: `/${locale}/tools/email`, label: dict.nav.email },
    { href: `/${locale}/pricing`, label: dict.nav.pricing },
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
              B
            </div>
            <span className="font-semibold text-gray-900 text-sm sm:text-base">
              {dict.nav.logo}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'bg-primary-light text-primary'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Locale switcher */}
            <Link
              href={otherLocalePath}
              className="hidden sm:flex items-center px-2 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
            >
              {otherLocale === 'en' ? 'EN' : '中文'}
            </Link>

            {user ? (
              <>
                {quota && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 border border-indigo-200">
                    {Math.max(0, quota.monthly - quota.used)}&thinsp;/&thinsp;{quota.monthly}
                    <span className="text-indigo-400">{dict.nav.quotaLabel}</span>
                  </span>
                )}
                <Link
                  href={`/${locale}/dashboard`}
                  className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  {dict.nav.dashboard}
                </Link>
                <Link
                  href={`/${locale}/account`}
                  className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  {dict.nav.account}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  {dict.nav.logout}
                </button>
              </>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
              >
                {dict.nav.login}
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
            <Link
              href={otherLocalePath}
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {otherLocale === 'en' ? 'English' : '中文'}
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link href={`/${locale}/dashboard`} onClick={() => setMenuOpen(false)} className="text-sm text-gray-600">
                  {dict.nav.dashboard}
                </Link>
                <button onClick={handleLogout} className="text-sm text-gray-500">
                  {dict.nav.logout}
                </button>
              </div>
            ) : (
              <Link href={`/${locale}/login`} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-primary">
                {dict.nav.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
