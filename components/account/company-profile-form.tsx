'use client'

import { useState, useEffect, useRef } from 'react'

interface CompanyProfile {
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  payment_terms: string
  currency: string
  bank_info: string
  pdf_style: string
  logo_url?: string | null
}

const empty = (): CompanyProfile => ({
  company_name: '', contact_name: '', email: '',
  phone: '', address: '', payment_terms: '', currency: 'USD',
  bank_info: '', pdf_style: 'minimal', logo_url: null,
})

interface Props {
  zh: boolean
}

export function CompanyProfileForm({ zh }: Props) {
  const [form, setForm] = useState<CompanyProfile>(empty())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/company-profile')
      .then((r) => r.json())
      .then(({ profile }) => { if (profile) setForm(profile) })
      .finally(() => setLoading(false))
  }, [])

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true)
    setLogoError(null)
    const fd = new FormData()
    fd.append('logo', file)
    const res = await fetch('/api/company-profile/logo', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) { setLogoError(data.error ?? 'Upload failed'); setLogoUploading(false); return }
    setForm((f) => ({ ...f, logo_url: data.logoUrl }))
    setLogoUploading(false)
  }

  const handleLogoDelete = async () => {
    setLogoUploading(true)
    await fetch('/api/company-profile/logo', { method: 'DELETE' })
    setForm((f) => ({ ...f, logo_url: null }))
    setLogoUploading(false)
  }

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
              value={form[field] ?? ''}
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

      {/* Bank / payment account info */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {zh ? '收款账户信息（自动嵌入 Invoice PDF）' : 'Payment Account Info (auto-embedded in Invoice PDF)'}
        </label>
        <textarea
          value={form.bank_info}
          onChange={(e) => setForm((f) => ({ ...f, bank_info: e.target.value }))}
          rows={3}
          placeholder={zh ? '银行名称\n账户名称\n账号 / PayPal / 支付宝 / 微信收款码说明' : 'Bank Name\nAccount Name\nAccount No. / SWIFT / PayPal / etc.'}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* PDF style */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">{zh ? 'PDF 导出风格' : 'PDF Export Style'}</p>
        <div className="flex gap-3">
          {([
            ['minimal',   zh ? '简约' : 'Minimal',   'bg-white border-gray-300'],
            ['business',  zh ? '商务' : 'Business',  'bg-indigo-600'],
            ['colorful',  zh ? '彩色' : 'Colorful',  'bg-teal-500'],
          ] as [string, string, string][]).map(([val, label, accent]) => (
            <button
              key={val}
              type="button"
              onClick={() => setForm((f) => ({ ...f, pdf_style: val }))}
              className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                form.pdf_style === val
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <span className={`h-3 w-3 rounded-sm border border-gray-200 ${accent}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Logo uploader */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">{zh ? '公司 Logo（用于 PDF 导出）' : 'Company Logo (used in PDF exports)'}</p>
        <div className="flex items-center gap-4">
          {form.logo_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.logo_url} alt="logo" className="h-12 w-auto max-w-[120px] rounded border border-gray-200 object-contain bg-gray-50 p-1" />
              <button
                type="button"
                onClick={handleLogoDelete}
                disabled={logoUploading}
                className="text-xs text-red-500 hover:underline disabled:opacity-50"
              >
                {zh ? '删除' : 'Remove'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={logoUploading}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
            >
              {logoUploading ? (zh ? '上传中...' : 'Uploading…') : (zh ? '+ 上传 Logo（PNG / JPG / SVG，最大 2 MB）' : '+ Upload Logo (PNG / JPG / SVG, max 2 MB)')}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
          />
        </div>
        {logoError && <p className="mt-1 text-xs text-red-500">{logoError}</p>}
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
