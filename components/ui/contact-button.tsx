'use client'

import { useState } from 'react'

const SUPPORT_EMAIL = 'support@bizdoc-ai.com'

export function ContactButton({ label }: { label: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')

  const handle = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL).catch(() => {})
    // Also attempt mailto — works if an email client is configured
    window.location.href = `mailto:${SUPPORT_EMAIL}`
    setState('copied')
    setTimeout(() => setState('idle'), 2500)
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      {state === 'copied' ? (
        <>✅ {SUPPORT_EMAIL} — 已复制</>
      ) : (
        <>✉️ {label}<span className="text-gray-400 ml-1 text-xs hidden sm:inline">({SUPPORT_EMAIL})</span></>
      )}
    </button>
  )
}
