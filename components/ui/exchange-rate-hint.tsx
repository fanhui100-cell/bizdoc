'use client'

import { useEffect, useState } from 'react'

interface Props {
  amount: number
  fromCurrency: string
  toCurrency?: string
  zh?: boolean
}

const TARGETS: Record<string, string[]> = {
  USD: ['CNY', 'EUR'],
  CNY: ['USD', 'EUR'],
  EUR: ['USD', 'CNY'],
  GBP: ['USD', 'CNY'],
  HKD: ['USD', 'CNY'],
}

export function ExchangeRateHint({ amount, fromCurrency, toCurrency, zh = false }: Props) {
  const [conversions, setConversions] = useState<{ currency: string; value: string }[]>([])

  useEffect(() => {
    if (!amount || !fromCurrency) return
    fetch('/api/exchange-rate')
      .then((r) => r.json())
      .then(({ rates }: { rates: Record<string, number> }) => {
        const targets = toCurrency
          ? [toCurrency]
          : (TARGETS[fromCurrency] ?? []).filter((c) => c !== fromCurrency)

        const baseRate = rates[fromCurrency] ?? 1
        const results = targets
          .map((c) => {
            const rate = rates[c]
            if (!rate) return null
            const converted = (amount / baseRate) * rate
            return {
              currency: c,
              value: new Intl.NumberFormat('en-US', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(converted),
            }
          })
          .filter(Boolean) as { currency: string; value: string }[]
        setConversions(results)
      })
      .catch(() => {})
  }, [amount, fromCurrency, toCurrency])

  if (!conversions.length) return null

  return (
    <span className="text-xs text-slate-400 ml-2">
      ≈ {conversions.map((c) => c.value).join(' / ')}
      {zh ? ' （参考汇率）' : ' (approx.)'}
    </span>
  )
}
