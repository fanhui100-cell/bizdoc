import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import type { QuoteOutput } from '@/lib/types'

interface Props {
  params: Promise<{ token: string }>
}

const TYPE_LABELS: Record<string, string> = {
  quote: 'Quote',
  invoice: 'Invoice',
}

const EVENT_LABELS: Record<string, string> = {
  view: 'Viewed online / 在线查看',
  pdf_download: 'Downloaded PDF / 下载 PDF',
  quote_accepted: 'Quote accepted / 接受报价',
  invoice_due_reminder: 'Due reminder sent / 到期提醒',
  invoice_overdue_reminder: 'Overdue reminder sent / 逾期提醒',
  quote_expiry_reminder: 'Quote expiry reminder / 报价到期提醒',
}

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, company, user_id, portal_expires_at')
    .eq('portal_token', token)
    .single()

  if (!client) notFound()
  if (client.portal_expires_at && new Date(client.portal_expires_at).getTime() < Date.now()) notFound()

  const { data: gens } = await admin
    .from('generations')
    .select('id, client_id, tool_type, input_data, output_data, invoice_status, created_at')
    .eq('user_id', client.user_id)
    .eq('status', 'completed')
    .in('tool_type', ['quote', 'invoice'])
    .order('created_at', { ascending: false })
    .limit(50)

  const matched = (gens ?? []).filter((g) => {
    if (g.client_id === client.id) return true
    const out = g.output_data as Record<string, unknown>
    const input = g.input_data as Record<string, unknown>
    const buyer = String(out?.buyer ?? '').toLowerCase()
    const inputClient = String(input?.clientName ?? input?.buyerName ?? '').toLowerCase()
    const clientName = client.name.toLowerCase()
    return (
      buyer.includes(clientName) ||
      inputClient.includes(clientName) ||
      clientName.includes(buyer.split(' ')[0]) ||
      clientName.includes(inputClient.split(' ')[0])
    )
  })

  const { data: events } = matched.length
    ? await admin
        .from('document_events')
        .select('generation_id, event_type, created_at')
        .in('generation_id', matched.map((g) => g.id))
        .order('created_at', { ascending: false })
        .limit(8)
    : { data: [] }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ''

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg mb-3">B</div>
          <h1 className="text-2xl font-bold text-gray-900">{client.company ?? client.name}</h1>
          <p className="text-sm text-gray-500">Client Document Portal / 客户文件门户</p>
        </div>

        {matched.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No documents found / 暂无文件</p>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
            {matched.map((gen) => {
              const out = gen.output_data as Record<string, unknown>
              const isInvoice = gen.tool_type === 'invoice'
              const title = isInvoice
                ? `Invoice #${String(out?.invoiceNumber ?? '')}`
                : String((out as unknown as QuoteOutput)?.title ?? 'Quote')
              const amount = out?.total ? `${out.currency} ${Number(out.total).toFixed(2)}` : ''
              const isPaid = gen.invoice_status === 'paid'
              const isOverdue = gen.invoice_status === 'overdue'

              return (
                <div key={gen.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-indigo-500 font-medium">{TYPE_LABELS[gen.tool_type] ?? gen.tool_type}</span>
                      <span className="text-xs text-gray-400">{new Date(gen.created_at).toLocaleDateString()}</span>
                      {amount && <span className="text-xs font-semibold text-gray-700">{amount}</span>}
                      {isPaid && <span className="text-[10px] font-medium bg-green-100 text-green-700 rounded-full px-1.5 py-0.5">Paid</span>}
                      {isOverdue && <span className="text-[10px] font-medium bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">Overdue</span>}
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3 shrink-0">
                    <a href={`${siteUrl}/view/${gen.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-medium">
                      View
                    </a>
                    <a href={`${siteUrl}/api/pdf/public/${gen.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-indigo-600 hover:underline">
                      PDF
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {events && events.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-gray-800">Recent Activity / 最近动态</p>
            <div className="space-y-2">
              {events.map((event, index) => (
                <p key={`${event.generation_id}-${event.created_at}-${index}`} className="text-xs text-gray-500">
                  {EVENT_LABELS[String(event.event_type)] ?? String(event.event_type)}
                  <span className="ml-2 text-gray-300">{new Date(event.created_at).toLocaleString()}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">
          Powered by <a href={siteUrl} className="hover:underline">BizDoc AI</a>
        </p>
      </div>
    </div>
  )
}
