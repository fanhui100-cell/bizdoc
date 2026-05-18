import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReceiptPDF } from '@/lib/pdf/templates'
import type { InvoiceOutput } from '@/lib/types'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const admin = createAdminClient()
  const { data: gen } = await admin
    .from('generations')
    .select('user_id, tool_type, output_data, locale, invoice_status')
    .eq('id', id)
    .single()

  if (!gen || gen.tool_type !== 'invoice' || gen.invoice_status !== 'paid' || !gen.output_data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Auth: must be owner
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== gen.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = gen.output_data as unknown as InvoiceOutput
  const paymentDate = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  const element = React.createElement(ReceiptPDF, { data, paymentDate })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${data.invoiceNumber}.pdf"`,
    },
  })
}
