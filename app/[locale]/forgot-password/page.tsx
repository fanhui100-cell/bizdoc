'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'

export default function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const safeLocale = isValidLocale(locale) ? locale : 'zh'

  const [dict, setDict] = useState<Dictionary | null>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useState(() => {
    getDictionary(safeLocale).then(setDict)
  })

  if (!dict) return null
  const t = dict.forgotPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const redirectTo = `${window.location.origin}/api/auth/callback?next=/${safeLocale}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo })

    setLoading(false)
    if (error) {
      setError(t.error)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white font-bold text-lg mb-3">
              B
            </div>
            <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
            {!sent && <p className="text-sm text-gray-500 mt-1">{t.desc}</p>}
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
                ✓
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t.successTitle}</p>
                <p className="text-sm text-gray-500 mt-1">{t.successDesc}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors disabled:opacity-60"
              >
                {loading ? t.sending : t.sendBtn}
              </button>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link href={`/${safeLocale}/login`} className="hover:text-gray-600">
            ← {t.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  )
}
