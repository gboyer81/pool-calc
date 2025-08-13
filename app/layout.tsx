import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pacer Pool Calculator',
  description: 'A simple calculator for pool chemicals.',
  metadataBase: new URL('http://localhost:3000'), // Replace with your domain
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <head>
        {/* Cache control meta tags - these need to be in head, not metadata export */}
        <meta
          httpEquiv='Cache-Control'
          content='no-cache, no-store, must-revalidate'
        />
        <meta httpEquiv='Pragma' content='no-cache' />
        <meta httpEquiv='Expires' content='0' />
        <meta name='cache-control' content='max-age=0' />
        <meta name='version' content='2.1.20241207' />
        <meta name='last-modified' content='2025-08-07' />
      </head>
      <body
        className='max-w-4xl mx-auto p-5 bg-gradient-to-r from-[var(--primarybg)] to-[var(--secondarybg)] min-h-screen'
        suppressHydrationWarning>
        <div className='container mx-auto'>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
