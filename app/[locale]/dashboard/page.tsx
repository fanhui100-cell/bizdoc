import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n'
import DashboardClient from '@/components/dashboard/dashboard-client'
import type { Generation } from '@/lib/types'

interface Props {
  params: Promise<{ locale: string }>
}

const TYPE_ICONS: Record<string, string> = { quote: '📄', invoice: '🧾', email: '✉️' }
const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  quote:   { zh: '报价单', en: 'Quote' },
  invoice: { zh: 'Invoice', en: 'Invoice' },
  email:   { zh: '商务邮件', en: 'Email' },
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const supabase = await createClient()
  const zh = locale === 'zh'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('users_profile')
    .select('plan, quota_used, quota_monthly')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
  const limit = isPro ? 200 : 3

  const { data: generations } = await supabase
    .from('generations')
    .select('id, user_id, client_id, tool_type, status, invoice_status, locale, created_at, input_data, output_data, parent_id, accepted_at, acceptor_name, acceptor_email')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit)

  const d = dict.dashboard

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{d.title}</h1>
        <div className="text-sm text-gray-500">
          {dict.tools.quotaRemaining}:{' '}
          <span className="font-semibold text-indigo-600">
            {Math.max(0, (profile?.quota_monthly ?? 5) - (profile?.quota_used ?? 0))}
          </span>{' '}
          / {profile?.quota_monthly ?? 5}
        </div>
      </div>

      {!isPro && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {d.freeLimit}{' '}
          <Link href={`/${locale}/pricing`} className="font-medium underline">
            {dict.common.upgradeCta}
          </Link>
        </p>
      )}

      {!generations || generations.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-gray-500">{d.emptyState}</p>
          <Link
            href={`/${locale}/tools/quote`}
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {d.emptyStateCta}
          </Link>
        </div>
      ) : (
        <DashboardClient
          generations={generations as Generation[]}
          locale={locale}
          zh={zh}
        />
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {(['quote', 'invoice', 'email'] as const).map((type) => (
          <Link
            key={type}
            href={`/${locale}/tools/${type}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 py-4 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <span>{TYPE_ICONS[type]}</span>
            {zh ? `新建${TYPE_LABELS[type].zh}` : `New ${TYPE_LABELS[type].en}`}
          </Link>
        ))}
      </div>
    </div>
  )
}
