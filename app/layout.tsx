import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Quiet Time',
  description: 'A daily spiritual journal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dawn">
      <body>{children}</body>
    </html>
  )
}
