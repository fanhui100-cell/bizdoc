import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { QuotePDF, InvoicePDF, EmailPDF } from '@/lib/pdf/templates'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: gen } = await supabase
    .from('generations')
    .select('tool_type, output_data, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!gen || gen.status !== 'completed' || !gen.output_data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const [{ data: profile }, { data: company }] = await Promise.all([
    supabase.from('users_profile').select('plan').eq('id', user.id).single(),
    supabase.from('company_profiles').select('logo_url, bank_info, pdf_style').eq('user_id', user.id).single(),
  ])

  const watermark = !profile?.plan || profile.plan === 'free'
  const logoUrl   = company?.logo_url  ?? null
  const bankInfo  = company?.bank_info  ?? null
  const pdfStyle  = company?.pdf_style  ?? 'minimal'

  let element: React.ReactElement
  if (gen.tool_type === 'quote') {
    element = React.createElement(QuotePDF, { data: gen.output_data as QuoteOutput, watermark, logoUrl, pdfStyle })
  } else if (gen.tool_type === 'invoice') {
    element = React.createElement(InvoicePDF, { data: gen.output_data as InvoiceOutput, watermark, logoUrl, bankInfo, pdfStyle })
  } else {
    element = React.createElement(EmailPDF, { data: gen.output_data as EmailOutput, watermark })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${gen.tool_type}-${id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
