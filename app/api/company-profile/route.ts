import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ profile: data ?? null })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('company_profiles')
    .upsert(
      {
        user_id: user.id,
        company_name:  (body.company_name  ?? '').slice(0, 200),
        contact_name:  (body.contact_name  ?? '').slice(0, 200),
        email:         (body.email         ?? '').slice(0, 200),
        phone:         (body.phone         ?? '').slice(0, 50),
        address:       (body.address       ?? '').slice(0, 500),
        payment_terms: (body.payment_terms ?? '').slice(0, 200),
        bank_info:     (body.bank_info     ?? '').slice(0, 2000),
        pdf_style:     ['minimal', 'business', 'colorful'].includes(body.pdf_style)
          ? body.pdf_style
          : 'minimal',
        currency:      (body.currency      || 'USD').slice(0, 10),
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 })

  return NextResponse.json({ profile: data })
}
