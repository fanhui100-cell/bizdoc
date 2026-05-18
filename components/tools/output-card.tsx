'use client'

import React, { useState } from 'react'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'
import { SendToClientButton } from './send-to-client-modal'
import { SaveTemplateButton } from '@/components/ui/save-template-button'

interface Props {
  toolType: 'quote' | 'invoice' | 'email'
  output: QuoteOutput | InvoiceOutput | EmailOutput
  copyLabel: string
  copiedLabel: string
  pdfLabel?: string
  genId?: string | null
  zh?: boolean
  inputData?: Record<string, unknown>
  defaultRecipient?: string
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
    ? `${currency} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)}`
    : `${currency} ${n.toFixed(2)}`
}

function HeaderActions({ pdfBtn, shareBtn, sendBtn, saveBtn }: { pdfBtn?: React.ReactNode; shareBtn?: React.ReactNode; sendBtn?: React.ReactNode; saveBtn?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {saveBtn}{sendBtn}{shareBtn}{pdfBtn}
    </div>
  )
}

function PdfButton({ genId, label }: { genId: string; label: string }) {
  return (
    <a href={`/api/pdf/${genId}`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20 transition-colors">
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
      </svg>
      {label}
    </a>
  )
}

function ShareButton({ genId, zh }: { genId: string; zh?: boolean }) {
  const [copied, setCopied] = useState(false)
  const share = () => {
    navigator.clipboard.writeText(`${window.location.origin}/view/${genId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={share}
      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 transition-colors">
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
      </svg>
      {copied ? (zh ? '已复制' : 'Copied!') : (zh ? '分享' : 'Share')}
    </button>
  )
}

function CopyTextButton({ text, copyLabel, copiedLabel }: { text: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
      {copied ? copiedLabel : copyLabel}
    </button>
  )
}

function QuoteCard({ data, copyLabel, copiedLabel, pdfBtn, shareBtn, sendBtn, saveBtn, zh }: {
  data: QuoteOutput; copyLabel: string; copiedLabel: string; zh?: boolean
} & { pdfBtn?: React.ReactNode; shareBtn?: React.ReactNode; sendBtn?: React.ReactNode; saveBtn?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">{zh ? '报价单' : 'Quotation'}</p>
            <h2 className="mt-1 text-xl font-bold text-white truncate">{data.title}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-200">
              {data.validUntil && <span>{zh ? '有效期至' : 'Valid until'} {data.validUntil}</span>}
              {data.currency && <span>{data.currency}</span>}
            </div>
          </div>
          <HeaderActions pdfBtn={pdfBtn} shareBtn={shareBtn} sendBtn={sendBtn} saveBtn={saveBtn} />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {data.intro && (
          <p className="text-sm text-gray-600 leading-relaxed border-l-2 border-indigo-200 pl-3">{data.intro}</p>
        )}

        {/* Items table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5">{zh ? '项目' : 'Item'}</th>
                <th className="text-right px-4 py-2.5">{zh ? '数量' : 'Qty'}</th>
                <th className="text-right px-4 py-2.5">{zh ? '单价' : 'Unit Price'}</th>
                <th className="text-right px-4 py-2.5">{zh ? '金额' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{fmt(item.unitPrice, data.currency)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">{fmt(item.amount, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="rounded-xl bg-slate-900 px-5 py-4">
          <div className="flex items-center justify-between text-sm text-slate-400 mb-1">
            <span>{zh ? '小计' : 'Subtotal'}</span>
            <span className="tabular-nums">{fmt(data.subtotal, data.currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">{zh ? '总计' : 'Total'}</span>
            <span className="text-xl font-bold text-white tabular-nums">{fmt(data.total, data.currency)}</span>
          </div>
        </div>

        {/* Terms */}
        {(data.paymentTerms || data.deliveryTerms) && (
          <div className="rounded-xl bg-gray-50 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {data.paymentTerms && (
              <><span className="font-medium text-gray-700">{zh ? '付款方式' : 'Payment'}</span>
              <span className="text-gray-600">{data.paymentTerms}</span></>
            )}
            {data.deliveryTerms && (
              <><span className="font-medium text-gray-700">{zh ? '交货条款' : 'Delivery'}</span>
              <span className="text-gray-600">{data.deliveryTerms}</span></>
            )}
          </div>
        )}

        {data.notes && (
          <p className="text-sm text-gray-500 border-t border-gray-100 pt-4 leading-relaxed">{data.notes}</p>
        )}

        <div className="flex justify-end pt-1 border-t border-gray-100">
          <CopyTextButton text={JSON.stringify(data, null, 2)} copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </div>
      </div>
    </div>
  )
}

function InvoiceCard({ data, copyLabel, copiedLabel, pdfBtn, shareBtn, sendBtn, saveBtn, zh }: {
  data: InvoiceOutput; copyLabel: string; copiedLabel: string; zh?: boolean
} & { pdfBtn?: React.ReactNode; shareBtn?: React.ReactNode; sendBtn?: React.ReactNode; saveBtn?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">{zh ? '发票' : 'Invoice'}</p>
            <h2 className="mt-1 text-xl font-bold text-white">{data.invoiceTitle}</h2>
            <p className="text-sm text-indigo-300 mt-0.5">#{data.invoiceNumber}</p>
          </div>
          <HeaderActions pdfBtn={pdfBtn} shareBtn={shareBtn} sendBtn={sendBtn} saveBtn={saveBtn} />
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* From / To / Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{zh ? '卖方' : 'From'}</p>
            <p className="text-sm font-medium text-gray-900">{data.seller}</p>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{zh ? '买方' : 'To'}</p>
            <p className="text-sm font-medium text-gray-900">{data.buyer}</p>
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{zh ? '开票日期' : 'Issue Date'}</p>
            <p className="text-sm font-medium text-gray-900">{data.issueDate}</p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide">{zh ? '到期日期' : 'Due Date'}</p>
            <p className="text-sm font-medium text-amber-900">{data.dueDate}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5">{zh ? '项目' : 'Item'}</th>
                <th className="text-right px-4 py-2.5">{zh ? '数量' : 'Qty'}</th>
                <th className="text-right px-4 py-2.5">{zh ? '单价' : 'Unit Price'}</th>
                <th className="text-right px-4 py-2.5">{zh ? '金额' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    {item.description && <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-600 tabular-nums">{fmt(item.unitPrice, data.currency)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">{fmt(item.amount, data.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="rounded-xl bg-slate-900 px-5 py-4 space-y-1.5">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>{zh ? '小计' : 'Subtotal'}</span>
            <span className="tabular-nums">{fmt(data.subtotal, data.currency)}</span>
          </div>
          {data.tax > 0 && (
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>{zh ? '税额' : 'Tax'}</span>
              <span className="tabular-nums">{fmt(data.tax, data.currency)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-slate-700 pt-1.5">
            <span className="font-semibold text-white">{zh ? '总计' : 'Total'}</span>
            <span className="text-xl font-bold text-white tabular-nums">{fmt(data.total, data.currency)}</span>
          </div>
        </div>

        {/* Payment */}
        {(data.paymentMethod || data.paymentTerms) && (
          <div className="rounded-xl bg-gray-50 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {data.paymentMethod && (
              <><span className="font-medium text-gray-700">{zh ? '付款方式' : 'Payment'}</span>
              <span className="text-gray-600">{data.paymentMethod}</span></>
            )}
            {data.paymentTerms && (
              <><span className="font-medium text-gray-700">{zh ? '付款条款' : 'Terms'}</span>
              <span className="text-gray-600">{data.paymentTerms}</span></>
            )}
          </div>
        )}

        {data.notes && (
          <p className="text-sm text-gray-500 border-t border-gray-100 pt-4 leading-relaxed">{data.notes}</p>
        )}

        <div className="flex justify-end pt-1 border-t border-gray-100">
          <CopyTextButton text={JSON.stringify(data, null, 2)} copyLabel={copyLabel} copiedLabel={copiedLabel} />
        </div>
      </div>
    </div>
  )
}

function EmailCard({ data, copyLabel, copiedLabel, pdfBtn, shareBtn, sendBtn, saveBtn, zh }: {
  data: EmailOutput; copyLabel: string; copiedLabel: string; zh?: boolean
} & { pdfBtn?: React.ReactNode; shareBtn?: React.ReactNode; sendBtn?: React.ReactNode; saveBtn?: React.ReactNode }) {
  const [tab, setTab] = useState<'body' | 'short' | 'formal'>('body')
  const content = tab === 'body' ? data.body : tab === 'short' ? data.shortVersion : data.formalVersion
  const tabs = [
    { key: 'body' as const, label: zh ? '完整版' : 'Full' },
    { key: 'short' as const, label: zh ? '简短版' : 'Short' },
    { key: 'formal' as const, label: zh ? '正式版' : 'Formal' },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">{zh ? '商务邮件' : 'Business Email'}</p>
            <h2 className="mt-1 text-lg font-bold text-white leading-snug">{data.subject}</h2>
          </div>
          <HeaderActions pdfBtn={pdfBtn} shareBtn={shareBtn} sendBtn={sendBtn} saveBtn={saveBtn} />
        </div>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                tab === key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Email body */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">{content}</pre>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {zh ? '可直接复制使用' : 'Ready to copy and send'}
          </span>
          <CopyTextButton
            text={`Subject: ${data.subject}\n\n${content}`}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
          />
        </div>
      </div>
    </div>
  )
}

export function OutputCard({ toolType, output, copyLabel, copiedLabel, pdfLabel, genId, zh = false, inputData, defaultRecipient = '' }: Props) {
  const pdfBtn     = genId && pdfLabel ? <PdfButton genId={genId} label={pdfLabel} /> : undefined
  const shareBtn   = genId ? <ShareButton genId={genId} zh={zh} /> : undefined
  const sendBtn    = genId ? <SendToClientButton genId={genId} zh={zh} defaultRecipient={defaultRecipient} /> : undefined
  const saveBtn    = inputData ? <SaveTemplateButton toolType={toolType} inputData={inputData} zh={zh} /> : undefined

  if (toolType === 'quote') {
    return <QuoteCard data={output as QuoteOutput} copyLabel={copyLabel} copiedLabel={copiedLabel} pdfBtn={pdfBtn} shareBtn={shareBtn} sendBtn={sendBtn} saveBtn={saveBtn} zh={zh} />
  }
  if (toolType === 'invoice') {
    return <InvoiceCard data={output as InvoiceOutput} copyLabel={copyLabel} copiedLabel={copiedLabel} pdfBtn={pdfBtn} shareBtn={shareBtn} sendBtn={sendBtn} saveBtn={saveBtn} zh={zh} />
  }
  return (
    <EmailCard
      data={output as EmailOutput}
      copyLabel={copyLabel}
      copiedLabel={copiedLabel}
      pdfBtn={pdfBtn}
      shareBtn={shareBtn}
      sendBtn={sendBtn}
      saveBtn={saveBtn}
      zh={zh}
    />
  )
}
