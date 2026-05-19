'use client'

import { useState } from 'react'

const SUPPORT_EMAIL = 'fanhui100@gmail.com'
const SUPPORT_WECHAT = 'bestfrankie_ever'
const CONTACT_TEXT = `Email: ${SUPPORT_EMAIL}\nWeChat: ${SUPPORT_WECHAT}`

export function ContactButton({ label }: { label: string }) {
  const [state, setState] = useState<'idle' | 'copied'>('idle')

  const handle = () => {
    navigator.clipboard.writeText(CONTACT_TEXT).catch(() => {})
    setState('copied')
    setTimeout(() => setState('idle'), 2500)
  }

  return (
    <button
      onClick={handle}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
    >
      {state === 'copied' ? (
        <>联系方式已复制</>
      ) : (
        <>
          {label}
          <span className="ml-1 hidden text-xs text-gray-400 sm:inline">
            ({SUPPORT_EMAIL} / {SUPPORT_WECHAT})
          </span>
        </>
      )}
    </button>
  )
}
