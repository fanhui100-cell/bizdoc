import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !adminEmails.includes(user.email ?? '')) return null
  return user
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as {
    plan?: string
    quota_monthly?: number
    expires_at?: string | null
  }

  const admin = createAdminClient()

  const { data: before } = await admin
    .from('users_profile')
    .select('plan, quota_monthly, expires_at')
    .eq('id', id)
    .single()

  const updates: Record<string, unknown> = {}
  if (body.plan !== undefined)          updates.plan = body.plan
  if (body.quota_monthly !== undefined) updates.quota_monthly = body.quota_monthly
  if ('expires_at' in body)             updates.expires_at = body.expires_at ?? null

  const { data: after, error } = await admin
    .from('users_profile')
    .update(updates)
    .eq('id', id)
    .select('plan, quota_monthly, expires_at')
    .single()

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  await admin.from('admin_logs').insert({
    admin_user_id: adminUser.id,
    target_user_id: id,
    action: 'update_profile',
    before_data: before,
    after_data: after,
  })

  return NextResponse.json({ ok: true, after })
}
