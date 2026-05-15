import 'server-only'
import { createClient } from '@/lib/supabase/server'

export class QuotaExceededError extends Error {
  constructor() {
    super('Monthly quota exceeded')
    this.name = 'QuotaExceededError'
  }
}

export interface QuotaStatus {
  used: number
  monthly: number
  remaining: number
}

// For display only (e.g. navbar quota chip). Not an authorization gate.
export async function getQuotaStatus(userId: string): Promise<QuotaStatus> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users_profile')
    .select('quota_monthly, quota_used')
    .eq('id', userId)
    .single()

  if (error || !data) throw new Error('Failed to read user profile')

  return {
    used: data.quota_used,
    monthly: data.quota_monthly,
    remaining: Math.max(0, data.quota_monthly - data.quota_used),
  }
}

// Atomically resets (if period passed), checks, and consumes one quota unit.
// Must be called server-side with the authenticated user's session — the DB
// function uses auth.uid() internally, so no userId parameter is needed.
// Throws QuotaExceededError if the user has no remaining quota.
// Call this before the AI generation; a failed generation consumes the credit
// (acceptable for MVP — prevents unlimited free retries).
export async function consumeQuota(): Promise<QuotaStatus> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('consume_quota')
  if (error) throw new Error('Quota check failed')

  const result = data as {
    ok: boolean
    error?: string
    used: number
    monthly: number
    remaining: number
  }

  if (!result.ok) {
    if (result.error === 'quota_exceeded') throw new QuotaExceededError()
    throw new Error(`Quota check failed: ${result.error ?? 'unknown'}`)
  }

  return { used: result.used, monthly: result.monthly, remaining: result.remaining }
}
