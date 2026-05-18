import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AnthropicProvider } from '@/lib/ai/anthropic'
import { buildPrompt, SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import { extractJSON } from '@/lib/ai/json-extract'
import { validateOutput } from '@/lib/ai/validate-output'
import { consumeQuota, QuotaExceededError } from '@/lib/quota'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'
import type { ToolType, ToolInput } from '@/lib/ai/prompts'

const ai = new AnthropicProvider()

const VALID_TOOL_TYPES = new Set<string>(['quote', 'invoice', 'email'])
const MAX_STRING_LENGTH = 500
const MAX_ITEMS = 20
const MAX_AI_ATTEMPTS = 3

function truncateStrings(obj: unknown, depth = 0): unknown {
  if (depth > 3) return obj
  if (typeof obj === 'string') return obj.slice(0, MAX_STRING_LENGTH)
  if (Array.isArray(obj)) return obj.slice(0, MAX_ITEMS).map((v) => truncateStrings(v, depth + 1))
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, truncateStrings(v, depth + 1)])
    )
  }
  return obj
}

async function resolveUserFromApiKey(rawKey: string): Promise<string | null> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))
  const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const admin = createAdminClient()
  const { data } = await admin
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', hash)
    .eq('revoked', false)
    .single()
  if (!data) return null
  admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('key_hash', hash).then(() => {})
  return data.user_id as string
}

// Non-session quota check for API key callers (no auth.uid() available).
// Not perfectly atomic but acceptable for MVP.
async function consumeQuotaForUser(userId: string): Promise<void> {
  const admin = createAdminClient()
  const now = new Date().toISOString()

  // Reset if period has passed
  await admin.from('users_profile')
    .update({ quota_used: 0, quota_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
    .eq('id', userId)
    .lt('quota_reset_at', now)

  const { data } = await admin.from('users_profile')
    .select('quota_used, quota_monthly')
    .eq('id', userId)
    .single()

  if (!data || data.quota_used >= data.quota_monthly) throw new QuotaExceededError()

  await admin.from('users_profile')
    .update({ quota_used: data.quota_used + 1 })
    .eq('id', userId)
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 'generate')
  if (!rateLimit.ok) return rateLimitResponse(rateLimit)

  const authHeader = req.headers.get('authorization') ?? ''
  const bearerKey = authHeader.startsWith('Bearer biz_') ? authHeader.slice(7) : null

  let userId: string
  let useAdminForInsert = false

  if (bearerKey) {
    const resolved = await resolveUserFromApiKey(bearerKey)
    if (!resolved) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    userId = resolved
    useAdminForInsert = true
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  let toolType: ToolType
  let input: ToolInput
  let parentId: string | undefined
  let clientId: string | undefined

  try {
    const body = await req.json()
    if (!VALID_TOOL_TYPES.has(body.toolType)) {
      return NextResponse.json({ error: 'Invalid toolType' }, { status: 400 })
    }
    if (!body.input || typeof body.input !== 'object' || Array.isArray(body.input)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    toolType = body.toolType as ToolType
    input = truncateStrings(body.input) as ToolInput
    parentId = typeof body.parentId === 'string' ? body.parentId : undefined
    clientId = typeof body.clientId === 'string' ? body.clientId : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const adminForValidation = createAdminClient()
  if (parentId) {
    const { data: parent } = await adminForValidation
      .from('generations')
      .select('id')
      .eq('id', parentId)
      .eq('user_id', userId)
      .single()
    if (!parent) return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 })
  }

  if (clientId) {
    const { data: client } = await adminForValidation
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', userId)
      .single()
    if (!client) return NextResponse.json({ error: 'Invalid clientId' }, { status: 400 })
  }

  try {
    if (useAdminForInsert) {
      await consumeQuotaForUser(userId)
    } else {
      await consumeQuota()
    }
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  let outputData: unknown = null
  let genStatus: 'completed' | 'failed' = 'failed'
  let lastError = ''

  for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS; attempt += 1) {
    try {
      const raw = await ai.generate(SYSTEM_PROMPTS[toolType], buildPrompt(toolType, input))
      outputData = validateOutput(toolType, extractJSON(raw))
      genStatus = 'completed'
      break
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'AI generation failed'
      if (attempt < MAX_AI_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt))
      }
    }
  }

  if (genStatus === 'failed') {
    // quota already consumed — log the failure and return 502
  }

  const inputRecord = input as unknown as Record<string, unknown>
  const locale = inputRecord.outputLanguage === 'en' ? 'en' : 'zh'

  const db = useAdminForInsert ? createAdminClient() : await createClient()
  const { data: gen } = await db
    .from('generations')
    .insert({
      user_id: userId,
      client_id: clientId ?? null,
      tool_type: toolType,
      locale,
      status: genStatus,
      input_data: inputRecord,
      output_data: outputData as unknown as Record<string, unknown> | null,
      ...(parentId ? { parent_id: parentId } : {}),
    })
    .select('id')
    .single()

  if (genStatus === 'failed') {
    return NextResponse.json({ error: 'Generation failed', detail: lastError }, { status: 502 })
  }

  // Fire-and-forget self-notification email (does not block the response)
  if (gen?.id && process.env.RESEND_API_KEY && !useAdminForInsert) {
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/email/notify-self`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify({ genId: gen.id, toolType, locale }),
    }).catch(() => {})
  }

  return NextResponse.json({ id: gen?.id ?? null, output: outputData })
}
