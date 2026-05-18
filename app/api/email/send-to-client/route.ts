import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADDRESS } from '@/lib/email/resend'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'

// POST /api/email/send-to-client
// Body: { genId, recipientEmail, recipientName?, message? }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { genId, recipientEmail, recipientName, message } = await req.json() as {
    genId: string
    recipientEmail: string
    recipientName?: string
    message?: string
  }

  if (!genId || !recipientEmail) {
    return NextResponse.json({ error: 'genId and recipientEmail are required' }, { status: 400 })
  }

  const { data: gen } = await supabase
    .from('generations')
    .select('tool_type, output_data, status, locale')
    .eq('id', genId)
    .eq('user_id', user.id)
    .single()

  if (!gen || gen.status !== 'completed' || !gen.output_data) {
    return NextResponse.json({ error: 'Generation not found' }, { status: 404 })
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const senderName = profile?.full_name ?? profile?.email ?? 'BizDoc AI User'
  const zh = gen.locale === 'zh'
  const viewUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/view/${genId}`
  const pdfUrl  = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/api/pdf/public/${genId}`

  let subject = ''
  let bodyHtml = ''

  const output = gen.output_data as Record<string, unknown>

  if (gen.tool_type === 'quote') {
    const q = output as unknown as QuoteOutput
    subject = zh ? `报价单：${q.title}` : `Quotation: ${q.title}`
    bodyHtml = buildDocEmail({ senderName, recipientName, subject, viewUrl, pdfUrl, message, zh })
  } else if (gen.tool_type === 'invoice') {
    const inv = output as unknown as InvoiceOutput
    subject = zh ? `Invoice #${inv.invoiceNumber}` : `Invoice #${inv.invoiceNumber}`
    bodyHtml = buildDocEmail({ senderName, recipientName, subject, viewUrl, pdfUrl, message, zh })
  } else {
    const em = output as unknown as EmailOutput
    subject = em.subject
    bodyHtml = `<p>${em.body.replace(/\n/g, '<br/>')}</p>`
  }

  try {
    const resend = getResend()
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: recipientEmail,
      subject,
      html: bodyHtml,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Send failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

function buildDocEmail({ senderName, recipientName, subject, viewUrl, pdfUrl, message, zh }: {
  senderName: string; recipientName?: string; subject: string
  viewUrl: string; pdfUrl: string; message?: string; zh: boolean
}) {
  const greeting = recipientName
    ? (zh ? `您好，${recipientName}，` : `Hi ${recipientName},`)
    : (zh ? '您好，' : 'Hello,')

  const intro = message
    ? `<p>${message}</p>`
    : zh
      ? `<p>请查阅附件文书，如有任何问题欢迎随时联系。</p>`
      : `<p>Please find the document linked below. Feel free to reach out if you have any questions.</p>`

  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
  <p>${greeting}</p>
  <p style="font-weight:600">${subject}</p>
  ${intro}
  <div style="margin:24px 0;display:flex;gap:12px">
    <a href="${viewUrl}" style="background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
      ${zh ? '在线查看' : 'View Online'}
    </a>
    <a href="${pdfUrl}" style="background:white;color:#374151;padding:10px 20px;border-radius:8px;border:1px solid #D1D5DB;text-decoration:none;font-size:14px">
      ${zh ? '下载 PDF' : 'Download PDF'}
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
  <p style="font-size:12px;color:#9CA3AF">
    ${zh ? `此邮件由 ${senderName} 通过企文助手发送。` : `Sent by ${senderName} via BizDoc AI.`}
  </p>
</body>
</html>`
}
