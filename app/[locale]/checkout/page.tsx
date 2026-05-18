import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import { ContactButton } from '@/components/ui/contact-button'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ plan?: string }>
}

type PaidPlan = 'pro' | 'business'

const paidPlans: PaidPlan[] = ['pro', 'business']

export default async function CheckoutPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const dict = await getDictionary(locale)
  const zh = locale === 'zh'
  const requestedPlan = (await searchParams).plan
  const planKey: PaidPlan = paidPlans.includes(requestedPlan as PaidPlan) ? (requestedPlan as PaidPlan) : 'pro'
  const plan = dict.pricing.tiers[planKey]

  const paymentMethods = [
    { label: zh ? '微信支付' : 'WeChat Pay', src: '/pay/wechat-pay.png' },
    { label: zh ? '支付宝' : 'Alipay', src: '/pay/alipay-pay.png' },
  ]

  return (
    <div className="px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {zh ? '独立付款页' : 'Checkout'}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              {zh ? '扫码付款开通套餐' : 'Scan to Pay and Activate Your Plan'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500">
              {zh
                ? '请选择确认套餐后扫码付款。付款备注填写注册邮箱，付款完成后联系客服提交付款时间、付款人信息或截图说明。'
                : 'Confirm your plan, scan to pay, and include your registered email in the payment note. After payment, contact support with the payment time, payer name, or screenshot note.'}
            </p>
          </div>
          <Link href={`/${locale}/pricing`} className="text-sm font-medium text-primary hover:underline">
            {zh ? '返回价格页' : 'Back to pricing'}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-500">{zh ? '当前选择' : 'Selected plan'}</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{plan.name}</h2>
            <p className="mt-2 text-4xl font-bold text-primary">
              {plan.price}
              <span className="ml-1 text-sm font-medium text-gray-500">{dict.pricing.monthly}</span>
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {paidPlans.map((key) => {
                const tier = dict.pricing.tiers[key]
                const active = key === planKey
                return (
                  <Link
                    key={key}
                    href={`/${locale}/checkout?plan=${key}`}
                    className={[
                      'rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                      active
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-primary',
                    ].join(' ')}
                  >
                    {tier.name}
                  </Link>
                )
              })}
            </div>

            <ul className="mt-6 space-y-2 text-sm text-gray-600">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </aside>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {paymentMethods.map((method) => (
                <article key={method.label} className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
                  <img
                    src={method.src}
                    alt={method.label}
                    className="aspect-[1/1.25] w-full rounded-lg bg-white object-contain"
                  />
                  <strong className="mt-3 block text-gray-900">{method.label}</strong>
                </article>
              ))}
            </div>

            <ol className="mt-6 grid gap-3 text-sm text-gray-600">
              {(zh
                ? [
                    `确认套餐为 ${plan.name}。`,
                    '使用微信或支付宝扫码付款。',
                    '付款备注填写注册邮箱。',
                    '付款后联系客服，提交付款时间、付款人信息或截图说明。',
                  ]
                : [
                    `Confirm the selected plan: ${plan.name}.`,
                    'Scan with WeChat Pay or Alipay.',
                    'Put your registered email in the payment note.',
                    'Contact support with the payment time, payer name, or screenshot note.',
                  ]
              ).map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-900">{dict.pricing.upgradeNoteIntl}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <ContactButton label={dict.pricing.contact} />
                {process.env.NEXT_PUBLIC_WHATSAPP_PHONE && (
                  <a
                    href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1ebe5d]"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
