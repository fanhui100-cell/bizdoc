import { Resend } from 'resend'

// Lazily initialised — only fails at call time if key is missing, not at import
let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY is not set')
    _resend = new Resend(key)
  }
  return _resend
}

export const FROM_ADDRESS =
  process.env.RESEND_FROM ?? 'BizDoc AI <noreply@bizdoc-ai.com>'
