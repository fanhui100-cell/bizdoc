'use client'

import { useState } from 'react'

type InvoiceStatus = 'pending' | 'reminded' | 'paid' | 'overdue' | 'cancelled'

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  reminded: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_LABELS: Record<InvoiceStatus, { zh: string; en: string }> = {
  pending: { zh: '待支付', en: 'Pending' },
  reminded: { zh: '已提醒', en: 'Reminded' },
  paid: { zh: '已支付', en: 'Paid' },
  overdue: { zh: '已逾期', en: 'Overdue' },
  cancelled: { zh: '已取消', en: 'Cancelled' },
}

const CYCLE: Record<InvoiceStatus, InvoiceStatus> = {
  pending: 'reminded',
  reminded: 'paid',
  paid: 'overdue',
  overdue: 'cancelled',
  cancelled: 'pending',
}

interface Props {
  genId: string
  initialStatus: InvoiceStatus | null
  zh: boolean
}

export function InvoiceStatusBadge({ genId, initialStatus, zh }: Props) {
  const [status, setStatus] = useState<InvoiceStatus>(initialStatus ?? 'pending')
  const [saving, setSaving] = useState(false)

  const cycle = async () => {
    const next = CYCLE[status]
    setSaving(true)
    try {
      const res = await fetch(`/api/generations/${genId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceStatus: next }),
      })
      if (res.ok) setStatus(next)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      onClick={cycle}
      disabled={saving}
      title={zh ? '点击切换状态' : 'Click to change status'}
      className={`text-xs border rounded-full px-2 py-0.5 font-medium transition-opacity disabled:opacity-50 ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status][zh ? 'zh' : 'en']}
    </button>
  )
}
