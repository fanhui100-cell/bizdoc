import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

// POST /api/company-profile/logo  (multipart/form-data, field: logo)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('logo') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, WebP or SVG.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 })
  }

  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1]
  const path = `logos/${user.id}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('company-assets')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('company-assets')
    .getPublicUrl(path)

  // Bust CDN cache by appending timestamp
  const logoUrl = `${publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
    .from('company_profiles')
    .upsert({ user_id: user.id, logo_url: logoUrl }, { onConflict: 'user_id' })

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ logoUrl })
}

// DELETE /api/company-profile/logo
export async function DELETE(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Remove all possible extensions
  for (const ext of ['png', 'jpg', 'jpeg', 'webp', 'svg']) {
    await supabase.storage.from('company-assets').remove([`logos/${user.id}.${ext}`])
  }

  await supabase
    .from('company_profiles')
    .update({ logo_url: null })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
