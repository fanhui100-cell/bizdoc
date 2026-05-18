# BizDoc AI Deployment

Production domain: `bizdoc-ai.com`

Recommended platform: Vercel, because this app is a Next.js 16 app with serverless API routes and cron.

## DNS

In Vercel, add:

```text
bizdoc-ai.com
www.bizdoc-ai.com
```

Then follow Vercel's DNS instructions for your registrar. Typical records:

```text
A      @     76.76.21.21
CNAME  www   cname.vercel-dns.com
```

Use the exact records Vercel shows in the project domain screen if they differ.

## Environment Variables

Production values:

```bash
NEXT_PUBLIC_SITE_URL=https://bizdoc-ai.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=claude-haiku-4-5-20251001
ADMIN_EMAILS=
RESEND_API_KEY=
RESEND_FROM=BizDoc AI <noreply@bizdoc-ai.com>
CRON_SECRET=
NEXT_PUBLIC_WHATSAPP_PHONE=
```

## Supabase

Run `supabase/schema.sql` in Supabase SQL Editor. Existing projects should also run the migration comments near the bottom, including:

```sql
ALTER TABLE clients ADD COLUMN IF NOT EXISTS portal_expires_at timestamptz DEFAULT (now() + interval '90 days');
UPDATE clients SET portal_expires_at = now() + interval '90 days' WHERE portal_expires_at IS NULL;
```

## Verify

After deployment:

```bash
curl -I https://bizdoc-ai.com
curl https://bizdoc-ai.com/robots.txt
curl https://bizdoc-ai.com/sitemap.xml
```
