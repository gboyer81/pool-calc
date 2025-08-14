import type { Metadata } from 'next'
import Navigation from './components/Navigation'
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
        <meta name='version' content='3.2.227' />
        <meta name='last-modified' content='2025-08-13' />
      </head>
      <body
        className='min-w-screen bg-gradient-to-r from-[var(--primarybg)] to-[var(--secondarybg)] min-h-screen'
        suppressHydrationWarning>
        <Navigation />
        <div className='max-w-3xl mx-auto'>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
