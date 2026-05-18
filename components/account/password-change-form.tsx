'use client'

import { useState } from 'react'

export function PasswordChangeForm({ zh }: { zh: boolean }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setMsg(zh ? '密码至少 6 位字符' : 'Password must be at least 6 characters')
      setStatus('error'); return
    }
    if (password !== confirm) {
      setMsg(zh ? '两次密码不一致' : 'Passwords do not match')
      setStatus('error'); return
    }
    setStatus('saving')
    const res = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      setStatus('ok')
      setMsg(zh ? '密码已更新' : 'Password updated')
      setPassword(''); setConfirm('')
    } else {
      const d = await res.json()
      setStatus('error')
      setMsg(d.error ?? (zh ? '更新失败' : 'Update failed'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
      <p className="text-sm font-medium text-gray-900">
        {zh ? '修改密码' : 'Change Password'}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {zh ? '新密码' : 'New Password'}
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={zh ? '至少 6 位字符' : 'At least 6 characters'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            {zh ? '确认新密码' : 'Confirm Password'}
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={zh ? '再输一次' : 'Repeat password'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
      </div>
      {msg && (
        <p className={`text-xs ${status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{msg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'saving'}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {status === 'saving' ? (zh ? '保存中…' : 'Saving…') : (zh ? '更新密码' : 'Update Password')}
      </button>
    </form>
  )
}
