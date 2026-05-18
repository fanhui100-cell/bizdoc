'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { InvoiceStatusBadge } from './invoice-status-badge'
import type { Generation } from '@/lib/types'

const TYPE_ICONS: Record<string, string> = { quote: '📄', invoice: '🧾', email: '✉️' }
const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
  quote:   { zh: '报价单', en: 'Quote' },
  invoice: { zh: 'Invoice', en: 'Invoice' },
  email:   { zh: '商务邮件', en: 'Email' },
}

function getTitle(gen: Generation): string {
  const o = gen.output_data as Record<string, string> | null
  if (gen.tool_type === 'quote')   return o?.title ?? 'Quote'
  if (gen.tool_type === 'invoice') return o?.invoiceTitle ?? `Invoice ${o?.invoiceNumber ?? ''}`
  return o?.subject ?? 'Email'
}

function getSummary(gen: Generation, zh: boolean): string {
  const d = gen.input_data as Record<string, unknown>
  if (!d) return ''
  if (gen.tool_type === 'quote') {
    const parts: string[] = []
    if (d.clientName)  parts.push(zh ? `客户: ${d.clientName}` : `Client: ${d.clientName}`)
    if (d.currency)    parts.push(d.currency as string)
    return parts.join(' · ')
  }
  if (gen.tool_type === 'invoice') {
    const parts: string[] = []
    if (d.buyerName)     parts.push(zh ? `买方: ${d.buyerName}` : `Buyer: ${d.buyerName}`)
    if (d.invoiceNumber) parts.push(`#${d.invoiceNumber}`)
    return parts.join(' · ')
  }
  if (gen.tool_type === 'email' && d.emailType) {
    return zh ? `类型: ${d.emailType}` : `Type: ${d.emailType}`
  }
  return ''
}

interface VersionGroup {
  root: Generation
  versions: Generation[]  // root first, children after (sorted by created_at asc)
}

function buildVersionGroups(gens: Generation[]): Array<VersionGroup | Generation> {
  const byId = new Map(gens.map((g) => [g.id, g]))
  const children = new Map<string, Generation[]>()

  for (const g of gens) {
    if (g.parent_id && byId.has(g.parent_id)) {
      const list = children.get(g.parent_id) ?? []
      list.push(g)
      children.set(g.parent_id, list)
    }
  }

  const result: Array<VersionGroup | Generation> = []
  const consumed = new Set<string>()

  for (const g of gens) {
    if (consumed.has(g.id)) continue
    // Only roots of quote version trees get grouped
    if (g.tool_type === 'quote' && !g.parent_id && children.has(g.id)) {
      const revisions = children.get(g.id)!.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      revisions.forEach((r) => consumed.add(r.id))
      consumed.add(g.id)
      result.push({ root: g, versions: [g, ...revisions] })
    } else if (!g.parent_id || !byId.has(g.parent_id)) {
      // orphan revisions or non-quote types
      consumed.add(g.id)
      result.push(g)
    }
  }

  return result
}

interface Props {
  generations: Generation[]
  locale: string
  zh: boolean
}

export default function DashboardClient({ generations, locale, zh }: Props) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'quote' | 'invoice' | 'email'>('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return generations.filter((g) => {
      if (typeFilter !== 'all' && g.tool_type !== typeFilter) return false
      if (!q) return true
      const title = getTitle(g).toLowerCase()
      const summary = getSummary(g, zh).toLowerCase()
      const d = g.input_data as Record<string, unknown>
      const clientName = String(d?.clientName ?? d?.buyerName ?? '').toLowerCase()
      return title.includes(q) || summary.includes(q) || clientName.includes(q)
    })
  }, [generations, query, typeFilter, zh])

  const grouped = useMemo(() => buildVersionGroups(filtered), [filtered])

  const toggleGroup = (id: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allFilteredIds = useMemo(() => filtered.map((g) => g.id), [filtered])

  const toggleSelectAll = () => {
    if (selected.size === allFilteredIds.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allFilteredIds))
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectGroup = (ids: string[]) => {
    const allSelected = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        ids.forEach((id) => next.delete(id))
      } else {
        ids.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleExportCSV = () => {
    const rows = [['Date', 'Type', 'Title', 'Client', 'Currency', 'Amount', 'Status']]
    for (const g of filtered) {
      const o = g.output_data as Record<string, unknown> | null
      const d = g.input_data as Record<string, unknown>
      const title = getTitle(g)
      const client = String(d?.clientName ?? d?.buyerName ?? '')
      const currency = String(o?.currency ?? '')
      const amount = String(o?.total ?? '')
      const status = g.invoice_status ?? g.status
      rows.push([new Date(g.created_at).toLocaleDateString(), g.tool_type, title, client, currency, amount, status ?? ''])
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `bizdoc-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const handleBatchPDF = async () => {
    for (const id of [...selected]) {
      const a = document.createElement('a')
      a.href = `/api/pdf/${id}`
      a.download = `document-${id.slice(0, 8)}.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      await new Promise((r) => setTimeout(r, 400))
    }
  }

  const renderRow = (gen: Generation, version?: number, total?: number) => {
    const title = getTitle(gen)
    const summary = getSummary(gen, zh)
    const typeLabel = TYPE_LABELS[gen.tool_type]?.[zh ? 'zh' : 'en'] ?? gen.tool_type
    const isRevision = version !== undefined && version > 1

    return (
      <div
        key={gen.id}
        className={`flex items-center justify-between px-4 py-3.5 gap-4 hover:bg-gray-50 ${isRevision ? 'pl-10 bg-gray-50/50' : ''}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            checked={selected.has(gen.id)}
            onChange={() => toggleSelect(gen.id)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
          />
          <span className="text-xl shrink-0" aria-hidden>
            {isRevision ? '↳' : TYPE_ICONS[gen.tool_type] ?? '📄'}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-400">
                {new Date(gen.created_at).toLocaleDateString(zh ? 'zh-CN' : 'en-US')}
              </span>
              <span className="text-gray-200">·</span>
              <span className="text-xs text-indigo-500 font-medium">{typeLabel}</span>
              {version !== undefined && total !== undefined && total > 1 && (
                <span className="text-[10px] font-medium bg-violet-100 text-violet-700 rounded-full px-1.5 py-0.5">
                  v{version}
                </span>
              )}
              {gen.tool_type === 'invoice' && (
                <InvoiceStatusBadge genId={gen.id} initialStatus={gen.invoice_status ?? null} zh={zh} />
              )}
              {summary && (
                <>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400 truncate max-w-xs">{summary}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <a href={`/view/${gen.id}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-indigo-600 hover:underline">
            {zh ? '分享' : 'Share'}
          </a>
          <a href={`/api/pdf/${gen.id}`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-indigo-600 hover:underline">
            PDF
          </a>
          {gen.tool_type === 'invoice' && gen.invoice_status === 'paid' && (
            <a href={`/api/pdf/receipt/${gen.id}`} target="_blank" rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-indigo-600 hover:underline">
              {zh ? '收据/Receipt' : '收据/Receipt'}
            </a>
          )}
          {gen.tool_type === 'quote' && (
            <Link href={`/${locale}/tools/invoice?fromQuote=${gen.id}`}
              className="text-xs text-gray-400 hover:text-indigo-600 hover:underline">
              {zh ? '转Invoice' : '→Invoice'}
            </Link>
          )}
          <Link href={`/${locale}/tools/${gen.tool_type}?from=${gen.id}`}
            className="text-xs font-medium text-indigo-600 hover:underline">
            {zh ? '重新编辑' : 'Re-use'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search + type filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={zh ? '搜索客户名、标题…' : 'Search client, title…'}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent"
          />
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm shrink-0">
          {(['all', 'quote', 'invoice', 'email'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 transition-colors ${typeFilter === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t === 'all'
                ? (zh ? '全部' : 'All')
                : TYPE_LABELS[t][zh ? 'zh' : 'en']}
            </button>
          ))}
        </div>
      </div>

      {/* Batch action toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm flex-wrap">
          <span className="text-indigo-700 font-medium shrink-0">
            {selected.size} / {allFilteredIds.length} {zh ? '已选' : 'selected'}
          </span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              onClick={handleExportCSV}
              className="rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {zh ? '导出 CSV' : 'Export CSV'}
            </button>
            <button
              onClick={handleBatchPDF}
              className="rounded-md border border-indigo-300 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              {zh ? `下载 PDF (${selected.size})` : `Download PDFs (${selected.size})`}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {zh ? '清除选择' : 'Clear'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">{zh ? '没有匹配的记录' : 'No matching records'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {/* Select all header row */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
            <input
              type="checkbox"
              checked={allFilteredIds.length > 0 && selected.size === allFilteredIds.length}
              onChange={toggleSelectAll}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-gray-500">
              {zh ? '全选' : 'Select all'} ({allFilteredIds.length})
            </span>
          </div>
          {grouped.map((item) => {
            if ('versions' in item) {
              const { root, versions } = item
              const isExpanded = expandedGroups.has(root.id)
              const groupIds = versions.map((v) => v.id)
              const allGroupSelected = groupIds.every((id) => selected.has(id))
              return (
                <div key={root.id}>
                  {/* Group checkbox row */}
                  <div className="flex items-center gap-2 px-4 py-1 bg-gray-50/60 border-b border-gray-50">
                    <input
                      type="checkbox"
                      checked={allGroupSelected}
                      onChange={() => toggleSelectGroup(groupIds)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[10px] text-gray-400">
                      {zh ? `选择全部 ${versions.length} 个版本` : `Select all ${versions.length} versions`}
                    </span>
                  </div>
                  {/* Latest version row (last in array) */}
                  {renderRow(versions[versions.length - 1], versions.length, versions.length)}
                  {/* Version toggle */}
                  {versions.length > 1 && (
                    <button
                      onClick={() => toggleGroup(root.id)}
                      className="w-full flex items-center gap-2 px-10 py-1.5 text-xs text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border-t border-gray-50"
                    >
                      <svg className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {isExpanded
                        ? (zh ? '收起历史版本' : 'Collapse versions')
                        : (zh ? `查看全部 ${versions.length} 个版本` : `View all ${versions.length} versions`)}
                    </button>
                  )}
                  {/* Older versions (expanded) */}
                  {isExpanded && versions.slice(0, -1).reverse().map((v, i) =>
                    <div key={v.id} className="border-t border-gray-50">
                      {renderRow(v, versions.length - 1 - i, versions.length)}
                    </div>
                  )}
                </div>
              )
            }
            return renderRow(item as Generation)
          })}
        </div>
      )}
    </div>
  )
}
