import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import Navbar from '@/components/layout/navbar'
import Footer from '@/components/layout/footer'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isZh = locale === 'zh'
  return {
    title: isZh ? '企文助手 — 小企业 AI 文书工具箱' : 'BizDoc AI — AI Document Assistant',
    description: isZh
      ? '自动生成报价单、Invoice、商务邮件和客户跟进内容'
      : 'Generate quotes, invoices, and business emails with AI',
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
