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

        {/* Hydration Fix Script - Runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Remove the attribute if it exists on page load
                function removeColorZillaAttribute() {
                  if (document.body && document.body.hasAttribute('cz-shortcut-listen')) {
                    document.body.removeAttribute('cz-shortcut-listen');
                  }
                }
                
                // Run immediately
                removeColorZillaAttribute();
                
                // Set up MutationObserver to catch future additions
                if (typeof MutationObserver !== 'undefined') {
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      if (
                        mutation.type === 'attributes' &&
                        mutation.attributeName === 'cz-shortcut-listen' &&
                        mutation.target === document.body
                      ) {
                        document.body.removeAttribute('cz-shortcut-listen');
                      }
                    });
                  });
                  
                  // Start observing once DOM is ready
                  function startObserver() {
                    if (document.body) {
                      observer.observe(document.body, {
                        attributes: true,
                        attributeFilter: ['cz-shortcut-listen']
                      });
                    }
                  }
                  
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', startObserver);
                  } else {
                    startObserver();
                  }
                }
              })();
            `,
          }}
        />
      </head>
      <body className='antialiased'>
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          <PrimeReactProvider>
            {/* Navigation Component handles the complete layout structure including footer */}
            <Navigation>{children}</Navigation>
            <Toaster position="top-right" richColors />
          </PrimeReactProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
