import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n'
import type { Generation, Locale } from '@/lib/types'

interface Props {
  params: Promise<{ locale: string }>
}

const TYPE_ICONS: Record<string, string> = {
  quote: '📄',
  invoice: '🧾',
  email: '✉️',
}

export default async function DashboardPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('users_profile')
    .select('plan, quota_used, quota_monthly')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'business'
  const limit = isPro ? 100 : 3

  const { data: generations } = await supabase
    .from('generations')
    .select('id, tool_type, status, created_at, output_data')
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
          {dict.tools.quotaRemaining}: <span className="font-semibold text-indigo-600">{Math.max(0, (profile?.quota_monthly ?? 5) - (profile?.quota_used ?? 0))}</span> / {profile?.quota_monthly ?? 5}
        </div>
      </div>

      {!isPro && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          {d.freeLimit}{' '}
          <Link href={`/${locale}/pricing`} className="font-medium underline">{dict.common.upgradeCta}</Link>
        </p>
      )}

      {!generations || generations.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-gray-500">{d.emptyState}</p>
          <Link href={`/${locale}/tools/quote`}
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {d.emptyStateCta}
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white overflow-hidden">
          {(generations as Generation[]).map((gen) => {
            const output = gen.output_data as Record<string, string> | null
            const title =
              gen.tool_type === 'quote' ? (output?.title ?? 'Quote')
              : gen.tool_type === 'invoice' ? (output?.invoiceTitle ?? `Invoice ${output?.invoiceNumber ?? ''}`)
              : (output?.subject ?? 'Email')

            return (
              <div key={gen.id} className="flex items-center justify-between px-4 py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl" aria-hidden>{TYPE_ICONS[gen.tool_type] ?? '📄'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                    <p className="text-xs text-gray-400">{new Date(gen.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-gray-500 capitalize">{gen.tool_type}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
