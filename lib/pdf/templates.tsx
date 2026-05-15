import 'server-only'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'
import { ensureFontsRegistered, getFontFamily, getFontBold } from './fonts'

ensureFontsRegistered()

const FONT   = getFontFamily()
const BOLD   = getFontBold()

const s = StyleSheet.create({
  page:      { fontFamily: FONT, fontSize: 9, padding: 48, color: '#111827', lineHeight: 1.4 },
  watermark: { position: 'absolute', top: 260, left: 60, fontSize: 52, color: '#E5E7EB',
               fontFamily: BOLD, transform: 'rotate(-30deg)', opacity: 0.5 },
  h1:        { fontSize: 18, fontFamily: BOLD, marginBottom: 4 },
  h2:        { fontSize: 11, fontFamily: BOLD, marginBottom: 2 },
  muted:     { color: '#6B7280' },
  row:       { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 5 },
  thRow:     { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingBottom: 4, marginBottom: 2 },
  th:        { fontFamily: BOLD, color: '#6B7280', fontSize: 8 },
  cell:      { flex: 3 },
  cellSm:    { flex: 1, textAlign: 'right' },
  totals:    { alignItems: 'flex-end', marginTop: 8, gap: 2 },
  totalLine: { flexDirection: 'row', gap: 16 },
  totalKey:  { color: '#6B7280', width: 80, textAlign: 'right' },
  totalVal:  { width: 80, textAlign: 'right' },
  bold:      { fontFamily: BOLD },
  dl:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  dt:        { fontFamily: BOLD, marginBottom: 1 },
  dd:        { color: '#374151' },
  notes:     { marginTop: 12, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#E5E7EB', color: '#6B7280' },
  section:   { marginBottom: 14 },
  divider:   { borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', marginVertical: 10 },
})

function fmt(n: number, currency: string) {
  return `${currency} ${Number(n).toFixed(2)}`
}

function Watermark() {
  return <Text style={s.watermark}>BIZDOC AI FREE</Text>
}

export function QuotePDF({ data, watermark }: { data: QuoteOutput; watermark: boolean }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {watermark && <Watermark />}
        <View style={s.section}>
          <Text style={s.h1}>{data.title}</Text>
          {data.intro ? <Text style={[s.muted, { marginTop: 4 }]}>{data.intro}</Text> : null}
        </View>

        <View style={s.section}>
          <View style={s.thRow}>
            <Text style={[s.th, s.cell]}>Item</Text>
            <Text style={[s.th, s.cellSm]}>Qty</Text>
            <Text style={[s.th, s.cellSm]}>Unit Price</Text>
            <Text style={[s.th, s.cellSm]}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.row}>
              <View style={s.cell}>
                <Text style={s.bold}>{item.name}</Text>
                {item.description ? <Text style={[s.muted, { fontSize: 8 }]}>{item.description}</Text> : null}
              </View>
              <Text style={s.cellSm}>{item.quantity}</Text>
              <Text style={s.cellSm}>{fmt(item.unitPrice, data.currency)}</Text>
              <Text style={s.cellSm}>{fmt(item.amount, data.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text style={s.totalKey}>Subtotal</Text>
            <Text style={s.totalVal}>{fmt(data.subtotal, data.currency)}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={[s.totalKey, s.bold]}>Total</Text>
            <Text style={[s.totalVal, s.bold]}>{fmt(data.total, data.currency)}</Text>
          </View>
        </View>

        <View style={s.divider} />
        <View style={s.dl}>
          {data.paymentTerms  ? <View><Text style={s.dt}>Payment</Text><Text style={s.dd}>{data.paymentTerms}</Text></View>  : null}
          {data.deliveryTerms ? <View><Text style={s.dt}>Delivery</Text><Text style={s.dd}>{data.deliveryTerms}</Text></View> : null}
          {data.validUntil    ? <View><Text style={s.dt}>Valid Until</Text><Text style={s.dd}>{data.validUntil}</Text></View> : null}
        </View>
        {data.notes ? <Text style={s.notes}>{data.notes}</Text> : null}
      </Page>
    </Document>
  )
}

export function InvoicePDF({ data, watermark }: { data: InvoiceOutput; watermark: boolean }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {watermark && <Watermark />}
        <View style={s.section}>
          <Text style={s.h1}>{data.invoiceTitle}</Text>
          <Text style={[s.muted, { marginTop: 2 }]}>#{data.invoiceNumber}</Text>
        </View>

        <View style={[s.dl, s.section]}>
          <View><Text style={s.dt}>From</Text><Text style={s.dd}>{data.seller}</Text></View>
          <View><Text style={s.dt}>To</Text><Text style={s.dd}>{data.buyer}</Text></View>
          <View><Text style={s.dt}>Issued</Text><Text style={s.dd}>{data.issueDate}</Text></View>
          <View><Text style={s.dt}>Due</Text><Text style={s.dd}>{data.dueDate}</Text></View>
        </View>

        <View style={s.section}>
          <View style={s.thRow}>
            <Text style={[s.th, s.cell]}>Item</Text>
            <Text style={[s.th, s.cellSm]}>Qty</Text>
            <Text style={[s.th, s.cellSm]}>Unit Price</Text>
            <Text style={[s.th, s.cellSm]}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.row}>
              <View style={s.cell}>
                <Text style={s.bold}>{item.name}</Text>
                {item.description ? <Text style={[s.muted, { fontSize: 8 }]}>{item.description}</Text> : null}
              </View>
              <Text style={s.cellSm}>{item.quantity}</Text>
              <Text style={s.cellSm}>{fmt(item.unitPrice, data.currency)}</Text>
              <Text style={s.cellSm}>{fmt(item.amount, data.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalLine}>
            <Text style={s.totalKey}>Subtotal</Text>
            <Text style={s.totalVal}>{fmt(data.subtotal, data.currency)}</Text>
          </View>
          {data.tax > 0 && (
            <View style={s.totalLine}>
              <Text style={s.totalKey}>Tax</Text>
              <Text style={s.totalVal}>{fmt(data.tax, data.currency)}</Text>
            </View>
          )}
          <View style={s.totalLine}>
            <Text style={[s.totalKey, s.bold]}>Total</Text>
            <Text style={[s.totalVal, s.bold]}>{fmt(data.total, data.currency)}</Text>
          </View>
        </View>

        <View style={s.divider} />
        <View style={s.dl}>
          {data.paymentMethod ? <View><Text style={s.dt}>Payment Method</Text><Text style={s.dd}>{data.paymentMethod}</Text></View> : null}
          {data.paymentTerms  ? <View><Text style={s.dt}>Terms</Text><Text style={s.dd}>{data.paymentTerms}</Text></View>          : null}
        </View>
        {data.notes ? <Text style={s.notes}>{data.notes}</Text> : null}
      </Page>
    </Document>
  )
}

export function EmailPDF({ data, watermark }: { data: EmailOutput; watermark: boolean }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {watermark && <Watermark />}
        <View style={s.section}>
          <Text style={s.muted}>Subject</Text>
          <Text style={[s.h2, { marginTop: 2 }]}>{data.subject}</Text>
        </View>
        <View style={s.divider} />
        <Text style={{ lineHeight: 1.6 }}>{data.body}</Text>
        {data.shortVersion ? (
          <>
            <View style={[s.divider, { marginTop: 20 }]} />
            <Text style={[s.muted, { marginBottom: 6 }]}>Short Version</Text>
            <Text>{data.shortVersion}</Text>
          </>
        ) : null}
      </Page>
    </Document>
  )
}
