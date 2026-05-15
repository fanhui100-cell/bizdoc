export type Locale = 'zh' | 'en'

export type Plan = 'free' | 'pro' | 'business'

export interface UserProfile {
  id: string
  email: string | null
  full_name: string | null
  locale: Locale
  plan: Plan
  quota_monthly: number
  quota_used: number
  quota_reset_at: string | null
  expires_at: string | null
  created_at: string
}

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  payment_terms: string | null
  currency: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  email: string | null
  company: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface Generation {
  id: string
  user_id: string
  tool_type: 'quote' | 'invoice' | 'email'
  locale: Locale
  status: 'generating' | 'completed' | 'failed'
  input_data: Record<string, unknown>
  output_data: QuoteOutput | InvoiceOutput | EmailOutput | null
  created_at: string
}

// ── AI output schemas ──────────────────────────────────────────

export interface LineItem {
  name: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export interface QuoteOutput {
  title: string
  intro: string
  items: LineItem[]
  subtotal: number
  total: number
  currency: string
  paymentTerms: string
  deliveryTerms: string
  validUntil: string
  notes: string
}

export interface InvoiceOutput {
  invoiceTitle: string
  invoiceNumber: string
  seller: string
  buyer: string
  issueDate: string
  dueDate: string
  items: LineItem[]
  subtotal: number
  tax: number
  total: number
  currency: string
  paymentMethod: string
  paymentTerms: string
  notes: string
}

export interface EmailOutput {
  subject: string
  body: string
  shortVersion: string
  formalVersion: string
}
