'use client'

import { useState } from 'react'

interface Props {
  toolType: 'quote' | 'invoice' | 'email'
  inputData: Record<string, unknown>
  zh: boolean
}

export function SaveTemplateButton({ toolType, inputData, zh }: Props) {
  const [state, setState] = useState<'idle' | 'naming' | 'saving' | 'done'>('idle')
  const [name, setName] = useState('')

  const handleSave = async () => {
    if (!name.trim()) return
    setState('saving')
    await fetch('/api/user-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool_type: toolType, name: name.trim(), input_data: inputData }),
    })
    setState('done')
    setTimeout(() => setState('idle'), 2000)
  }

  if (state === 'done') {
    return (
      <span className="text-xs text-green-400 font-medium">
        {zh ? '✓ 已保存' : '✓ Saved'}
      </span>
    )
  }

  if (state === 'naming' || state === 'saving') {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setState('idle') }}
          placeholder={zh ? '模板名称…' : 'Template name…'}
          className="rounded border border-white/30 bg-white/10 px-2 py-1 text-xs text-white placeholder-white/50 outline-none focus:border-white/60 w-32"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={state === 'saving' || !name.trim()}
          className="text-xs font-medium text-white/80 hover:text-white disabled:opacity-40"
        >
          {state === 'saving' ? '…' : (zh ? '保存' : 'Save')}
        </button>
        <button type="button" onClick={() => setState('idle')} className="text-xs text-white/50 hover:text-white/80">✕</button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setState('naming')}
      className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors"
      title={zh ? '保存为模板' : 'Save as template'}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      {zh ? '保存为模板' : 'Save as template'}
    </button>
  )
}
