import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDictionary } from '@/lib/i18n'
import { CompanyProfileForm } from '@/components/account/company-profile-form'
import { PasswordChangeForm } from '@/components/account/password-change-form'
import { DeleteAccountButton } from '@/components/account/delete-account-button'
import { ApiKeysPanel } from '@/components/account/api-keys-panel'

interface Props {
  params: Promise<{ locale: string }>
}

const PLAN_LABELS: Record<string, { zh: string; en: string }> = {
  free:     { zh: '免费版', en: 'Free' },
  pro:      { zh: 'Pro 版', en: 'Pro' },
  business: { zh: '企业版', en: 'Business' },
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params
  const dict = await getDictionary(locale)
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('users_profile')
    .select('plan, quota_used, quota_monthly, quota_reset_at, expires_at, full_name, email')
    .eq('id', user.id)
    .single()

  const zh = locale === 'zh'
  const a = dict.account
  const plan = (profile?.plan ?? 'free') as string
  const planLabel = PLAN_LABELS[plan]?.[zh ? 'zh' : 'en'] ?? plan
  const remaining = Math.max(0, (profile?.quota_monthly ?? 5) - (profile?.quota_used ?? 0))

  const resetAt = profile?.quota_reset_at
    ? new Date(profile.quota_reset_at).toLocaleDateString(zh ? 'zh-CN' : 'en-US')
    : '—'

  const expiresAt = profile?.expires_at
    ? new Date(profile.expires_at).toLocaleDateString(zh ? 'zh-CN' : 'en-US')
    : (zh ? '永不过期' : 'Never')

  const otherLocale = locale === 'zh' ? 'en' : 'zh'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{a.title}</h1>

      {/* Profile */}
      <section className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{zh ? '账户' : 'Account'}</p>
          <p className="text-sm font-medium text-gray-900">{profile?.full_name ?? user.email}</p>
          <p className="text-sm text-gray-500">{profile?.email ?? user.email}</p>
        </div>

        {/* Plan + quota */}
        <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{a.plan}</p>
            <p className="font-semibold text-indigo-600">{planLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{a.quotaUsed}</p>
            <p className="font-semibold text-gray-900">
              {profile?.quota_used ?? 0} / {profile?.quota_monthly ?? 5}
              <span className="ml-1 text-xs text-gray-400">({zh ? `剩余 ${remaining}` : `${remaining} left`})</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{a.quotaNext}</p>
            <p className="text-gray-700">{resetAt}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{a.expiresAt}</p>
            <p className="text-gray-700">{expiresAt}</p>
          </div>
        </div>
      </section>

      {/* Company Profile */}
      <section className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <CompanyProfileForm zh={zh} />
      </section>

      {/* Client Book */}
      <section className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{a.clients}</p>
          <p className="text-xs text-gray-400">{zh ? '保存常用客户信息' : 'Save frequently used client info'}</p>
        </div>
        <Link
          href={`/${locale}/clients`}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {zh ? '管理客户 →' : 'Manage →'}
        </Link>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-red-800">{zh ? '危险操作' : 'Danger Zone'}</p>
          <p className="text-xs text-red-400 mt-0.5">
            {zh ? '注销后所有数据将被永久删除，不可恢复' : 'All data will be permanently deleted and cannot be recovered'}
          </p>
        </div>
        <DeleteAccountButton zh={zh} locale={locale} />
      </section>

      {/* Language */}
      <section className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{a.locale}</p>
          <p className="text-xs text-gray-400">{zh ? '当前：中文' : 'Current: English'}</p>
        </div>
        <Link
          href={`/${otherLocale}/account`}
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {a.changeLocale} → {otherLocale === 'zh' ? '中文' : 'English'}
        </Link>
      </section>

      {/* API Keys */}
      <section className="rounded-xl border border-gray-200 bg-white px-5 py-4">
        <ApiKeysPanel zh={zh} plan={plan} />
      </section>

      {/* Password change */}
      <section className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        <PasswordChangeForm zh={zh} />
      </section>

      {/* Upgrade */}
      {plan === 'free' && (
        <section className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4 space-y-2">
          <p className="text-sm font-semibold text-indigo-900">{a.upgradeTitle}</p>
          <p className="text-sm text-indigo-700">{a.upgradeNote}</p>
          <Link
            href={`/${locale}/pricing`}
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {zh ? '查看价格方案' : 'View Pricing'}
          </Link>
        </section>
      )}
    </div>
  )
}
