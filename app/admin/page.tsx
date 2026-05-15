'use client'

import { useState, useEffect } from 'react'

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

const PLANS = ['free', 'pro', 'business']

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ plan: string; quota_monthly: number; expires_at: string }>({
    plan: 'free', quota_monthly: 5, expires_at: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(({ users }) => setUsers(users ?? []))
      .finally(() => setLoading(false))
  }, [])

  const startEdit = (u: UserRow) => {
    setEditing(u.id)
    setEditForm({
      plan: u.plan,
      quota_monthly: u.quota_monthly,
      expires_at: u.expires_at ? u.expires_at.slice(0, 10) : '',
    })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan: editForm.plan,
        quota_monthly: editForm.quota_monthly,
        expires_at: editForm.expires_at || null,
      }),
    })
    if (res.ok) {
      const { after } = await res.json()
      setUsers((prev) =>
        prev.map((u) => u.id === id ? { ...u, ...after } : u)
      )
      setEditing(null)
    }
    setSaving(false)
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Users ({users.length})</h1>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Plan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Quota</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Expires</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <select
                      value={editForm.plan}
                      onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {PLANS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  ) : (
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.plan === 'business' ? 'bg-purple-100 text-purple-700'
                      : u.plan === 'pro' ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>{u.plan}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <input
                      type="number" min="0"
                      value={editForm.quota_monthly}
                      onChange={(e) => setEditForm((f) => ({ ...f, quota_monthly: Number(e.target.value) }))}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right"
                    />
                  ) : (
                    <span className="text-gray-700">{u.quota_used} / {u.quota_monthly}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editing === u.id ? (
                    <input
                      type="date"
                      value={editForm.expires_at}
                      onChange={(e) => setEditForm((f) => ({ ...f, expires_at: e.target.value }))}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="text-gray-500 text-xs">
                      {u.expires_at ? new Date(u.expires_at).toLocaleDateString() : '—'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {editing === u.id ? (
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => saveEdit(u.id)} disabled={saving}
                        className="rounded bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? '…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(null)}
                        className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(u)}
                      className="text-xs text-indigo-600 hover:underline">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
