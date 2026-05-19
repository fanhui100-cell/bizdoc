'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getDictionary, isValidLocale } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

type Tab = 'login' | 'register'

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const safeLocale = isValidLocale(locale) ? locale : 'zh'

  const [dict, setDict] = useState<Dictionary | null>(null)
  const [tab, setTab] = useState<Tab>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Load dictionary client-side
  useState(() => {
    getDictionary(safeLocale).then(setDict)
  })

  if (!dict) return null

  const t = dict.login

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(t.errors.invalidCredentials)
    } else {
      router.push(`/${safeLocale}/dashboard`)
      router.refresh()
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    setLoading(false)
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError(t.errors.emailInUse)
      } else if (error.message.includes('Password')) {
        setError(t.errors.weakPassword)
      } else {
        setError(t.errors.generic)
      }
    } else {
      setMessage(t.checkEmail)
    }
  }

  const handleGoogle = async () => {
    const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, '')
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteOrigin}/api/auth/callback?next=/${safeLocale}/dashboard`,
        skipBrowserRedirect: true,
      },
    })
    if (error) { setError(error.message); return }
    if (data?.url) window.location.href = data.url
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
          </div>

          {/* Tabs */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
            <button
              onClick={() => { setTab('login'); setError(''); setMessage('') }}
              className={[
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                tab === 'login' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900',
              ].join(' ')}
            >
              {t.loginTab}
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setMessage('') }}
              className={[
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                tab === 'register' ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:text-gray-900',
              ].join(' ')}
            >
              {t.registerTab}
            </button>
          </div>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t.googleBtn}
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">{t.orDivider}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {tab === 'register' && (
              <Input
                label={t.nameLabel}
                type="text"
                placeholder={t.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              label={t.emailLabel}
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              label={t.passwordLabel}
              type="password"
              placeholder={t.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{message}</p>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {tab === 'login' ? t.loginBtn : t.registerBtn}
            </Button>
          </form>

          {tab === 'login' && (
            <p className="mt-4 text-center text-xs text-gray-400 hover:text-gray-600">
              <Link href={`/${safeLocale}/forgot-password`}>{t.forgotPassword}</Link>
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          <Link href={`/${safeLocale}`} className="hover:text-gray-600">
            ← {dict.common.backToHome}
          </Link>
        </p>
      </div>
    </div>
  )
}
