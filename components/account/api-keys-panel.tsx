'use client'

import { useEffect, useState } from 'react'

interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at: string | null
  revoked: boolean
}

interface Props { zh: boolean; plan: string }

export function ApiKeysPanel({ zh, plan }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealed, setRevealed] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/api-keys').then((r) => r.json()).then(({ keys }) => setKeys(keys ?? [])).finally(() => setLoading(false))
  }, [])

  const create = async () => {
    setCreating(true)
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName || 'Default' }),
    })
    const data = await res.json()
    if (res.ok) {
      setRevealed(data.key)
      setKeys((prev) => [data, ...prev])
      setNewKeyName('')
    }
    setCreating(false)
  }

  const revoke = async (id: string) => {
    await fetch('/api/api-keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, revoked: true } : k))
  }

  if (plan !== 'business') {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center space-y-2">
        <p className="text-sm font-medium text-gray-700">{zh ? 'API 访问（Business 专属）' : 'API Access (Business only)'}</p>
        <p className="text-xs text-gray-400">{zh ? '升级到 Business 套餐后可生成 API Key，通过接口调用文书生成。' : 'Upgrade to Business to generate API keys and integrate document generation into your workflow.'}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{zh ? 'API Keys' : 'API Keys'}</p>

      {revealed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-amber-700">{zh ? '⚠️ 请立即复制，此后无法再次查看' : '⚠️ Copy now — this key will not be shown again'}</p>
          <code className="block text-xs font-mono text-amber-900 bg-amber-100 rounded px-3 py-2 select-all break-all">{revealed}</code>
          <button onClick={() => { navigator.clipboard.writeText(revealed); setRevealed(null) }}
            className="text-xs text-amber-700 underline">
            {zh ? '复制并关闭' : 'Copy & dismiss'}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder={zh ? 'Key 名称（可选）' : 'Key name (optional)'}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={create} disabled={creating}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {creating ? '…' : (zh ? '生成' : 'Generate')}
        </button>
      </div>

      {loading ? <p className="text-xs text-gray-400">{zh ? '加载中…' : 'Loading…'}</p> : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
          {keys.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">{zh ? '暂无 API Key' : 'No API keys yet'}</p>
          )}
          {keys.map((k) => (
            <div key={k.id} className={`flex items-center justify-between px-4 py-3 gap-4 ${k.revoked ? 'opacity-40' : ''}`}>
              <div>
                <p className="text-sm font-medium text-gray-800">{k.name}</p>
                <p className="text-xs text-gray-400 font-mono">{k.key_prefix}…</p>
                <p className="text-xs text-gray-300">{new Date(k.created_at).toLocaleDateString()}</p>
              </div>
              {!k.revoked && (
                <button onClick={() => revoke(k.id)}
                  className="text-xs text-red-500 hover:underline shrink-0">
                  {zh ? '撤销' : 'Revoke'}
                </button>
              )}
              {k.revoked && <span className="text-xs text-gray-400">{zh ? '已撤销' : 'Revoked'}</span>}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {zh
          ? '在请求头中添加 Authorization: Bearer <key>，调用 POST /api/generate 即可。'
          : 'Add Authorization: Bearer <key> to your request headers when calling POST /api/generate.'}
      </p>
    </div>
  )
}
