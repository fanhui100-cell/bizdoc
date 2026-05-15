import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails.includes(user.email ?? '')) return null
  return user
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users_profile')
    .select('id, email, full_name, plan, quota_used, quota_monthly, quota_reset_at, expires_at, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })

  return NextResponse.json({ users: data })
}
