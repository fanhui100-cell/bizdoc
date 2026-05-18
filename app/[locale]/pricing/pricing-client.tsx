import Link from 'next/link'
import type { Dictionary } from '@/lib/i18n'

type PricingCopy = Dictionary['pricing']
type TierKey = 'free' | 'pro' | 'business'

interface Props {
  locale: string
  t: PricingCopy
}

const CHECK = '✓'

export function PricingClient({ locale, t }: Props) {
  const tiers: { key: TierKey; highlighted: boolean }[] = [
    { key: 'free', highlighted: false },
    { key: 'pro', highlighted: true },
    { key: 'business', highlighted: false },
  ]

  return (
    <div className="py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{t.title}</h1>
          <p className="mt-4 text-gray-500 text-base max-w-2xl mx-auto">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
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
                {key === 'pro' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-yellow-400 text-yellow-900 text-xs font-semibold px-3 py-1">
                      {t.popular}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className={['text-lg font-bold', highlighted ? 'text-white' : 'text-gray-900'].join(' ')}>
                    {tier.name}
                  </h2>
                  <p className={['text-sm mt-1', highlighted ? 'text-blue-100' : 'text-gray-500'].join(' ')}>
                    {tier.desc}
                  </p>
                </div>

                <div className="mb-6">
                  <span className={['text-4xl font-bold', highlighted ? 'text-white' : 'text-gray-900'].join(' ')}>
                    {tier.price}
                  </span>
                  {key !== 'free' && (
                    <span className={['text-sm ml-1', highlighted ? 'text-blue-100' : 'text-gray-500'].join(' ')}>
                      {t.monthly}
                    </span>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span
                        className={[
                          'text-sm font-medium flex-shrink-0 mt-0.5',
                          highlighted ? 'text-blue-200' : 'text-primary',
                        ].join(' ')}
                      >
                        {CHECK}
                      </span>
                      <span className={['text-sm', highlighted ? 'text-blue-50' : 'text-gray-600'].join(' ')}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={key === 'free' ? `/${locale}/tools/quote` : `/${locale}/checkout?plan=${key}`}
                  className={[
                    'inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    highlighted
                      ? 'bg-white text-primary hover:bg-blue-50'
                      : 'bg-primary text-white hover:bg-primary-dark',
                  ].join(' ')}
                >
                  {tier.cta}
                </Link>
              </div>
            )
          })}
        </div>

        <p className="mb-12 text-center text-sm text-gray-500">
          {t.upgradeNote}
        </p>

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
