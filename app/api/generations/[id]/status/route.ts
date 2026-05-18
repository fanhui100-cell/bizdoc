import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/generations/[id]/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoiceStatus } = await req.json() as { invoiceStatus: string }
  const allowed = ['pending', 'reminded', 'paid', 'overdue', 'cancelled']
  if (!allowed.includes(invoiceStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const { error } = await supabase
    .from('generations')
    .update({ invoice_status: invoiceStatus })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('tool_type', 'invoice')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
