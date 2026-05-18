import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getResend, FROM_ADDRESS } from '@/lib/email/resend'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = getResend()
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const in3Days = new Date(today.getTime() + 3 * 864e5).toISOString().slice(0, 10)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  let sent = 0

  // ── 1. Invoices due in 3 days (pending → reminded) ──────────────
  const { data: upcoming } = await admin
    .from('generations')
    .select('id, user_id, output_data, locale')
    .eq('tool_type', 'invoice')
    .eq('status', 'completed')
    .eq('invoice_status', 'pending')

  for (const gen of upcoming ?? []) {
    const out = gen.output_data as Record<string, unknown>
    const dueDate = out?.dueDate as string | undefined
    if (!dueDate || dueDate > in3Days || dueDate <= todayStr) continue

    const [{ data: profile }] = await Promise.all([
      admin.from('users_profile').select('email').eq('id', gen.user_id).single(),
    ])
    if (!profile?.email) continue
    const zh = (gen.locale ?? 'zh') === 'zh'
    const invoiceNumber = String(out?.invoiceNumber ?? '')
    const buyer = String(out?.buyer ?? '')
    const total = Number(out?.total ?? 0)
    const currency = String(out?.currency ?? 'USD')
    const subject = zh
      ? `📅 Invoice #${invoiceNumber} 即将到期（${dueDate}）`
      : `📅 Invoice #${invoiceNumber} is due on ${dueDate}`
    const html = buildReminderEmail({ subject, zh, invoiceNumber, buyer, total, currency, dueDate, viewUrl: `${siteUrl}/view/${gen.id}`, type: 'upcoming' })
    try {
      await resend.emails.send({ from: FROM_ADDRESS, to: profile.email, subject, html })
      await admin.from('generations').update({ invoice_status: 'reminded' }).eq('id', gen.id)
      await admin.from('document_events').insert({
        generation_id: gen.id,
        user_id: gen.user_id,
        event_type: 'invoice_due_reminder',
        metadata: { dueDate },
      })
      sent++
    } catch { /* continue */ }
  }

  // ── 2. Overdue invoices (pending/reminded → overdue) ──────────────
  const { data: overdue } = await admin
    .from('generations')
    .select('id, user_id, output_data, locale')
    .eq('tool_type', 'invoice')
    .eq('status', 'completed')
    .in('invoice_status', ['pending', 'reminded'])

  for (const gen of overdue ?? []) {
    const out = gen.output_data as Record<string, unknown>
    const dueDate = out?.dueDate as string | undefined
    if (!dueDate || dueDate >= todayStr) continue

    const { data: profile } = await admin.from('users_profile').select('email').eq('id', gen.user_id).single()
    if (!profile?.email) continue
    const zh = (gen.locale ?? 'zh') === 'zh'
    const invoiceNumber = String(out?.invoiceNumber ?? '')
    const buyer = String(out?.buyer ?? '')
    const total = Number(out?.total ?? 0)
    const currency = String(out?.currency ?? 'USD')
    const subject = zh
      ? `⚠️ Invoice #${invoiceNumber} 已逾期未付`
      : `⚠️ Invoice #${invoiceNumber} is overdue`
    const html = buildReminderEmail({ subject, zh, invoiceNumber, buyer, total, currency, dueDate, viewUrl: `${siteUrl}/view/${gen.id}`, type: 'overdue' })
    try {
      await resend.emails.send({ from: FROM_ADDRESS, to: profile.email, subject, html })
      await admin.from('generations').update({ invoice_status: 'overdue' }).eq('id', gen.id)
      await admin.from('document_events').insert({
        generation_id: gen.id,
        user_id: gen.user_id,
        event_type: 'invoice_overdue_reminder',
        metadata: { dueDate },
      })
      sent++
    } catch { /* continue */ }
  }

  // ── 3. Quote expiry reminders (within 2 days) ──────────────
  const in2Days = new Date(today.getTime() + 2 * 864e5).toISOString().slice(0, 10)
  const { data: quotes } = await admin
    .from('generations')
    .select('id, user_id, output_data, locale')
    .eq('tool_type', 'quote')
    .eq('status', 'completed')

  for (const gen of quotes ?? []) {
    const out = gen.output_data as Record<string, unknown>
    const validUntil = out?.validUntil as string | undefined
    if (!validUntil || validUntil < todayStr || validUntil > in2Days) continue

    const { data: reminderEvent } = await admin
      .from('document_events')
      .select('id')
      .eq('generation_id', gen.id)
      .eq('event_type', 'quote_expiry_reminder')
      .single()
    if (reminderEvent) continue

    const { data: profile } = await admin.from('users_profile').select('email').eq('id', gen.user_id).single()
    if (!profile?.email) continue
    const zh = (gen.locale ?? 'zh') === 'zh'
    const title = String(out?.title ?? 'Quote')
    const total = Number(out?.total ?? 0)
    const currency = String(out?.currency ?? 'USD')
    const subject = zh
      ? `⏰ 报价单「${title}」即将到期（${validUntil}）`
      : `⏰ Quote "${title}" expires on ${validUntil}`
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
      <h2>${subject}</h2>
      <p>${zh
        ? `你的报价单「<strong>${title}</strong>」将于 <strong>${validUntil}</strong> 到期，金额 <strong>${currency} ${total.toFixed(2)}</strong>。请尽快跟进客户确认。`
        : `Your quote "<strong>${title}</strong>" for <strong>${currency} ${total.toFixed(2)}</strong> expires on <strong>${validUntil}</strong>. Follow up with your client now.`
      }</p>
      <a href="${siteUrl}/view/${gen.id}" style="display:inline-block;margin-top:16px;background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
        ${zh ? '查看报价单' : 'View Quote'}
      </a>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
      <p style="font-size:12px;color:#9CA3AF">${zh ? '此为系统自动提醒。' : 'Automated reminder from BizDoc AI.'}</p>
    </body></html>`
    try {
      await resend.emails.send({ from: FROM_ADDRESS, to: profile.email, subject, html })
      await admin.from('document_events').insert({
        generation_id: gen.id,
        user_id: gen.user_id,
        event_type: 'quote_expiry_reminder',
        metadata: { validUntil },
      })
      sent++
    } catch { /* continue */ }
  }

  return NextResponse.json({ ok: true, sent })
}

function buildReminderEmail(p: {
  subject: string; zh: boolean; invoiceNumber: string; buyer: string
  total: number; currency: string; dueDate: string; viewUrl: string; type: 'upcoming' | 'overdue'
}) {
  const { zh, invoiceNumber, buyer, total, currency, dueDate, viewUrl, type } = p
  const bodyText = zh
    ? type === 'upcoming'
      ? `来自客户 <strong>${buyer}</strong> 的 Invoice #${invoiceNumber} 将于 <strong>${dueDate}</strong> 到期，金额 <strong>${currency} ${total.toFixed(2)}</strong>，请提醒客户及时付款。`
      : `来自客户 <strong>${buyer}</strong> 的 Invoice #${invoiceNumber} 已于 <strong>${dueDate}</strong> 到期，金额 <strong>${currency} ${total.toFixed(2)}</strong>，目前仍未付款。`
    : type === 'upcoming'
      ? `Invoice #${invoiceNumber} from <strong>${buyer}</strong> is due on <strong>${dueDate}</strong> for <strong>${currency} ${total.toFixed(2)}</strong>. Consider sending a reminder to your client.`
      : `Invoice #${invoiceNumber} from <strong>${buyer}</strong> was due on <strong>${dueDate}</strong> for <strong>${currency} ${total.toFixed(2)}</strong> and remains unpaid.`
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
    <h2 style="color:${type === 'overdue' ? '#DC2626' : '#D97706'}">${p.subject}</h2>
    <p>${bodyText}</p>
    <a href="${viewUrl}" style="display:inline-block;margin-top:16px;background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
      ${zh ? '查看 Invoice' : 'View Invoice'}
    </a>
    <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
    <p style="font-size:12px;color:#9CA3AF">${zh ? '此为系统自动提醒。' : 'Automated reminder from BizDoc AI.'}</p>
  </body></html>`
}
