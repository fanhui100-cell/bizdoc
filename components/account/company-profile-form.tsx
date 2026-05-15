'use client'

import { useState, useEffect } from 'react'

interface CompanyProfile {
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  payment_terms: string
  currency: string
}

const empty = (): CompanyProfile => ({
  company_name: '', contact_name: '', email: '',
  phone: '', address: '', payment_terms: '', currency: 'USD',
})

interface Props {
  zh: boolean
}

export function CompanyProfileForm({ zh }: Props) {
  const [form, setForm] = useState<CompanyProfile>(empty())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/company-profile')
      .then((r) => r.json())
      .then(({ profile }) => { if (profile) setForm(profile) })
      .finally(() => setLoading(false))
  }, [])

  const set = (field: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await fetch('/api/company-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return <p className="text-sm text-gray-400 px-5 py-4">{zh ? '加载中...' : 'Loading…'}</p>

  return (
    <form onSubmit={handleSave} className="px-5 py-4 space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{zh ? '公司资料' : 'Company Profile'}</p>
      <p className="text-xs text-gray-500">{zh ? '保存后自动填充到工具表单' : 'Saved data will auto-fill tool forms'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {([
          ['company_name', zh ? '公司名称' : 'Company Name'],
          ['contact_name', zh ? '联系人姓名' : 'Contact Name'],
          ['email',        zh ? '联系邮箱' : 'Contact Email'],
          ['phone',        zh ? '电话' : 'Phone'],
          ['payment_terms', zh ? '付款条款' : 'Payment Terms'],
          ['currency',     zh ? '默认币种' : 'Default Currency'],
        ] as [keyof CompanyProfile, string][]).map(([field, label]) => (
          <div key={field}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input
              value={form[field]}
              onChange={set(field)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">{zh ? '地址' : 'Address'}</label>
          <input
            value={form.address}
            onChange={set('address')}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
      >
        {saving ? (zh ? '保存中...' : 'Saving…') : saved ? (zh ? '已保存 ✓' : 'Saved ✓') : (zh ? '保存' : 'Save')}
      </button>
    </form>
  )
}
