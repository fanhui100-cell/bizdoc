# BizDoc AI

AI document assistant for small businesses. It generates quotes, invoices, and business emails, then lets users export PDF files, send documents to clients, track quote acceptance, manage clients, and use API keys on the Business plan.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Required:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SITE_URL=https://bizdoc-ai.com
```

Optional:

```bash
RESEND_API_KEY=
RESEND_FROM=BizDoc AI <noreply@bizdoc-ai.com>
ADMIN_EMAILS=admin@example.com
CRON_SECRET=
NEXT_PUBLIC_WHATSAPP_PHONE=
```

## Database

Run `supabase/schema.sql` in Supabase SQL Editor. If the database already exists, also run the migration comments near the bottom of that file to add:

- `company_profiles.bank_info`, `company_profiles.pdf_style`
- `clients.portal_token`
- `generations.client_id`, `parent_id`, quote acceptance fields, and invoice status fields
- `api_keys`
- `document_events`

## Business API

Business users can create API keys from Account Settings. Use the key once it is revealed.

```bash
curl -X POST "$NEXT_PUBLIC_SITE_URL/api/generate" \
  -H "Authorization: Bearer biz_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "toolType": "quote",
    "input": {
      "companyName": "ABC Trading",
      "clientName": "Acme Ltd",
      "items": [{ "name": "Consulting", "quantity": 1, "unitPrice": 500 }],
      "currency": "USD",
      "deliveryTime": "7 business days",
      "validUntil": "2026-06-30",
      "notes": "",
      "outputLanguage": "en"
    }
  }'
```

The response returns `{ id, output }`. Generated documents are stored in `generations`, consume quota, and can be exported as PDF through `/api/pdf/{id}` for logged-in users.

## Production Notes

- The app uses a local/system font stack so production builds do not depend on Google Fonts network access.
- `GET /api/cron/overdue-invoices` should run daily with `Authorization: Bearer $CRON_SECRET`.
- Public document views and public PDF downloads are recorded in `document_events`.
- Production domain: `https://bizdoc-ai.com`.
- Add the domain in Vercel, then set `NEXT_PUBLIC_SITE_URL=https://bizdoc-ai.com` for all production environments.
