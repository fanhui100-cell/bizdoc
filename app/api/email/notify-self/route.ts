import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM_ADDRESS } from '@/lib/email/resend'

// POST /api/email/notify-self  { genId, toolType, locale }
// Called internally after a successful generation to notify the owner.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { genId, toolType, locale } = await req.json() as {
    genId: string; toolType: string; locale: string
  }

  const { data: profile } = await supabase
    .from('users_profile')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const toEmail = profile?.email ?? user.email
  if (!toEmail) return NextResponse.json({ ok: true }) // no email on record, skip silently

  const zh = locale === 'zh'
  const viewUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/view/${genId}`
  const dashUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/${locale}/dashboard`

  const TYPE_LABELS: Record<string, { zh: string; en: string }> = {
    quote:   { zh: '报价单', en: 'Quote' },
    invoice: { zh: 'Invoice', en: 'Invoice' },
    email:   { zh: '商务邮件', en: 'Email' },
  }
  const typeLabel = TYPE_LABELS[toolType]?.[zh ? 'zh' : 'en'] ?? toolType
  const subject = zh ? `✅ 你的${typeLabel}已生成` : `✅ Your ${typeLabel} is ready`

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827">
  <h2 style="margin:0 0 8px">${subject}</h2>
  <p style="color:#6B7280">
    ${zh ? `你刚通过企文助手生成了一份${typeLabel}。` : `You just generated a ${typeLabel} with BizDoc AI.`}
  </p>
  <div style="margin:24px 0;display:flex;gap:12px">
    <a href="${viewUrl}" style="background:#4F46E5;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">
      ${zh ? '查看文书' : 'View Document'}
    </a>
    <a href="${dashUrl}" style="background:white;color:#374151;padding:10px 20px;border-radius:8px;border:1px solid #D1D5DB;text-decoration:none;font-size:14px">
      ${zh ? '历史记录' : 'Dashboard'}
    </a>
  </div>
  <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
  <p style="font-size:12px;color:#9CA3AF">
    ${zh ? '如需关闭生成通知，请前往账户设置。' : 'To disable generation notifications, visit your account settings.'}
  </p>
</body>
</html>`

  try {
    const resend = getResend()
    await resend.emails.send({ from: FROM_ADDRESS, to: toEmail, subject, html })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Fail silently — don't break the main flow
  }
}
