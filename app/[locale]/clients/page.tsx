'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  email: string | null
  company: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

const EMPTY_FORM = { name: '', email: '', company: '', phone: '', notes: '' }

export default function ClientsPage() {
  const params = useParams()
  const zh = params.locale === 'zh'

  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then(({ clients }) => setClients(clients ?? []))
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setClients((prev) => [data.client, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } else {
      setError(data.error ?? (zh ? '保存失败' : 'Failed to save'))
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(zh ? '确认删除该客户？' : 'Delete this client?')) return
    setDeletingId(id)
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClients((prev) => prev.filter((c) => c.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{zh ? '客户列表' : 'Client Book'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {zh ? '保存客户信息，方便快速填写工具表单' : 'Save client info for quick form filling'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError('') }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          {zh ? '+ 添加客户' : '+ Add Client'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 space-y-4"
        >
          <h2 className="text-sm font-semibold text-indigo-900">
            {zh ? '添加新客户' : 'New Client'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {zh ? '姓名 *' : 'Name *'}
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={zh ? '客户姓名' : 'Client name'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {zh ? '公司' : 'Company'}
              </label>
              <input
                value={form.company}
                onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={zh ? '公司名称' : 'Company name'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {zh ? '邮箱' : 'Email'}
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {zh ? '电话' : 'Phone'}
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder={zh ? '+86 138 xxxx xxxx' : '+1 555 000 0000'}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {zh ? '备注' : 'Notes'}
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              placeholder={zh ? '其他信息' : 'Additional notes'}
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              {zh ? '取消' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? (zh ? '保存中…' : 'Saving…') : (zh ? '保存' : 'Save')}
            </button>
          </div>
        </form>
      )}

      {/* Client list */}
      {loading ? (
        <p className="text-sm text-gray-400">{zh ? '加载中…' : 'Loading…'}</p>
      ) : clients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
          <p className="text-gray-400 text-sm">{zh ? '还没有客户，点击右上角添加' : 'No clients yet. Click the button above to add one.'}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
          {clients.map((c) => (
            <div key={c.id} className="px-5 py-4 flex items-start justify-between hover:bg-gray-50">
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                {c.company && (
                  <p className="text-xs text-gray-500 truncate">{c.company}</p>
                )}
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                  {c.email && <span>{c.email}</span>}
                  {c.phone && <span>{c.phone}</span>}
                </div>
                {c.notes && (
                  <p className="text-xs text-gray-400 truncate max-w-sm">{c.notes}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="ml-4 shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
              >
                {deletingId === c.id ? '…' : (zh ? '删除' : 'Delete')}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <Link
          href={`/${params.locale}/account`}
          className="text-xs text-indigo-600 hover:underline"
        >
          ← {zh ? '返回账户设置' : 'Back to Account'}
        </Link>
      </div>
    </div>
  )
}
