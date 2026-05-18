import type { EmailOutput, InvoiceOutput, LineItem, QuoteOutput } from '@/lib/types'
import type { ToolType } from './prompts'

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function number(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function normalizeItems(value: unknown): LineItem[] {
  if (!Array.isArray(value)) return []

  return value
    .slice(0, 50)
    .map((item) => {
      const row = item as Record<string, unknown>
      const quantity = Math.max(0, number(row.quantity, 1))
      const unitPrice = Math.max(0, number(row.unitPrice, 0))
      const amount = Math.max(0, number(row.amount, quantity * unitPrice))

      return {
        name: text(row.name, 'Item').slice(0, 200),
        description: text(row.description).slice(0, 500),
        quantity,
        unitPrice,
        amount,
      }
    })
    .filter((item) => item.name.trim())
}

function totals(items: LineItem[]) {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

export function validateOutput(toolType: ToolType, raw: unknown): QuoteOutput | InvoiceOutput | EmailOutput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('AI returned an invalid JSON object')
  }

  const data = raw as Record<string, unknown>

  if (toolType === 'quote') {
    const items = normalizeItems(data.items)
    if (!items.length) throw new Error('AI returned no quote items')
    const subtotal = number(data.subtotal, totals(items))
    const total = number(data.total, subtotal)

    return {
      title: text(data.title, 'Quotation'),
      intro: text(data.intro),
      items,
      subtotal,
      total,
      currency: text(data.currency, 'USD').slice(0, 10),
      paymentTerms: text(data.paymentTerms),
      deliveryTerms: text(data.deliveryTerms),
      validUntil: text(data.validUntil),
      notes: text(data.notes),
    }
  }

  if (toolType === 'invoice') {
    const items = normalizeItems(data.items)
    if (!items.length) throw new Error('AI returned no invoice items')
    const subtotal = number(data.subtotal, totals(items))
    const tax = number(data.tax, 0)
    const total = number(data.total, subtotal + tax)

    return {
      invoiceTitle: text(data.invoiceTitle, 'Invoice'),
      invoiceNumber: text(data.invoiceNumber),
      seller: text(data.seller),
      buyer: text(data.buyer),
      issueDate: text(data.issueDate),
      dueDate: text(data.dueDate),
      items,
      subtotal,
      tax,
      total,
      currency: text(data.currency, 'USD').slice(0, 10),
      paymentMethod: text(data.paymentMethod),
      paymentTerms: text(data.paymentTerms),
      notes: text(data.notes),
    }
  }

  return {
    subject: text(data.subject, 'Business Email'),
    body: text(data.body),
    shortVersion: text(data.shortVersion),
    formalVersion: text(data.formalVersion),
  }
}
