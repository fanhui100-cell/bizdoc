'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { OutputCard } from '@/components/tools/output-card'
import type { QuoteOutput } from '@/lib/types'

interface LineItem {
  name: string
  description: string
  quantity: number
  unitPrice: number
}

const CURRENCIES = ['CNY', 'USD', 'EUR', 'GBP', 'HKD']

function emptyItem(): LineItem {
  return { name: '', description: '', quantity: 1, unitPrice: 0 }
}

export default function QuotePage() {
  const params = useParams()
  const locale = (params.locale as string) ?? 'zh'
  const router = useRouter()

  const [outputLang, setOutputLang] = useState<'zh' | 'en'>(locale === 'zh' ? 'zh' : 'en')
  const [companyName, setCompanyName] = useState('')
  const [clientName, setClientName] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([emptyItem()])
  const [textMode, setTextMode] = useState(false)
  const [itemsText, setItemsText] = useState('')

  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<QuoteOutput | null>(null)
  const [genId, setGenId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const zh = locale === 'zh'

  useEffect(() => {
    fetch('/api/company-profile')
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return
        if (profile.company_name) setCompanyName(profile.company_name)
        if (profile.currency) setCurrency(profile.currency)
      })
      .catch(() => {})
  }, [])

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOutput(null)

    const input = {
      companyName,
      clientName,
      items: textMode ? [] : items,
      itemsText: textMode ? itemsText : undefined,
      currency,
      deliveryTime,
      validUntil,
      notes,
      outputLanguage: outputLang,
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolType: 'quote', input }),
      })

      if (res.status === 401) {
        router.push(`/${locale}/login`)
        return
      }

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'quota_exceeded') {
          setError(zh ? '本月生成次数已用完，请升级会员继续使用' : 'Monthly quota exceeded. Please upgrade to continue.')
        } else {
          setError(zh ? '生成失败，请重试' : 'Generation failed. Please try again.')
        }
        return
      }

      setOutput(data.output as QuoteOutput)
      setGenId(data.id ?? null)
    } catch {
      setError(zh ? '网络错误，请重试' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{zh ? '报价单生成器' : 'Quote Generator'}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {zh ? '输入基础信息，AI 自动生成专业报价单' : 'Fill in the details and let AI generate a professional quote.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Output language toggle */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">{zh ? '输出语言' : 'Output language'}</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
            {(['zh', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setOutputLang(l)}
                className={`px-3 py-1.5 transition-colors ${outputLang === l ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                {l === 'zh' ? '中文' : 'English'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '你的公司名称' : 'Your Company'}</label>
            <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '客户名称' : 'Client Name'}</label>
            <input value={clientName} onChange={(e) => setClientName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '币种' : 'Currency'}</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '交付时间' : 'Delivery Time'}</label>
            <input value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder={zh ? '如：下单后 7 个工作日' : 'e.g. 7 business days'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '报价有效期至' : 'Valid Until'}</label>
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{zh ? '备注' : 'Notes'}</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Items section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">{zh ? '商品 / 服务' : 'Items'}</span>
            <button type="button" onClick={() => setTextMode((v) => !v)}
              className="text-xs text-indigo-600 hover:underline">
              {textMode ? (zh ? '切换为手动输入模式' : 'Switch to row mode') : (zh ? '切换为文字描述模式' : 'Switch to text mode')}
            </button>
          </div>

          {textMode ? (
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              rows={3}
              placeholder={zh ? '用文字描述你的商品或服务，例如：办公桌 3 张，¥500/张；椅子 6 把，¥200/把' : 'Describe your items in plain text, e.g. 3 desks at $200 each; 6 chairs at $80 each'}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="space-y-2">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                <span className="col-span-4">{zh ? '名称' : 'Name'}</span>
                <span className="col-span-3">{zh ? '描述（可选）' : 'Description'}</span>
                <span className="col-span-2 text-right">{zh ? '数量' : 'Qty'}</span>
                <span className="col-span-2 text-right">{zh ? '单价' : 'Unit Price'}</span>
                <span className="col-span-1" />
              </div>
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} required
                    placeholder={zh ? '名称' : 'Name'}
                    className="col-span-4 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder={zh ? '描述' : 'Desc'}
                    className="col-span-3 rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                    className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))}
                    className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                    disabled={items.length === 1}
                    className="col-span-1 text-gray-400 hover:text-red-500 disabled:opacity-30 text-lg leading-none text-center">
                    ×
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => setItems((prev) => [...prev, emptyItem()])}
                className="text-sm text-indigo-600 hover:underline">
                {zh ? '+ 添加项目' : '+ Add item'}
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {loading ? (zh ? 'AI 生成中，请稍候...' : 'Generating…') : (zh ? '生成报价单' : 'Generate Quote')}
        </button>
      </form>

      {output && (
        <OutputCard
          toolType="quote"
          output={output}
          copyLabel={zh ? '复制' : 'Copy'}
          copiedLabel={zh ? '已复制！' : 'Copied!'}
          pdfLabel={zh ? '导出 PDF' : 'Export PDF'}
          genId={genId}
        />
      )}
    </div>
  )
}
