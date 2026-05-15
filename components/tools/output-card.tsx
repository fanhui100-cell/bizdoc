'use client'

import React, { useState } from 'react'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'

interface Props {
  toolType: 'quote' | 'invoice' | 'email'
  output: QuoteOutput | InvoiceOutput | EmailOutput
  copyLabel: string
  copiedLabel: string
  pdfLabel?: string
  genId?: string | null
}

function fmt(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`
}

function QuoteCard({ data, copyLabel, copiedLabel, pdfBtn }: { data: QuoteOutput; copyLabel: string; copiedLabel: string; pdfBtn?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(data, null, 2)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {pdfBtn}
          <button onClick={copy} className="text-sm text-indigo-600 hover:underline">
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      </div>
      {data.intro && <p className="text-sm text-gray-600">{data.intro}</p>}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium text-right">Qty</th>
            <th className="pb-2 font-medium text-right">Unit</th>
            <th className="pb-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2">
                <div className="font-medium">{item.name}</div>
                {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{fmt(item.unitPrice, data.currency)}</td>
              <td className="py-2 text-right">{fmt(item.amount, data.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-sm text-right">
        <div className="text-gray-600">Subtotal: {fmt(data.subtotal, data.currency)}</div>
        <div className="text-lg font-bold text-gray-900">Total: {fmt(data.total, data.currency)}</div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
        {data.paymentTerms && <><dt className="font-medium">Payment</dt><dd>{data.paymentTerms}</dd></>}
        {data.deliveryTerms && <><dt className="font-medium">Delivery</dt><dd>{data.deliveryTerms}</dd></>}
        {data.validUntil && <><dt className="font-medium">Valid until</dt><dd>{data.validUntil}</dd></>}
      </dl>
      {data.notes && <p className="text-sm text-gray-500 border-t border-gray-100 pt-3">{data.notes}</p>}
    </div>
  )
}

function InvoiceCard({ data, copyLabel, copiedLabel, pdfBtn }: { data: InvoiceOutput; copyLabel: string; copiedLabel: string; pdfBtn?: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const text = JSON.stringify(data, null, 2)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{data.invoiceTitle}</h2>
          <p className="text-sm text-gray-500">#{data.invoiceNumber}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pdfBtn}
          <button onClick={copy} className="text-sm text-indigo-600 hover:underline">
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
        <dt className="font-medium">From</dt><dd>{data.seller}</dd>
        <dt className="font-medium">To</dt><dd>{data.buyer}</dd>
        <dt className="font-medium">Issued</dt><dd>{data.issueDate}</dd>
        <dt className="font-medium">Due</dt><dd>{data.dueDate}</dd>
      </dl>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 font-medium text-right">Qty</th>
            <th className="pb-2 font-medium text-right">Unit</th>
            <th className="pb-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2">
                <div className="font-medium">{item.name}</div>
                {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
              </td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">{fmt(item.unitPrice, data.currency)}</td>
              <td className="py-2 text-right">{fmt(item.amount, data.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-sm text-right">
        <div className="text-gray-600">Subtotal: {fmt(data.subtotal, data.currency)}</div>
        {data.tax > 0 && <div className="text-gray-600">Tax: {fmt(data.tax, data.currency)}</div>}
        <div className="text-lg font-bold text-gray-900">Total: {fmt(data.total, data.currency)}</div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
        {data.paymentMethod && <><dt className="font-medium">Payment</dt><dd>{data.paymentMethod}</dd></>}
        {data.paymentTerms && <><dt className="font-medium">Terms</dt><dd>{data.paymentTerms}</dd></>}
      </dl>
      {data.notes && <p className="text-sm text-gray-500 border-t border-gray-100 pt-3">{data.notes}</p>}
    </div>
  )
}

function EmailCard({ data, copyLabel, copiedLabel, tabs, pdfBtn }: { data: EmailOutput; copyLabel: string; copiedLabel: string; tabs: { body: string; short: string; formal: string }; pdfBtn?: React.ReactNode }) {
  const [tab, setTab] = useState<'body' | 'short' | 'formal'>('body')
  const [copied, setCopied] = useState(false)
  const content = tab === 'body' ? data.body : tab === 'short' ? data.shortVersion : data.formalVersion
  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${data.subject}\n\n${content}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Subject</p>
          <h2 className="text-lg font-semibold text-gray-900">{data.subject}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {pdfBtn}
          <button onClick={copy} className="text-sm text-indigo-600 hover:underline">
            {copied ? copiedLabel : copyLabel}
          </button>
        </div>
      </div>
      <div className="flex gap-2 border-b border-gray-200">
        {(['body', 'short', 'formal'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tabs[t]}
          </button>
        ))}
      </div>
      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{content}</pre>
    </div>
  )
}

function PdfButton({ genId, label }: { genId: string; label: string }) {
  return (
    <a
      href={`/api/pdf/${genId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
    >
      {label}
    </a>
  )
}

export function OutputCard({ toolType, output, copyLabel, copiedLabel, pdfLabel, genId }: Props) {
  const pdfBtn = genId && pdfLabel ? <PdfButton genId={genId} label={pdfLabel} /> : null

  if (toolType === 'quote') {
    return <QuoteCard data={output as QuoteOutput} copyLabel={copyLabel} copiedLabel={copiedLabel} pdfBtn={pdfBtn} />
  }
  if (toolType === 'invoice') {
    return <InvoiceCard data={output as InvoiceOutput} copyLabel={copyLabel} copiedLabel={copiedLabel} pdfBtn={pdfBtn} />
  }
  return (
    <EmailCard
      data={output as EmailOutput}
      copyLabel={copyLabel}
      copiedLabel={copiedLabel}
      tabs={{ body: 'Full', short: 'Short', formal: 'Formal' }}
      pdfBtn={pdfBtn}
    />
  )
}
