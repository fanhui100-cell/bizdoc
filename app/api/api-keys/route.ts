import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return 'biz_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// GET  — list keys for current user (masked)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, created_at, last_used_at, revoked')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ keys: keys ?? [] })
}

// POST — create a new key (Business plan only)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users_profile')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'business') {
    return NextResponse.json({ error: 'API access requires the Business plan.' }, { status: 403 })
  }

  const { name } = await req.json() as { name?: string }
  const key = generateKey()

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: user.id,
      name: name || 'Default',
      key_hash: await hashKey(key),
      key_prefix: key.slice(0, 12),
    })
    .select('id, name, key_prefix, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create key' }, { status: 500 })

  // Return the full key ONCE — it cannot be retrieved again
  return NextResponse.json({ ...data, key })
}

// DELETE — revoke a key
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id: string }
  await supabase.from('api_keys').update({ revoked: true }).eq('id', id).eq('user_id', user.id)
  return NextResponse.json({ ok: true })
}

async function hashKey(key: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
