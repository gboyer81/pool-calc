'use client'

import React, { useState, useEffect, ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function ClientOnly({
  children,
  fallback,
}: ClientOnlyProps): React.ReactElement {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</> || <div>Loading...</div>
  }

  return <>{children}</>
}
