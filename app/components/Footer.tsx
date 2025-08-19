'use client'

import React, { useState, useEffect } from 'react'

export default function Footer() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className='sticky bottom-0 bg-white border-t border-gray-200 mt-8'>
      <div className='max-w-screen-2xl mx-auto px-4 py-6'>
        <div className='flex flex-col md:flex-row justify-between items-center'>
          <div className='text-sm text-gray-600'>
            © 2025 Pool Service Pro.{' '}
            <span className='hidden md:inline text-xs'>
              Professional pool maintenance management.
            </span>
          </div>
          <div className='hidden md:flex items-center space-x-2 text-xs text-gray-500'>
            <div className='truncate'>
              Current Time: {currentTime.toLocaleTimeString()}
            </div>
          </div>
          <div className='flex items-center space-x-4 mt-2 md:mt-0'>
            <span className='text-xs text-gray-500'>
              Version 1.1.0 • Built with Next.js & MongoDB
            </span>
            <div className='flex items-center space-x-2 text-xs text-green-600'>
              <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse'></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
