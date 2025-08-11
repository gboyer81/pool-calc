'use client'

export default function VersionCheck() {
  const now = new Date()
  const timestamp = now.toLocaleString()

  const forceRefresh = () => {
    const randomParam = 'v=' + Date.now()
    const currentUrl = window.location.href.split('?')[0]
    window.location.href = `${currentUrl}?${randomParam}`
  }

  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: '0',
        padding: '4px',
        background: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '0.8em',
        color: '#666',
      }}>
      <strong>Version 2.1</strong> | Updated: August 8th, 2025 |
      <span id='cacheTimestamp'> Loaded: {timestamp}</span>
      <button
        onClick={forceRefresh}
        style={{
          marginLeft: '10px',
          padding: '2px 8px',
          fontSize: '10px',
          background: '#e9ecef',
          border: '1px solid #ced4da',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        title="Force refresh if you don't see the latest features">
        🔄
      </button>
    </div>
  )
}
