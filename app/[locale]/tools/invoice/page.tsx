'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { OutputCard } from '@/components/tools/output-card'
import { ClientSuggestInput } from '@/components/ui/client-suggest-input'
import { FileExtractButton } from '@/components/ui/file-extract-button'
import { TemplatePicker } from '@/components/ui/template-picker'
import type { InvoiceOutput } from '@/lib/types'

interface LineItem {
  name: string
  description: string
  quantity: number
  unitPrice: number
}

interface SelectedClient {
  id: string
  email: string | null
}

function emptyItem(): LineItem {
  return { name: '', description: '', quantity: 1, unitPrice: 0 }
}

const today = () => new Date().toISOString().slice(0, 10)
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

export default function InvoicePage() {
  const params = useParams()
  const locale = (params.locale as string) ?? 'zh'
  const router = useRouter()
  const searchParams = useSearchParams()
  const zh = locale === 'zh'

  const [outputLang, setOutputLang] = useState<'zh' | 'en'>(zh ? 'zh' : 'en')
  const [sellerName, setSellerName] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [selectedClient, setSelectedClient] = useState<SelectedClient | null>(null)
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [issueDate, setIssueDate] = useState(today())
  const [dueDate, setDueDate] = useState(inDays(30))
  const [taxRate, setTaxRate] = useState(0)
  const [currency, setCurrency] = useState('USD')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [textMode, setTextMode] = useState(false)
  const [itemsText, setItemsText] = useState('')

  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<InvoiceOutput | null>(null)
  const [genId, setGenId] = useState<string | null>(null)
  const [lastInput, setLastInput] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/company-profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return
        if (profile.company_name) setSellerName(profile.company_name)
        if (profile.currency) setCurrency(profile.currency)
        if (profile.payment_terms) setPaymentMethod(profile.payment_terms)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const fromId = searchParams.get('from')
    if (!fromId) return
    fetch(`/api/generations/${fromId}`)
      .then((r) => r.json())
      .then(({ generation }) => {
        if (!generation || generation.tool_type !== 'invoice') return
        const d = generation.input_data as Record<string, unknown>
        if (d.sellerName)    setSellerName(d.sellerName as string)
        if (d.buyerName)     setBuyerName(d.buyerName as string)
        if (d.currency)      setCurrency(d.currency as string)
        if (d.taxRate)       setTaxRate(Number(d.taxRate))
        if (d.paymentMethod) setPaymentMethod(d.paymentMethod as string)
        if (d.notes)         setNotes(d.notes as string)
        if (d.itemsText)     { setItemsText(d.itemsText as string); setTextMode(true) }
        else if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items as LineItem[])
        if (d.outputLanguage) setOutputLang(d.outputLanguage as 'zh' | 'en')
        if (generation.client_id) setSelectedClient({ id: generation.client_id as string, email: null })
      })
      .catch(() => {})
  }, [searchParams])

  // Pre-fill from a quote generation (?fromQuote=<id>) — maps quote fields → invoice fields
  useEffect(() => {
    const fromQuoteId = searchParams.get('fromQuote')
    if (!fromQuoteId) return
    fetch(`/api/generations/${fromQuoteId}`)
      .then((r) => r.json())
      .then(({ generation }) => {
        if (!generation || generation.tool_type !== 'quote') return
        const d = generation.input_data as Record<string, unknown>
        if (d.companyName)   setSellerName(d.companyName as string)
        if (d.clientName)    setBuyerName(d.clientName as string)
        if (d.currency)      setCurrency(d.currency as string)
        if (d.notes)         setNotes(d.notes as string)
        if (d.itemsText)     { setItemsText(d.itemsText as string); setTextMode(true) }
        else if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items as LineItem[])
        if (d.outputLanguage) setOutputLang(d.outputLanguage as 'zh' | 'en')
        if (generation.client_id) setSelectedClient({ id: generation.client_id as string, email: null })
      })
      .catch(() => {})
  }, [searchParams])

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))
  }

  const applyExtracted = (data: Record<string, unknown>) => {
    if (data.sellerName)    setSellerName(data.sellerName as string)
    if (data.buyerName)     setBuyerName(data.buyerName as string)
    if (data.invoiceNumber) setInvoiceNumber(data.invoiceNumber as string)
    if (data.currency)      setCurrency(data.currency as string)
    if (data.paymentMethod) setPaymentMethod(data.paymentMethod as string)
    if (data.paymentTerms)  setPaymentMethod(data.paymentTerms as string)
    if (data.notes)         setNotes(data.notes as string)
    if (Array.isArray(data.items) && data.items.length > 0) {
      setTextMode(false)
      setItems((data.items as Record<string, unknown>[]).map((it) => ({
        name:        String(it.name ?? ''),
        description: String(it.description ?? ''),
        quantity:    Number(it.quantity ?? 1),
        unitPrice:   Number(it.unitPrice ?? 0),
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOutput(null)

    const input = {
      sellerName,
      buyerName,
      invoiceNumber,
      issueDate,
      dueDate,
      items: textMode ? [] : items,
      itemsText: textMode ? itemsText : undefined,
      taxRate,
      currency,
      paymentMethod,
      notes,
      outputLanguage: outputLang,
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolType: 'invoice',
          input,
          ...(selectedClient ? { clientId: selectedClient.id } : {}),
        }),
      })

      if (res.status === 401) { router.push(`/${locale}/login`); return }

      const data = await res.json()

      if (!res.ok) {
        setError(data.error === 'quota_exceeded'
          ? (zh ? '本月生成次数已用完，请升级会员继续使用' : 'Monthly quota exceeded. Please upgrade.')
          : (zh ? '生成失败，请重试' : 'Generation failed. Please try again.'))
        return
      }

      setOutput(data.output as InvoiceOutput)
      setGenId(data.id ?? null)
      setLastInput(input as Record<string, unknown>)
      window.dispatchEvent(new CustomEvent('quotaUpdated'))
    } catch {
      setError(zh ? '网络错误，请重试' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{zh ? 'Invoice 生成器' : 'Invoice Generator'}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {zh ? '快速生成专业 Invoice，支持含税计算' : 'Generate a professional invoice with optional tax calculation.'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <TemplatePicker toolType="invoice" onLoad={applyExtracted} zh={zh} />
            <FileExtractButton toolType="invoice" onExtracted={applyExtracted} zh={zh} />
          </div>
          <a
            href="/api/templates/invoice"
            download
            className="text-xs text-gray-400 hover:text-indigo-600 hover:underline"
          >
            {zh ? '下载空白模板' : 'Blank template'}
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Output language */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{zh ? '输出语言' : 'Output language'}</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['zh', 'en'] as const).map((l) => (
              <button key={l} type="button" onClick={() => setOutputLang(l)}
                className={`px-3 py-1.5 transition-colors ${outputLang === l ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {l === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '卖方名称' : 'Seller'}</label>
            <input value={sellerName} onChange={(e) => setSellerName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <ClientSuggestInput
            value={buyerName}
            onChange={(value) => {
              setBuyerName(value)
              setSelectedClient(null)
            }}
            onClientSelected={(client) => setSelectedClient(client ? { id: client.id, email: client.email } : null)}
            label={zh ? '买方名称' : 'Buyer / Client Name'}
            placeholder={zh ? '输入或从客户列表中选择' : 'Type or select from client book'}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? 'Invoice 编号' : 'Invoice #'}</label>
            <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '币种' : 'Currency'}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {['CNY', 'USD', 'EUR', 'GBP', 'HKD'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '开票日期' : 'Issue Date'}</label>
            <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '到期日期' : 'Due Date'}</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '税率（%，填 0 表示免税）' : 'Tax Rate (%)'}</label>
            <input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '付款方式' : 'Payment Method'}</label>
            <input value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder={zh ? '如：银行转账、PayPal' : 'e.g. Bank transfer, PayPal'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '备注' : 'Notes'}</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{zh ? '商品 / 服务' : 'Line Items'}</span>
            <button type="button" onClick={() => setTextMode((v) => !v)} className="text-xs text-indigo-600 hover:underline">
              {textMode ? (zh ? '切换为手动输入模式' : 'Switch to rows') : (zh ? '切换为文字描述模式' : 'Switch to text')}
            </button>
          </div>
          {textMode ? (
            <textarea value={itemsText} onChange={(e) => setItemsText(e.target.value)} rows={3}
              placeholder={zh ? '用文字描述商品或服务' : 'Describe items in plain text'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <span className="col-span-4">{zh ? '名称' : 'Name'}</span>
                <span className="col-span-3">{zh ? '描述' : 'Desc'}</span>
                <span className="col-span-2 text-right">{zh ? '数量' : 'Qty'}</span>
                <span className="col-span-2 text-right">{zh ? '单价' : 'Unit'}</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} required placeholder={zh ? '名称' : 'Name'}
                    className="col-span-4 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder={zh ? '描述' : 'Desc'}
                    className="col-span-3 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                    className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                    className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={items.length === 1} className="col-span-1 text-gray-400 hover:text-red-500 disabled:opacity-30 text-lg text-center">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="text-sm text-indigo-600 hover:underline">{zh ? '+ 添加项目' : '+ Add item'}</button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {loading ? (zh ? 'AI 生成中，请稍候...' : 'Generating…') : (zh ? '生成 Invoice' : 'Generate Invoice')}
        </button>
      </form>

      {output && (
        <OutputCard toolType="invoice" output={output}
          copyLabel={zh ? '复制' : 'Copy'} copiedLabel={zh ? '已复制！' : 'Copied!'}
          pdfLabel={zh ? '导出 PDF' : 'Export PDF'} genId={genId}
          zh={zh} inputData={lastInput ?? undefined} defaultRecipient={selectedClient?.email ?? ''} />
      )}
    </div>
  )
}
