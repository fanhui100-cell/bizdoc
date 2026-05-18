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
  const zh = locale === 'zh'

  const features = [
    {
      icon: '📄',
      color: 'bg-blue-50 text-blue-600',
      title: t.features.quote.title,
      desc: t.features.quote.desc,
      href: `/${locale}/tools/quote`,
      cta: zh ? '生成报价单 →' : 'Generate Quote →',
    },
    {
      icon: '🧾',
      color: 'bg-emerald-50 text-emerald-600',
      title: t.features.invoice.title,
      desc: t.features.invoice.desc,
      href: `/${locale}/tools/invoice`,
      cta: zh ? '生成 Invoice →' : 'Generate Invoice →',
    },
    {
      icon: '✉️',
      color: 'bg-violet-50 text-violet-600',
      title: t.features.email.title,
      desc: t.features.email.desc,
      href: `/${locale}/tools/email`,
      cta: zh ? '生成邮件 →' : 'Generate Email →',
    },
  ]

  const steps = [
    t.howItWorks.step1,
    t.howItWorks.step2,
    t.howItWorks.step3,
  ]

  const whyItems = t.why.items

  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 py-24 sm:py-32 text-center">
        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative mx-auto max-w-3xl">
          <span className="inline-block mb-4 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-blue-100 ring-1 ring-white/20">
            {zh ? '🚀 AI 驱动 · 免费开始' : '🚀 AI-Powered · Free to Start'}
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            {t.hero.title}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 leading-relaxed max-w-2xl mx-auto">
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href={`/${locale}/login`}>
              <Button variant="white" size="lg">
                {t.hero.ctaStart}
              </Button>
            </Link>
            <Link href={`/${locale}/tools/quote`}>
              <Button size="lg" className="border border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm">
                {t.hero.ctaQuote}
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-blue-200">
            {zh ? '无需信用卡 · 免费 5 次/月' : 'No credit card required · 5 free uses/month'}
          </p>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b border-gray-100 bg-white py-5">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {[
              { icon: '🎁', label: t.stats.free },
              { icon: '⚡', label: t.stats.ai },
              { icon: '🌐', label: t.stats.bilingual },
              { icon: '📑', label: zh ? '3 种文书类型' : '3 document types' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-gray-500">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t.features.title}
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className="group">
                <div className="h-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 flex flex-col">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{f.desc}</p>
                  <div className="mt-5 text-sm font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.cta}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-white">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.howItWorks.title}</h2>
            <p className="mt-3 text-gray-500">{t.howItWorks.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            {/* connector line (desktop) */}
            <div className="hidden sm:block absolute top-8 left-1/6 right-1/6 h-px bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />
            {steps.map((step, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white font-bold text-lg shadow-lg shadow-blue-200 mb-5">
                  {step.num}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose us ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">{t.why.title}</h2>
              <ul className="space-y-4">
                {whyItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">✓</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Mini preview card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
                <span className="ml-auto text-xs text-gray-400">{zh ? '报价单预览' : 'Quote Preview'}</span>
              </div>
              <div className="space-y-3">
                <div className="h-4 w-2/3 rounded bg-gray-100" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                  {[90, 70, 80].map((w, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-2.5 rounded bg-blue-100 flex-1" style={{ maxWidth: `${w}%` }} />
                      <div className="h-2.5 w-12 rounded bg-gray-100" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="h-7 w-24 rounded-lg bg-primary opacity-80" />
                </div>
              </div>
              <p className="mt-5 text-center text-xs text-gray-400">
                {zh ? '✨ AI 生成，5 秒完成' : '✨ AI generated in 5 seconds'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Security ── */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-10">
            {zh ? '安全与隐私承诺' : 'Security & Privacy Commitments'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              {
                icon: '🔒',
                title: zh ? 'HTTPS 加密' : 'HTTPS Encrypted',
                desc: zh ? '全程加密传输，数据不会被中间人截取' : 'All data in transit is encrypted end-to-end',
              },
              {
                icon: '🛡️',
                title: zh ? '行级权限隔离' : 'Row-Level Security',
                desc: zh ? '数据库层强制隔离，只有你能看到自己的数据' : 'Database enforces isolation — only you see your data',
              },
              {
                icon: '🚫',
                title: zh ? '不出售数据' : 'No Data Selling',
                desc: zh ? '我们不会将你的任何信息出售或共享给广告商' : 'We never sell or share your information with advertisers',
              },
              {
                icon: '📄',
                title: zh ? '生成内容归你所有' : 'You Own the Output',
                desc: zh ? 'AI 生成的所有文书版权归你，可自由商用' : 'All AI-generated documents belong to you for commercial use',
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2">
                <span className="text-3xl">{item.icon}</span>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-xs text-gray-400">
            {zh ? (
              <>阅读我们的 <Link href={`/${locale}/privacy`} className="text-primary hover:underline">隐私政策</Link> 和 <Link href={`/${locale}/terms`} className="text-primary hover:underline">服务条款</Link></>
            ) : (
              <>Read our <Link href={`/${locale}/privacy`} className="text-primary hover:underline">Privacy Policy</Link> and <Link href={`/${locale}/terms`} className="text-primary hover:underline">Terms of Service</Link></>
            )}
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-primary py-20 px-4 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{t.cta.title}</h2>
          <p className="mt-3 text-blue-100 text-base">{t.cta.subtitle}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/${locale}/login`}>
              <Button variant="white" size="lg">
                {t.cta.btn}
              </Button>
            </Link>
            <Link href={`/${locale}/pricing`}>
              <Button size="lg" className="border border-white/30 bg-white/10 text-white hover:bg-white/20">
                {zh ? '查看价格方案' : 'View Pricing'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
