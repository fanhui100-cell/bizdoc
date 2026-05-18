import 'server-only'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import type { QuoteOutput, InvoiceOutput, EmailOutput } from '@/lib/types'
import { ensureFontsRegistered, getFontFamily, getFontBold } from './fonts'

ensureFontsRegistered()

const FONT   = getFontFamily()
const BOLD   = getFontBold()

const ACCENT: Record<string, string> = {
  minimal:  '#4F46E5',
  business: '#4F46E5',
  colorful: '#0D9488',
}

const s = StyleSheet.create({
  page:        { fontFamily: FONT, fontSize: 9, padding: 48, color: '#111827', lineHeight: 1.4 },
  pageB:       { fontFamily: FONT, fontSize: 9, paddingTop: 0, paddingHorizontal: 0, paddingBottom: 48, color: '#111827', lineHeight: 1.4 },
  headerBand:  { paddingHorizontal: 48, paddingVertical: 28, marginBottom: 20 },
  headerBandContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  watermark:   { position: 'absolute', top: 260, left: 60, fontSize: 52, color: '#E5E7EB',
                 fontFamily: BOLD, transform: 'rotate(-30deg)', opacity: 0.5 },
  h1:          { fontSize: 18, fontFamily: BOLD, marginBottom: 4 },
  h1w:         { fontSize: 18, fontFamily: BOLD, marginBottom: 4, color: '#FFFFFF' },
  h2:          { fontSize: 11, fontFamily: BOLD, marginBottom: 2 },
  muted:       { color: '#6B7280' },
  mutedW:      { color: '#C7D2FE' },
  row:         { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 5 },
  thRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D1D5DB', paddingBottom: 4, marginBottom: 2 },
  th:          { fontFamily: BOLD, color: '#6B7280', fontSize: 8 },
  cell:        { flex: 3 },
  cellSm:      { flex: 1, textAlign: 'right' },
  totals:      { alignItems: 'flex-end', marginTop: 8, gap: 2 },
  totalLine:   { flexDirection: 'row', gap: 16 },
  totalKey:    { color: '#6B7280', width: 80, textAlign: 'right' },
  totalVal:    { width: 80, textAlign: 'right' },
  bold:        { fontFamily: BOLD },
  dl:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  dt:          { fontFamily: BOLD, marginBottom: 1 },
  dd:          { color: '#374151' },
  notes:       { marginTop: 12, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#E5E7EB', color: '#6B7280' },
  bankInfo:    { marginTop: 12, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: '#E5E7EB' },
  bankTitle:   { fontFamily: BOLD, fontSize: 8, color: '#6B7280', marginBottom: 3 },
  bankText:    { fontSize: 8, color: '#374151', lineHeight: 1.5 },
  section:     { marginBottom: 14 },
  sectionPad:  { marginBottom: 14, paddingHorizontal: 48 },
  divider:     { borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', marginVertical: 10 },
  accentLeft:  { borderLeftWidth: 3, paddingLeft: 8 },
})

function fmt(n: number, currency: string) {
  return `${currency} ${Number(n).toFixed(2)}`
}

function Watermark() {
  return <Text style={s.watermark}>BIZDOC AI FREE</Text>
}

export function QuotePDF({ data, watermark, logoUrl, pdfStyle = 'minimal' }: {
  data: QuoteOutput; watermark: boolean; logoUrl?: string | null; pdfStyle?: string
}) {
  const accent = ACCENT[pdfStyle] ?? ACCENT.minimal
  const hasBand = pdfStyle === 'business' || pdfStyle === 'colorful'

  const Header = () => hasBand ? (
    <View style={[s.headerBand, { backgroundColor: accent }]}>
      <View style={s.headerBandContent}>
        <View>
          <Text style={s.h1w}>{data.title}</Text>
          {data.intro ? <Text style={[s.mutedW, { marginTop: 4 }]}>{data.intro}</Text> : null}
        </View>
        {logoUrl ? <Image src={logoUrl} style={{ width: 80, height: 40, objectFit: 'contain' }} /> : null}
      </View>
    </View>
  ) : (
    <View style={[s.section, s.sectionPad, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
      <View style={pdfStyle === 'minimal' ? undefined : [s.accentLeft, { borderLeftColor: accent }]}>
        <Text style={s.h1}>{data.title}</Text>
        {data.intro ? <Text style={[s.muted, { marginTop: 4 }]}>{data.intro}</Text> : null}
      </View>
      {logoUrl ? <Image src={logoUrl} style={{ width: 80, height: 40, objectFit: 'contain' }} /> : null}
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={hasBand ? s.pageB : s.page}>
        {watermark && <Watermark />}
        <Header />

        <View style={[s.section, hasBand ? s.sectionPad : {}]}>
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

        <View style={[s.totals, hasBand ? { paddingHorizontal: 48 } : {}]}>
          <View style={s.totalLine}>
            <Text style={s.totalKey}>Subtotal</Text>
            <Text style={s.totalVal}>{fmt(data.subtotal, data.currency)}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={[s.totalKey, s.bold]}>Total</Text>
            <Text style={[s.totalVal, s.bold]}>{fmt(data.total, data.currency)}</Text>
          </View>
        </View>

        <View style={[s.divider, hasBand ? { marginHorizontal: 48 } : {}]} />
        <View style={[s.dl, hasBand ? { paddingHorizontal: 48 } : {}]}>
          {data.paymentTerms  ? <View><Text style={s.dt}>Payment</Text><Text style={s.dd}>{data.paymentTerms}</Text></View>  : null}
          {data.deliveryTerms ? <View><Text style={s.dt}>Delivery</Text><Text style={s.dd}>{data.deliveryTerms}</Text></View> : null}
          {data.validUntil    ? <View><Text style={s.dt}>Valid Until</Text><Text style={s.dd}>{data.validUntil}</Text></View> : null}
        </View>
        {data.notes ? <Text style={[s.notes, hasBand ? { marginHorizontal: 48 } : {}]}>{data.notes}</Text> : null}
      </Page>
    </Document>
  )
}

export function InvoicePDF({ data, watermark, logoUrl, bankInfo, pdfStyle = 'minimal' }: {
  data: InvoiceOutput; watermark: boolean; logoUrl?: string | null; bankInfo?: string | null; pdfStyle?: string
}) {
  const accent = ACCENT[pdfStyle] ?? ACCENT.minimal
  const hasBand = pdfStyle === 'business' || pdfStyle === 'colorful'

  const Header = () => hasBand ? (
    <View style={[s.headerBand, { backgroundColor: accent }]}>
      <View style={s.headerBandContent}>
        <View>
          <Text style={s.h1w}>{data.invoiceTitle}</Text>
          <Text style={[s.mutedW, { marginTop: 2 }]}>#{data.invoiceNumber}</Text>
        </View>
        {logoUrl ? <Image src={logoUrl} style={{ width: 80, height: 40, objectFit: 'contain' }} /> : null}
      </View>
    </View>
  ) : (
    <View style={[s.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
      <View>
        <Text style={s.h1}>{data.invoiceTitle}</Text>
        <Text style={[s.muted, { marginTop: 2 }]}>#{data.invoiceNumber}</Text>
      </View>
      {logoUrl ? <Image src={logoUrl} style={{ width: 80, height: 40, objectFit: 'contain' }} /> : null}
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={hasBand ? s.pageB : s.page}>
        {watermark && <Watermark />}
        <Header />

        <View style={[s.dl, s.section, hasBand ? s.sectionPad : {}]}>
          <View><Text style={s.dt}>From</Text><Text style={s.dd}>{data.seller}</Text></View>
          <View><Text style={s.dt}>To</Text><Text style={s.dd}>{data.buyer}</Text></View>
          <View><Text style={s.dt}>Issued</Text><Text style={s.dd}>{data.issueDate}</Text></View>
          <View><Text style={s.dt}>Due</Text><Text style={s.dd}>{data.dueDate}</Text></View>
        </View>

        <View style={[s.section, hasBand ? s.sectionPad : {}]}>
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

        <View style={[s.totals, hasBand ? { paddingHorizontal: 48 } : {}]}>
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

        <View style={[s.divider, hasBand ? { marginHorizontal: 48 } : {}]} />
        <View style={[s.dl, hasBand ? { paddingHorizontal: 48 } : {}]}>
          {data.paymentMethod ? <View><Text style={s.dt}>Payment Method</Text><Text style={s.dd}>{data.paymentMethod}</Text></View> : null}
          {data.paymentTerms  ? <View><Text style={s.dt}>Terms</Text><Text style={s.dd}>{data.paymentTerms}</Text></View>          : null}
        </View>
        {data.notes ? <Text style={[s.notes, hasBand ? { marginHorizontal: 48 } : {}]}>{data.notes}</Text> : null}
        {bankInfo ? (
          <View style={[s.bankInfo, hasBand ? { marginHorizontal: 48 } : {}]}>
            <Text style={s.bankTitle}>PAYMENT ACCOUNT DETAILS</Text>
            <Text style={s.bankText}>{bankInfo}</Text>
          </View>
        ) : null}
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

export function ReceiptPDF({ data, paymentDate }: { data: InvoiceOutput; paymentDate: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={[s.section, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
          <View>
            <Text style={[s.h1, { color: '#16A34A' }]}>PAYMENT RECEIPT</Text>
            <Text style={s.muted}>收款收据</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.bold, { fontSize: 11 }]}>RCPT-{data.invoiceNumber}</Text>
            <Text style={[s.muted, { fontSize: 8, marginTop: 2 }]}>Invoice Ref: #{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Parties + Dates */}
        <View style={[s.section, { flexDirection: 'row', gap: 24 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.muted, { fontSize: 8 }]}>RECEIVED FROM / 付款方</Text>
            <Text style={[s.bold, { marginTop: 3 }]}>{data.buyer}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.muted, { fontSize: 8 }]}>RECEIVED BY / 收款方</Text>
            <Text style={[s.bold, { marginTop: 3 }]}>{data.seller}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.muted, { fontSize: 8 }]}>PAYMENT DATE / 收款日期</Text>
            <Text style={[s.bold, { marginTop: 3 }]}>{paymentDate}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={s.section}>
          <View style={s.thRow}>
            <Text style={[s.th, s.cell]}>Description</Text>
            <Text style={[s.th, s.cellSm]}>Qty</Text>
            <Text style={[s.th, s.cellSm]}>Unit Price</Text>
            <Text style={[s.th, s.cellSm]}>Amount</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={s.row}>
              <View style={s.cell}>
                <Text>{item.name}</Text>
                {item.description ? <Text style={[s.muted, { fontSize: 8 }]}>{item.description}</Text> : null}
              </View>
              <Text style={s.cellSm}>{item.quantity}</Text>
              <Text style={s.cellSm}>{fmt(item.unitPrice, data.currency)}</Text>
              <Text style={s.cellSm}>{fmt(item.amount, data.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totals}>
          {data.tax > 0 && (
            <View style={s.totalLine}>
              <Text style={s.totalKey}>Subtotal</Text>
              <Text style={s.totalVal}>{fmt(data.subtotal, data.currency)}</Text>
            </View>
          )}
          {data.tax > 0 && (
            <View style={s.totalLine}>
              <Text style={s.totalKey}>Tax</Text>
              <Text style={s.totalVal}>{fmt(data.tax, data.currency)}</Text>
            </View>
          )}
          <View style={[s.totalLine, { borderTopWidth: 1, borderTopColor: '#111827', paddingTop: 4 }]}>
            <Text style={[s.totalKey, s.bold]}>TOTAL PAID</Text>
            <Text style={[s.totalVal, s.bold]}>{fmt(data.total, data.currency)}</Text>
          </View>
        </View>

        {/* PAID stamp */}
        <View style={{ position: 'absolute', top: 200, right: 48, transform: 'rotate(15deg)', opacity: 0.15 }}>
          <Text style={{ fontSize: 60, fontFamily: BOLD, color: '#16A34A' }}>PAID</Text>
        </View>

        <View style={s.divider} />
        <Text style={[s.muted, { fontSize: 8, textAlign: 'center' }]}>
          Thank you for your payment · 感谢您的付款
        </Text>
      </Page>
    </Document>
  )
}
