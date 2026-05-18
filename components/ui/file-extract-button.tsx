'use client'

import { useRef, useState } from 'react'

interface Props {
  toolType: 'quote' | 'invoice'
  onExtracted: (data: Record<string, unknown>) => void
  zh?: boolean
}

export function FileExtractButton({ toolType, onExtracted, zh = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File) => {
    setLoading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('toolType', toolType)

    try {
      const res = await fetch('/api/extract', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? (zh ? '提取失败' : 'Extraction failed'))
        return
      }
      onExtracted(json.data as Record<string, unknown>)
    } catch {
      setError(zh ? '网络错误，请重试' : 'Network error. Please try again.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.csv,.txt,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
            </svg>
            {zh ? '识别中…' : 'Extracting…'}
          </>
        ) : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {zh ? '上传文件自动识别' : 'Import from file'}
          </>
        )}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
