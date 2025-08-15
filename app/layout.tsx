// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Navigation from './components/Navigation'
import Footer from './components/Footer'

export const metadata: Metadata = {
  title: 'Pool Service Pro',
  description: 'Professional pool service management and chemical calculator.',
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
        {/* Cache control meta tags */}
        <meta
          httpEquiv='Cache-Control'
          content='no-cache, no-store, must-revalidate'
        />
        <meta httpEquiv='Pragma' content='no-cache' />
        <meta httpEquiv='Expires' content='0' />
        <meta name='cache-control' content='max-age=0' />
        <meta name='version' content='3.0.20241208' />
        <meta name='last-modified' content='2025-08-14' />
      </head>
      <body
        className='min-h-screen bg-white antialiased'
        suppressHydrationWarning>
        {/* Navigation Component */}
        <Navigation />

        {/* Main Content */}
        <div className='min-h-screen p-5'>
          <div className='container mx-auto bg-white rounded-4xl min-h-[calc(100vh-2.5rem)]'>
            <main className='p-6'>{children}</main>
          </div>
        </div>

        {/* Footer Component */}
        <Footer />
      </body>
    </html>
  )
}
