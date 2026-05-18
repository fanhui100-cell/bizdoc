'use client'

import { useState } from 'react'

interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  plan: string
  quota_used: number
  quota_monthly: number
  quota_reset_at: string | null
  expires_at: string | null
  created_at: string
}

const PLAN_QUOTAS: Record<string, number> = {
  free: 5,
  pro: 100,
  business: 500,
}

const PLAN_OPTIONS = ['free', 'pro', 'business']

interface Props {
  users: UserRow[]
  zh: boolean
}

export default function AdminUserTable({ users: initialUsers, zh }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ plan: '', quota_monthly: 0, expires_at: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const startEdit = (u: UserRow) => {
    setEditing(u.id)
    setForm({
      plan: u.plan,
      quota_monthly: u.quota_monthly,
      expires_at: u.expires_at ? u.expires_at.slice(0, 10) : '',
    })
    setMessage('')
  }

  const handlePlanChange = (plan: string) => {
    setForm((f) => ({
      ...f,
      plan,
      quota_monthly: PLAN_QUOTAS[plan] ?? f.quota_monthly,
    }))
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    setMessage('')
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: form.plan,
        quota_monthly: form.quota_monthly,
        expires_at: form.expires_at || null,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, plan: form.plan, quota_monthly: form.quota_monthly, expires_at: form.expires_at || null }
            : u
        )
      )
      setEditing(null)
      setMessage(zh ? '已保存' : 'Saved')
    } else {
      setMessage(zh ? '保存失败' : 'Save failed')
    }
  }

  return (
    <div className="space-y-2">
      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-block">
          {message}
        </p>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  zh ? '用户' : 'User',
                  zh ? '方案' : 'Plan',
                  zh ? '本月已用' : 'Used',
                  zh ? '月限额' : 'Monthly',
                  zh ? '到期' : 'Expires',
                  zh ? '注册时间' : 'Joined',
                  zh ? '操作' : 'Actions',
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">{u.email}</p>
                    {u.full_name && (
                      <p className="text-xs text-gray-400 truncate max-w-[180px]">{u.full_name}</p>
                    )}
                  </td>

                  {editing === u.id ? (
                    <>
                      <td className="px-4 py-3">
                        <select
                          value={form.plan}
                          onChange={(e) => handlePlanChange(e.target.value)}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.quota_used}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={form.quota_monthly}
                          onChange={(e) => setForm((f) => ({ ...f, quota_monthly: Number(e.target.value) }))}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={form.expires_at}
                          onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(u.id)}
                            disabled={saving}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                          >
                            {saving ? '…' : (zh ? '保存' : 'Save')}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            {zh ? '取消' : 'Cancel'}
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <span className={[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          u.plan === 'business' ? 'bg-purple-100 text-purple-700' :
                          u.plan === 'pro'      ? 'bg-indigo-100 text-indigo-700' :
                                                  'bg-gray-100 text-gray-600',
                        ].join(' ')}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.quota_used}</td>
                      <td className="px-4 py-3 text-gray-500">{u.quota_monthly}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {zh ? '编辑' : 'Edit'}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
