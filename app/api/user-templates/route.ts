import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  let query = supabase
    .from('user_templates')
    .select('id, tool_type, name, input_data, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (type) query = query.eq('tool_type', type)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { tool_type, name, input_data } = body

  if (!tool_type || !name?.trim()) {
    return NextResponse.json({ error: 'tool_type and name required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_templates')
    .insert({ user_id: user.id, tool_type, name: name.trim().slice(0, 100), input_data })
    .select('id, tool_type, name, input_data, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  return NextResponse.json({ template: data }, { status: 201 })
}
