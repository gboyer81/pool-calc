'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Activity, Info } from 'lucide-react'

export default function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className='shrink-0 border-t bg-sidebar/5 backdrop-blur-sm'>
      <div className='px-4 py-3'>
        {/* Desktop Layout */}
        <div className='hidden md:flex items-center justify-between text-xs'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <span>© 2025 Pool Service Pro</span>
            </div>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <Activity className='h-3 w-3 text-green-500' />
              <span className='text-green-600'>System Online</span>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1.5 text-muted-foreground'>
              <Clock className='h-3 w-3' />
              <span suppressHydrationWarning>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <div className='text-muted-foreground'>
              <span>v2.1.0</span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className='md:hidden space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Info className='h-3 w-3' />
              <span>© 2025 Pool Service Pro</span>
            </div>
            <div className='flex items-center gap-1.5 text-xs'>
              <Activity className='h-3 w-3 text-green-500' />
              <span className='text-green-600'>Online</span>
            </div>
          </div>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <div className='flex items-center gap-1.5'>
              <Clock className='h-3 w-3' />
              <span suppressHydrationWarning>
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            <span>v1.9.1</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
