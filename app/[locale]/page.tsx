import Link from 'next/link'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import Button from '@/components/ui/button'

type Props = { params: Promise<{ locale: string }> }

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  const t = dict.home

  const features = [
    {
      icon: '📄',
      title: t.features.quote.title,
      desc: t.features.quote.desc,
      href: `/${locale}/tools/quote`,
    },
    {
      icon: '🧾',
      title: t.features.invoice.title,
      desc: t.features.invoice.desc,
      href: `/${locale}/tools/invoice`,
    },
    {
      icon: '✉️',
      title: t.features.email.title,
      desc: t.features.email.desc,
      href: `/${locale}/tools/email`,
    },
  ]

  const stats = [
    { value: t.stats.free, icon: '🎁' },
    { value: t.stats.ai, icon: '🤖' },
    { value: t.stats.bilingual, icon: '🌐' },
  ]

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-light to-white px-4 py-20 sm:py-28 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            {t.hero.title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/${locale}/login`}>
              <Button size="lg">{t.hero.ctaStart}</Button>
            </Link>
            <Link href={`/${locale}/tools/quote`}>
              <Button size="lg" variant="outline">{t.hero.ctaQuote}</Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button size="lg" variant="ghost">{t.hero.ctaPricing}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-white py-6">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-8">
            {stats.map((stat) => (
              <div key={stat.value} className="flex items-center gap-2 text-gray-600">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t.features.title}
            </h2>
            <p className="mt-3 text-gray-500 text-base">{t.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Link key={feature.href} href={feature.href} className="group">
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-primary hover:shadow-md group-hover:-translate-y-0.5">
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                  <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {locale === 'zh' ? '立即使用 →' : 'Try it →'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.cta.title}</h2>
          <p className="mt-3 text-blue-100 text-base">{t.cta.subtitle}</p>
          <div className="mt-8">
            <Link href={`/${locale}/login`}>
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-blue-50 focus-visible:ring-white"
              >
                {t.cta.btn}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
