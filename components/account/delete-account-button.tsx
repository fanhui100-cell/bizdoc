'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function DeleteAccountButton({ zh, locale }: { zh: boolean; locale: string }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDelete = async () => {
    setStep('deleting')
    const res = await fetch('/api/account/delete', { method: 'DELETE' })
    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push(`/${locale}`)
      router.refresh()
    } else {
      const d = await res.json()
      setError(d.error ?? (zh ? '删除失败，请重试' : 'Deletion failed, please try again'))
      setStep('idle')
    }
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        className="text-sm text-red-500 hover:text-red-700 hover:underline"
      >
        {zh ? '注销账户' : 'Delete Account'}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-red-700 font-medium">
        {zh
          ? '确认注销？此操作不可恢复，所有数据将被永久删除。'
          : 'Are you sure? This cannot be undone. All your data will be permanently deleted.'}
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={step === 'deleting'}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {step === 'deleting' ? (zh ? '删除中…' : 'Deleting…') : (zh ? '确认注销' : 'Confirm Delete')}
        </button>
        <button
          onClick={() => setStep('idle')}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          {zh ? '取消' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
