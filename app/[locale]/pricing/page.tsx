import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import Button from '@/components/ui/button'
import { ContactButton } from '@/components/ui/contact-button'

type Props = { params: Promise<{ locale: string }> }

const CHECK = '✓'

export default async function PricingPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  const dict = await getDictionary(locale)
  const t = dict.pricing

  const tiers = [
    {
      key: 'free' as const,
      highlighted: false,
    },
    {
      key: 'pro' as const,
      highlighted: true,
    },
    {
      key: 'business' as const,
      highlighted: false,
    },
  ]

  return (
    <div className="py-16 px-4">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-4 text-gray-500 text-base max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {tiers.map(({ key, highlighted }) => {
            const tier = t.tiers[key]
            return (
              <div
                key={key}
                className={[
                  'relative rounded-2xl border p-6 flex flex-col',
                  highlighted
                    ? 'border-primary bg-primary shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white',
                ].join(' ')}
              >
                {/* Popular badge */}
                {key === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1">
                      {t.popular}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className={[
                    'text-lg font-bold',
                    highlighted ? 'text-white' : 'text-gray-900',
                  ].join(' ')}>
                    {tier.name}
                  </h2>
                  <p className={[
                    'text-sm mt-1',
                    highlighted ? 'text-blue-100' : 'text-gray-500',
                  ].join(' ')}>
                    {tier.desc}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={[
                    'text-4xl font-bold',
                    highlighted ? 'text-white' : 'text-gray-900',
                  ].join(' ')}>
                    {tier.price}
                  </span>
                  {key !== 'free' && (
                    <span className={[
                      'text-sm ml-1',
                      highlighted ? 'text-blue-100' : 'text-gray-500',
                    ].join(' ')}>
                      {t.monthly}
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className={[
                        'text-sm font-medium flex-shrink-0 mt-0.5',
                        highlighted ? 'text-blue-200' : 'text-primary',
                      ].join(' ')}>
                        {CHECK}
                      </span>
                      <span className={[
                        'text-sm',
                        highlighted ? 'text-blue-50' : 'text-gray-600',
                      ].join(' ')}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={key === 'free' ? `/${locale}/tools/quote` : `/${locale}/login`}
                  className="block"
                >
                  <Button
                    className="w-full"
                    variant={highlighted ? 'outline' : 'primary'}
                    style={highlighted ? { backgroundColor: 'white', color: '#2563eb' } : undefined}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Upgrade instructions */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center space-y-3">
          <p className="text-sm text-gray-600">{t.upgradeNote}</p>
          <p className="text-sm text-gray-500">{t.upgradeNoteIntl}</p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <ContactButton label={t.contact} />
            {process.env.NEXT_PUBLIC_WHATSAPP_PHONE && (
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1ebe5d] transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{t.faq.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { q: t.faq.q1, a: t.faq.a1 },
              { q: t.faq.q2, a: t.faq.a2 },
              { q: t.faq.q3, a: t.faq.a3 },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-2">{q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
