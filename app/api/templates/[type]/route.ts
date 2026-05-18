import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { QuotePDF, InvoicePDF } from '@/lib/pdf/templates'
import type { QuoteOutput, InvoiceOutput } from '@/lib/types'

const BLANK_QUOTE: QuoteOutput = {
  title: 'Quotation / 报价单',
  intro: '',
  items: [
    { name: 'Item / 项目名称', description: 'Description / 描述', quantity: 1, unitPrice: 0, amount: 0 },
  ],
  subtotal: 0,
  total: 0,
  currency: 'USD',
  paymentTerms: 'Net 30',
  deliveryTerms: '',
  validUntil: '',
  notes: '',
}

const BLANK_INVOICE: InvoiceOutput = {
  invoiceTitle: 'Invoice / 账单',
  invoiceNumber: 'INV-000001',
  seller: 'Your Company / 卖方名称',
  buyer: 'Client Name / 买方名称',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  items: [
    { name: 'Item / 项目名称', description: 'Description / 描述', quantity: 1, unitPrice: 0, amount: 0 },
  ],
  subtotal: 0,
  tax: 0,
  total: 0,
  currency: 'USD',
  paymentMethod: 'Bank Transfer / 银行转账',
  paymentTerms: 'Net 30',
  notes: '',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params

  let element: React.ReactElement
  if (type === 'quote') {
    element = React.createElement(QuotePDF, { data: BLANK_QUOTE, watermark: false })
  } else if (type === 'invoice') {
    element = React.createElement(InvoicePDF, { data: BLANK_INVOICE, watermark: false })
  } else {
    return NextResponse.json({ error: 'Unknown template type' }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${type}-template.pdf"`,
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
