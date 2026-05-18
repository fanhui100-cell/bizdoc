import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { QuotePDF, InvoicePDF, EmailPDF } from '@/lib/pdf/templates'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'

// Public PDF download — no auth required. Uses admin client to bypass RLS.
// Generation IDs are random UUIDs so they are not guessable.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: gen } = await admin
    .from('generations')
    .select('tool_type, output_data, status, user_id, client_id')
    .eq('id', id)
    .single()

  if (!gen || gen.status !== 'completed' || !gen.output_data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: company } = await admin
    .from('company_profiles')
    .select('logo_url, bank_info, pdf_style')
    .eq('user_id', gen.user_id)
    .single()

  const logoUrl  = company?.logo_url ?? null
  const bankInfo = company?.bank_info ?? null
  const pdfStyle = company?.pdf_style ?? 'minimal'
  const watermark = true // Public view always watermarked

  await admin.from('document_events').insert({
    generation_id: id,
    user_id: gen.user_id,
    client_id: gen.client_id ?? null,
    event_type: 'pdf_download',
  })

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
      'Content-Disposition': `inline; filename="${gen.tool_type}-${id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
