import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bizdoc.ai'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  const title = isZh ? '企文助手 — 小企业 AI 文书工具箱' : 'BizDoc AI — AI Document Assistant'
  const description = isZh
    ? '自动生成报价单、Invoice、商务邮件和客户跟进内容，帮小公司减少重复文书工作'
    : 'Generate professional quotes, invoices, and business emails with AI — built for small businesses'

  return {
    title,
    description,
    keywords: isZh
      ? ['报价单生成', 'Invoice生成', '商务邮件', 'AI文书', '小企业工具']
      : ['quote generator', 'invoice generator', 'business email AI', 'small business tools'],
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'zh-CN': `${BASE_URL}/zh`,
        'en':    `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName: isZh ? '企文助手' : 'BizDoc AI',
      locale: isZh ? 'zh_CN' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!isValidLocale(locale)) notFound()

  const dict = await getDictionary(locale)

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar locale={locale} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} dict={dict} />
    </div>
  )
}
