import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminUserTable from '@/components/admin/user-table'

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  plan: string
  quota_used: number
  quota_monthly: number
  quota_reset_at: string | null
  expires_at: string | null
  created_at: string
}

interface Props {
  params: Promise<{ locale: string }>
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params
  const zh = locale === 'zh'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)
  if (!adminEmails.includes(user.email ?? '')) notFound()

  const admin = createAdminClient()
  const { data: users, error } = await admin
    .from('users_profile')
    .select('id, email, full_name, plan, quota_used, quota_monthly, quota_reset_at, expires_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return <p className="p-8 text-red-600">Failed to load users: {error.message}</p>
  }

  const stats = {
    total: users?.length ?? 0,
    pro: users?.filter((u) => u.plan === 'pro').length ?? 0,
    business: users?.filter((u) => u.plan === 'business').length ?? 0,
    totalGenerations: users?.reduce((sum, u) => sum + (u.quota_used ?? 0), 0) ?? 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{zh ? '管理后台' : 'Admin Panel'}</h1>
        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: zh ? '总用户' : 'Total Users', value: stats.total },
          { label: 'Pro', value: stats.pro },
          { label: 'Business', value: stats.business },
          { label: zh ? '总生成次数' : 'Total Generations', value: stats.totalGenerations },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* User table (client component for interactive plan editing) */}
      <AdminUserTable users={(users ?? []) as UserRow[]} zh={zh} />
    </div>
  )
}
