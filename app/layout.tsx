// app/layout.tsx
import type { Metadata } from 'next'
import { ThemeProvider } from './components/ThemeProvider'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

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
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
  return (
    <html lang='en' suppressHydrationWarning>
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
      <body className='antialiased max-w-screen-2xl mx-auto'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {/* Navigation Component */}
          <Navigation />

          {/* Main Content */}
          <div className='container mx-auto bg-white rounded-4xl min-h-[calc(100vh-2rem)]'>
            <main className='p-6'>{children}</main>
          </div>

          {/* Footer Component */}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
