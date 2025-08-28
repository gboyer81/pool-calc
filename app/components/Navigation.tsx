'use client'

import React from 'react'
import Footer from '@/components/Footer'
import { ModeToggle } from '@/components/ModeToggle'

import { AppSidebar } from '@/components/app-sidebar'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'


export default function Navigation({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <SidebarProvider 
      style={{ 
        '--sidebar-width': '21.5rem',
        '--sidebar-width-icon': '3rem'
      } as React.CSSProperties}
    >
      <AppSidebar />
      <SidebarInset>
        <div className='flex flex-col h-screen min-h-screen overflow-hidden'>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <SidebarTrigger />
            <div className='flex-1' />
            {/* Additional header content can be added here */}
            {/* For collapsed sidebar state, show theme toggle in header */}
            <div className='mr-3'>
              <ModeToggle />
            </div>
          </header>

          {/* Main content area - now scrollable with custom scrollbar */}
          <main className='flex-1 bg-background overflow-y-auto scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600'>
            <div className='p-4 pb-6'>
              {children}
            </div>
          </main>

          {/* Footer moved outside of main content - now sticky */}
          <Footer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
