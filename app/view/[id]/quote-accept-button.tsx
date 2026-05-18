'use client'

import { useState } from 'react'

interface Props {
  genId: string
  zh: boolean
}

type State = 'idle' | 'open' | 'submitting' | 'done' | 'already'

export function QuoteAcceptButton({ genId, zh }: Props) {
  const [state, setState] = useState<State>('idle')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!email) return
    setState('submitting')
    setError(null)
    const res = await fetch('/api/generations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genId, acceptorName: name, acceptorEmail: email }),
    })
    const data = await res.json()
    if (!res.ok) {
      if (data.error === 'already_accepted') { setState('already'); return }
      setError(data.error ?? (zh ? '提交失败，请重试' : 'Submission failed'))
      setState('open')
      return
    }
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center space-y-1">
        <p className="text-emerald-700 font-semibold">✅ {zh ? '已确认接受报价' : 'Quote Accepted'}</p>
        <p className="text-sm text-emerald-600">{zh ? '确认邮件已发送到您的邮箱' : 'A confirmation email has been sent to you.'}</p>
      </div>
    )
  }

  if (state === 'already') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-center">
        <p className="text-slate-600 text-sm">{zh ? '此报价单已被接受' : 'This quote has already been accepted.'}</p>
      </div>
    )
  }

  if (state === 'open' || state === 'submitting') {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-white shadow-md px-6 py-5 space-y-4">
        <div>
          <p className="font-semibold text-slate-800">{zh ? '确认接受报价' : 'Accept this Quote'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{zh ? '填写您的信息后，双方将收到确认邮件' : 'Both parties will receive a confirmation email.'}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{zh ? '您的姓名（可选）' : 'Your name (optional)'}</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder={zh ? '张总' : 'John Smith'}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">{zh ? '您的邮箱 *' : 'Your email *'}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button onClick={() => setState('idle')}
            className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
            {zh ? '取消' : 'Cancel'}
          </button>
          <button onClick={submit} disabled={state === 'submitting' || !email}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors">
            {state === 'submitting' ? (zh ? '提交中…' : 'Submitting…') : (zh ? '确认接受' : 'Confirm Acceptance')}
          </button>
        </div>
      </div>
    )
  }

  // idle
  return (
    <button
      onClick={() => setState('open')}
      className="w-full rounded-xl border-2 border-emerald-500 bg-emerald-50 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
    >
      ✓ {zh ? '接受此报价' : 'Accept this Quote'}
    </button>
  )
}
