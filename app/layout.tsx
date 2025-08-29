// app/layout.tsx
import type { Metadata } from 'next'
import { ThemeProvider } from './components/ThemeProvider'
import { PrimeReactProvider } from 'primereact/api'
import './globals.css'
import Navigation from '@/components/Navigation'
import { Toaster } from '../app/components/ui/sonner'

//import { AnimatedThemeToggler } from 'components/magicui/animated-theme-toggler'

export const metadata: Metadata = {
  title: 'Pool Service Pro',
  description: 'Professional pool service management and chemical calculator.',
  metadataBase: new URL(
    'https://pool-calc-r8bvtf4l1-gboyer81s-projects.vercel.app/'
  ),
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
      <body className='antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <PrimeReactProvider>
            {/* Navigation Component handles the complete layout structure including footer */}
            <Navigation>{children}</Navigation>
            <Toaster position='top-right' richColors />
          </PrimeReactProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
