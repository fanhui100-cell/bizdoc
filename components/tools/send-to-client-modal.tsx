'use client'

import { useState } from 'react'

interface Props {
  genId: string
  zh: boolean
  defaultRecipient?: string
}

export function SendToClientButton({ genId, zh, defaultRecipient = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(defaultRecipient)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    if (!email) return
    setSending(true)
    setError(null)
    const res = await fetch('/api/email/send-to-client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genId, recipientEmail: email, recipientName: name || undefined, message: message || undefined }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { setError(data.error ?? (zh ? '发送失败' : 'Send failed')); return }
    setSent(true)
    setTimeout(() => { setSent(false); setOpen(false) }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {zh ? '✉️ 发给客户' : '✉️ Send to client'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                {zh ? '发送文书给客户' : 'Send document to client'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {zh ? '客户邮箱 *' : 'Client email *'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {zh ? '客户称呼（可选）' : 'Client name (optional)'}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={zh ? '张总' : 'Mr. Smith'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {zh ? '附言（可选）' : 'Personal message (optional)'}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  placeholder={zh ? '请查阅，如有问题欢迎联系。' : 'Please find the document attached. Feel free to reach out.'}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {zh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={send}
                disabled={sending || !email}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {sent ? (zh ? '已发送 ✓' : 'Sent ✓') : sending ? (zh ? '发送中...' : 'Sending…') : (zh ? '发送' : 'Send')}
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center">
              {zh
                ? '邮件将包含在线查看链接和 PDF 下载按钮'
                : 'Email will include an online view link and a PDF download button'}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
