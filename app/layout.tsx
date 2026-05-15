import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })

export const metadata: Metadata = {
  title: {
    default: 'BizDoc AI / 企文助手',
    template: '%s | BizDoc AI',
  },
  description: 'AI-powered quote, invoice and business email generator for small businesses.',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={geist.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  )
}
