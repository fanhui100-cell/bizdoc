import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bizdoc-ai.com'

const routes = [
  '',
  '/tools/quote',
  '/tools/invoice',
  '/tools/email',
  '/pricing',
  '/checkout',
  '/dashboard',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of ['zh', 'en']) {
    for (const route of routes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1 : 0.8,
      })
    }
  }

  return entries
}
