import { NextResponse } from 'next/server'

// Cached exchange rates — refreshed at most once per hour via Next.js revalidation
export const revalidate = 3600

const BASE = 'USD'
// Fallback rates if the external API is unavailable
const FALLBACK: Record<string, number> = {
  USD: 1, CNY: 7.25, EUR: 0.92, GBP: 0.79, HKD: 7.82, JPY: 149.5, SGD: 1.34,
}

export async function GET() {
  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${BASE}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) throw new Error('upstream error')
    const data = await res.json() as { rates: Record<string, number> }
    return NextResponse.json({ rates: data.rates, source: 'live' })
  } catch {
    return NextResponse.json({ rates: FALLBACK, source: 'fallback' })
  }
}
