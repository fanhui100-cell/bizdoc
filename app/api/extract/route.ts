import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { extractJSON } from '@/lib/ai/json-extract'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = process.env.AI_MODEL ?? 'claude-haiku-4-5-20251001'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'text/csv',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
])

const SYSTEM_PROMPT = `You are a data extraction assistant. Extract business document data from the provided file and return ONLY a JSON object with no extra text.`

function buildUserPrompt(toolType: string): string {
  if (toolType === 'quote') {
    return `Extract quote/quotation data from this document and return JSON with these fields (omit any field not found):
{
  "companyName": "seller/your company name",
  "clientName": "buyer/client name",
  "currency": "currency code like USD, CNY, EUR",
  "items": [{"name": "item name", "description": "optional description", "quantity": 1, "unitPrice": 100}],
  "deliveryTime": "delivery terms or lead time",
  "validUntil": "validity date in YYYY-MM-DD format if possible",
  "notes": "any additional notes or terms"
}`
  }
  return `Extract invoice data from this document and return JSON with these fields (omit any field not found):
{
  "sellerName": "seller/issuer company name",
  "buyerName": "buyer/recipient company name",
  "invoiceNumber": "invoice number",
  "currency": "currency code like USD, CNY, EUR",
  "items": [{"name": "item name", "description": "optional description", "quantity": 1, "unitPrice": 100}],
  "paymentMethod": "payment method",
  "paymentTerms": "payment terms",
  "notes": "any additional notes"
}`
}

async function extractFromText(text: string, toolType: string): Promise<unknown> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `${buildUserPrompt(toolType)}\n\nDocument content:\n${text.slice(0, 8000)}` }],
  })
  const raw = (message.content.find((b) => b.type === 'text') as Anthropic.TextBlock | undefined)?.text ?? ''
  return extractJSON(raw)
}

async function extractFromPdf(base64: string, toolType: string): Promise<unknown> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: base64 },
          } as Anthropic.DocumentBlockParam,
          { type: 'text', text: buildUserPrompt(toolType) },
        ],
      },
    ],
  })
  const raw = (message.content.find((b) => b.type === 'text') as Anthropic.TextBlock | undefined)?.text ?? ''
  return extractJSON(raw)
}

async function parseExcel(buffer: ArrayBuffer): Promise<string> {
  // Dynamic import to keep the bundle lean
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames.slice(0, 3)) {
    const sheet = workbook.Sheets[sheetName]
    lines.push(`Sheet: ${sheetName}`)
    lines.push(XLSX.utils.sheet_to_csv(sheet))
  }
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, 'extract')
  if (!rateLimit.ok) return rateLimitResponse(rateLimit)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const toolType = formData.get('toolType') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!toolType || !['quote', 'invoice'].includes(toolType)) {
    return NextResponse.json({ error: 'Invalid toolType' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type. Use PDF, Excel, or CSV.' }, { status: 415 })
  }

  try {
    let extracted: unknown

    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      extracted = await extractFromPdf(base64, toolType)
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    ) {
      const arrayBuffer = await file.arrayBuffer()
      const text = await parseExcel(arrayBuffer)
      extracted = await extractFromText(text, toolType)
    } else {
      // CSV or plain text
      const text = await file.text()
      extracted = await extractFromText(text, toolType)
    }

    return NextResponse.json({ data: extracted })
  } catch {
    return NextResponse.json({ error: 'Extraction failed. Please check the file and try again.' }, { status: 500 })
  }
}
