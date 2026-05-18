import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, company, phone, notes, portal_token, portal_expires_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })

  return NextResponse.json({ clients: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const name = (body.name ?? '').trim().slice(0, 200)
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name,
      email:   (body.email   ?? '').slice(0, 200),
      company: (body.company ?? '').slice(0, 200),
      phone:   (body.phone   ?? '').slice(0, 50),
      notes:   (body.notes   ?? '').slice(0, 1000),
    })
    .select('id, name, email, company, phone, notes, portal_token, portal_expires_at, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })

  return NextResponse.json({ client: data }, { status: 201 })
}
