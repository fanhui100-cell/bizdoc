import Link from 'next/link'
import type { Dictionary, Locale } from '@/lib/i18n'

interface FooterProps {
  locale: Locale
  dict: Dictionary
}

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear()
  const zh = locale === 'zh'

  const tools = [
    { href: `/${locale}/tools/quote`,   label: dict.nav.quote },
    { href: `/${locale}/tools/invoice`, label: dict.nav.invoice },
    { href: `/${locale}/tools/email`,   label: dict.nav.email },
  ]

  const legal = [
    { href: `/${locale}/help`,    label: zh ? '帮助中心' : 'Help' },
    { href: `/${locale}/privacy`, label: zh ? '隐私政策' : 'Privacy Policy' },
    { href: `/${locale}/terms`,   label: zh ? '服务条款' : 'Terms of Service' },
  ]

  const trust = [
    { icon: '🔒', label: zh ? 'HTTPS 加密传输' : 'HTTPS encrypted' },
    { icon: '🚫', label: zh ? '不出售数据' : 'No data selling' },
    { icon: '🤖', label: zh ? 'AI 由 Claude 驱动' : 'Powered by Claude AI' },
  ]

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-4 border-b border-gray-100">
          {trust.map((t) => (
            <span key={t.label} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span>{t.icon}</span>
              {t.label}
            </span>
          ))}
        </div>

        {/* Main footer row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white font-bold text-xs">
              B
            </div>
            <span className="text-sm font-medium text-gray-700">{dict.nav.logo}</span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="text-xs text-gray-300 hidden sm:inline">|</span>
            {tools.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-gray-700 transition-colors">
                {l.label}
              </Link>
            ))}
            <span className="text-gray-200">·</span>
            <Link href={`/${locale}/cases`} className="hover:text-gray-700 transition-colors">
              {zh ? '客户案例' : 'Case Studies'}
            </Link>
            <span className="text-gray-200">·</span>
            <Link href={`/${locale}/pricing`} className="hover:text-gray-700 transition-colors">
              {dict.nav.pricing}
            </Link>
            <span className="text-gray-200">·</span>
            {legal.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-gray-700 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400">© {year} {dict.nav.logo}</p>
        </div>

      </div>
    </footer>
  )
}
