import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'

interface FooterProps {
  locale: Locale
  dict: Dictionary
}

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white font-bold text-xs">
              B
            </div>
            <span className="text-sm font-medium text-gray-700">{dict.nav.logo}</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-gray-500">
            <Link href={`/${locale}/pricing`} className="hover:text-gray-700">
              {dict.nav.pricing}
            </Link>
            <Link href={`/${locale}/tools/quote`} className="hover:text-gray-700">
              {dict.nav.quote}
            </Link>
            <Link href={`/${locale}/tools/invoice`} className="hover:text-gray-700">
              {dict.nav.invoice}
            </Link>
            <Link href={`/${locale}/tools/email`} className="hover:text-gray-700">
              {dict.nav.email}
            </Link>
          </nav>
          <p className="text-xs text-gray-400">© {year} {dict.nav.logo}</p>
        </div>
      </div>
    </footer>
  )
}
