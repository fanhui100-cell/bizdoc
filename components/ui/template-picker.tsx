'use client'

import { useState, useEffect, useRef } from 'react'
import type { UserTemplate } from '@/lib/types'

interface Props {
  toolType: 'quote' | 'invoice' | 'email'
  onLoad: (inputData: Record<string, unknown>) => void
  zh: boolean
}

export function TemplatePicker({ toolType, onLoad, zh }: Props) {
  const [templates, setTemplates] = useState<UserTemplate[]>([])
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/user-templates?type=${toolType}`)
      .then((r) => r.json())
      .then(({ templates }) => setTemplates(templates ?? []))
      .catch(() => {})
  }, [toolType])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleting(id)
    await fetch(`/api/user-templates/${id}`, { method: 'DELETE' })
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    setDeleting(null)
  }

  if (templates.length === 0) return null

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8" />
        </svg>
        {zh ? '从模板加载' : 'Load Template'}
        <svg className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {zh ? '我的模板' : 'My Templates'}
            </p>
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-gray-50">
            {templates.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => { onLoad(t.input_data); setOpen(false) }}
                  className="group flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-indigo-50 transition-colors"
                >
                  <span className="text-sm text-gray-800 truncate pr-2">{t.name}</span>
                  <span
                    role="button"
                    onClick={(e) => handleDelete(e, t.id)}
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                    title={zh ? '删除' : 'Delete'}
                  >
                    {deleting === t.id ? '…' : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
