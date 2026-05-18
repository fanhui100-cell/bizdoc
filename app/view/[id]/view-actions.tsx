'use client'

import { useState } from 'react'

interface Props {
  id: string
  zh: boolean
  toolHref: string
  zh_label: boolean
}

export function ViewActions({ id, zh, toolHref }: Props) {
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => window.print()}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
        </svg>
        {zh ? '打印' : 'Print'}
      </button>

      <button
        onClick={copyLink}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" />
        </svg>
        {copied ? (zh ? '已复制' : 'Copied!') : (zh ? '复制链接' : 'Copy link')}
      </button>

      <a
        href={`/api/pdf/public/${id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {zh ? '下载 PDF' : 'Download PDF'}
      </a>

      <a
        href={toolHref}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        {zh ? '免费创建' : 'Create free'}
      </a>
    </div>
  )
}
