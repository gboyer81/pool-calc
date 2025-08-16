import React from 'react'

export default function Footer() {
  return (
    <footer className='bg-white border-t border-gray-200 mt-8'>
      <div className='max-w-screen-2xl mx-auto px-4 py-6'>
        <div className='flex flex-col md:flex-row justify-between items-center'>
          <div className='text-sm text-gray-600'>
            © 2025 Pool Service Pro.{' '}
            <span className='text-xs'>
              Professional pool maintenance management.
            </span>
          </div>
          <div className='flex items-center space-x-4 mt-2 md:mt-0'>
            <span className='text-xs text-gray-500'>
              Version 3.1 • Built with Next.js & MongoDB
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
