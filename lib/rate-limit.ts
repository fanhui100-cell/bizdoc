import { NextRequest, NextResponse } from 'next/server'

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

const limits: Record<string, { windowMs: number; max: number }> = {
  generate: { windowMs: 60_000, max: 20 },
  extract: { windowMs: 60_000, max: 15 },
  email: { windowMs: 60_000, max: 30 },
  default: { windowMs: 60_000, max: 60 },
}

function clientIp(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

export function checkRateLimit(req: NextRequest, scope: keyof typeof limits = 'default') {
  const limit = limits[scope] ?? limits.default
  const key = `${scope}:${req.headers.get('authorization') ?? clientIp(req)}`
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + limit.windowMs })
    return { ok: true, limit: limit.max, remaining: limit.max - 1, resetAt: now + limit.windowMs }
  }

  current.count += 1
  const remaining = Math.max(0, limit.max - current.count)
  return { ok: current.count <= limit.max, limit: limit.max, remaining, resetAt: current.resetAt }
}

export function rateLimitResponse(result: ReturnType<typeof checkRateLimit>) {
  return NextResponse.json(
    { error: 'rate_limited', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  )
}
