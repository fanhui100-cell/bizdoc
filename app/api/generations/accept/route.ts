import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_ADDRESS } from '@/lib/email/resend'
import type { QuoteOutput } from '@/lib/types'

// POST /api/generations/accept
// Public — no auth. Body: { genId, acceptorName, acceptorEmail }
export async function POST(req: NextRequest) {
  const { genId, acceptorName, acceptorEmail } = await req.json() as {
    genId: string
    acceptorName: string
    acceptorEmail: string
  }

  if (!genId || !acceptorEmail) {
    return NextResponse.json({ error: 'genId and acceptorEmail are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: gen } = await admin
    .from('generations')
    .select('tool_type, output_data, status, user_id, client_id, accepted_at, locale')
    .eq('id', genId)
    .single()

  if (!gen || gen.status !== 'completed' || gen.tool_type !== 'quote') {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }
  if (gen.accepted_at) {
    return NextResponse.json({ error: 'already_accepted' }, { status: 409 })
  }

  const now = new Date().toISOString()
  await admin.from('generations').update({
    accepted_at: now,
    acceptor_name: acceptorName || null,
    acceptor_email: acceptorEmail,
  }).eq('id', genId)

  await admin.from('document_events').insert({
    generation_id: genId,
    user_id: gen.user_id,
    client_id: gen.client_id ?? null,
    event_type: 'quote_accepted',
    actor_email: acceptorEmail,
    actor_name: acceptorName || null,
  })

  // Fetch owner profile + company for email
  const [{ data: profile }, { data: company }] = await Promise.all([
    admin.from('users_profile').select('email, full_name').eq('id', gen.user_id).single(),
    admin.from('company_profiles').select('company_name').eq('user_id', gen.user_id).single(),
  ])

  const zh = (gen.locale ?? 'en') === 'zh'
  const output = gen.output_data as QuoteOutput
  const viewUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/view/${genId}`
  const ownerEmail = profile?.email
  const senderName = company?.company_name ?? profile?.full_name ?? 'BizDoc AI User'

  if (ownerEmail && process.env.RESEND_API_KEY) {
    const resend = getResend()

    // Notify owner
    const ownerSubject = zh
      ? `🎉 你的报价单已被客户接受`
      : `🎉 Your quote has been accepted`
    const ownerHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
      <h2 style="margin:0 0 8px">${ownerSubject}</h2>
      <p style="color:#6B7280">${zh
        ? `客户 <strong>${acceptorName || acceptorEmail}</strong> 已于 ${new Date(now).toLocaleDateString('zh-CN')} 接受了报价单《${output.title}》。`
        : `<strong>${acceptorName || acceptorEmail}</strong> accepted your quote "<strong>${output.title}</strong>" on ${new Date(now).toLocaleDateString('en-US')}.`
      }</p>
      <a href="${viewUrl}" style="display:inline-block;margin-top:16px;background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
        ${zh ? '查看报价单' : 'View Quote'}
      </a>
    </body></html>`

    // Confirmation to acceptor
    const clientSubject = zh
      ? `已确认接受报价单：${output.title}`
      : `Quote Accepted: ${output.title}`
    const clientHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
      <h2 style="margin:0 0 8px">${zh ? '感谢确认' : 'Thank you for your confirmation'}</h2>
      <p style="color:#6B7280">${zh
        ? `您已成功接受来自 <strong>${senderName}</strong> 的报价单《${output.title}》，我们将尽快与您联系。`
        : `You've successfully accepted the quote "<strong>${output.title}</strong>" from <strong>${senderName}</strong>. We'll be in touch shortly.`
      }</p>
      <a href="${viewUrl}" style="display:inline-block;margin-top:16px;background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
        ${zh ? '查看报价单' : 'View Quote'}
      </a>
    </body></html>`

    await Promise.all([
      resend.emails.send({ from: FROM_ADDRESS, to: ownerEmail, subject: ownerSubject, html: ownerHtml }),
      resend.emails.send({ from: FROM_ADDRESS, to: acceptorEmail, subject: clientSubject, html: clientHtml }),
    ]).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
