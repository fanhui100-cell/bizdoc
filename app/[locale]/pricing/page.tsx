import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import { PricingClient } from './pricing-client'

type Props = { params: Promise<{ locale: string }> }

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  const dict = await getDictionary(locale)

  return (
    <PricingClient
      locale={locale}
      t={dict.pricing}
    />
  )
}
