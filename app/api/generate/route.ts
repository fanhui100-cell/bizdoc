import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AnthropicProvider } from '@/lib/ai/anthropic'
import { buildPrompt, SYSTEM_PROMPTS } from '@/lib/ai/prompts'
import { extractJSON } from '@/lib/ai/json-extract'
import { consumeQuota, QuotaExceededError } from '@/lib/quota'
import type { ToolType, ToolInput } from '@/lib/ai/prompts'

const ai = new AnthropicProvider()

const VALID_TOOL_TYPES = new Set<string>(['quote', 'invoice', 'email'])
const MAX_STRING_LENGTH = 500
const MAX_ITEMS = 20

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

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let toolType: ToolType
  let input: ToolInput

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
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    await consumeQuota()
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return NextResponse.json({ error: 'quota_exceeded' }, { status: 429 })
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }

  let outputData: unknown = null
  let genStatus: 'completed' | 'failed' = 'failed'

  try {
    const raw = await ai.generate(SYSTEM_PROMPTS[toolType], buildPrompt(toolType, input))
    outputData = extractJSON(raw)
    genStatus = 'completed'
  } catch {
    // quota already consumed — log the failure and return 502
  }

  const { data: gen } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      tool_type: toolType,
      status: genStatus,
      input_data: input as unknown as Record<string, unknown>,
      output_data: outputData as unknown as Record<string, unknown> | null,
    })
    .select('id')
    .single()

  if (genStatus === 'failed') {
    return NextResponse.json({ error: 'Generation failed' }, { status: 502 })
  }

  return NextResponse.json({ id: gen?.id ?? null, output: outputData })
}
