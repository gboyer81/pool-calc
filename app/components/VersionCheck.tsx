'use client'

import { useEffect, useState } from 'react'

export default function VersionCheck() {
  const [timestamp, setTimestamp] = useState<string>('')

  useEffect(() => {
    // Only set timestamp after component mounts (client-side only)
    setTimestamp(new Date().toLocaleString())
  }, [])

  const forceRefresh = () => {
    const randomParam = 'v=' + Date.now()
    const currentUrl = window.location.href.split('?')[0]
    window.location.href = `${currentUrl}?${randomParam}`
  }

  return (
    <div className='flex flex-row flex-nowrap items-center justify-center gap-1.5 mb-0 px-2 py-0.5 max-w-screen-lg mx-auto rounded-md text-[12.5px] text-gray-500'>
      <div>
        <strong>Version 1.1</strong>
      </div>
      <div>|</div>
      <div>Updated: August 18th, 2025</div>
      <div>|</div>
      <div>
        <span id='cacheTimestamp'>
          {timestamp ? ` Loaded: ${timestamp}` : ''}
        </span>
      </div>
      <div>
        <button
          onClick={forceRefresh}
          className='ml-2.5 px-0.5 py-0.5 text-xs bg-gray-200 border border-input rounded cursor-pointer hover:bg-gray-300 hover:border-gray-400 transition-colors'
          title="Force refresh if you don't see the latest features">
          🔄
        </button>
      </div>
    </div>
  )
}
