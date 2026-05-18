import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bizdoc-ai.com'),
  title: {
    default: 'BizDoc AI / 企文助手',
    template: '%s | BizDoc AI',
  },
  description: 'AI-powered quote, invoice and business email generator for small businesses.',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
