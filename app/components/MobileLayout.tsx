import React from 'react'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function MobileLayout({
  children,
  title,
  subtitle,
  actions,
  className = '',
}: MobileLayoutProps) {
  return (
    <div className={`w-full max-w-full overflow-x-hidden ${className}`}>
      {/* Header section with responsive design */}
      {(title || subtitle || actions) && (
        <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-6 mb-4 sm:mb-6'>
          <div className='min-w-0 flex-1'>
            {title && (
              <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate'>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className='text-sm sm:text-base text-gray-600 mt-1 break-words'>
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0'>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Main content with mobile-first responsive wrapper */}
      <div className='w-full max-w-full overflow-x-hidden'>{children}</div>
    </div>
  )
}

// Mobile-optimized table wrapper
interface MobileTableProps {
  children: React.ReactNode
  title?: string
  className?: string
}

export function MobileTable({
  children,
  title,
  className = '',
}: MobileTableProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
      {title && (
        <div className='px-3 sm:px-6 py-4 border-b border-gray-200'>
          <h2 className='text-base sm:text-lg font-semibold text-gray-900'>
            {title}
          </h2>
        </div>
      )}
      <div className='overflow-x-auto'>
        <div className='min-w-full inline-block align-middle'>{children}</div>
      </div>
    </div>
  )
}

// Mobile-optimized button group
interface MobileButtonGroupProps {
  children: React.ReactNode
  className?: string
  stackOnMobile?: boolean
}

export function MobileButtonGroup({
  children,
  className = '',
  stackOnMobile = true,
}: MobileButtonGroupProps) {
  const flexClass = stackOnMobile
    ? 'flex flex-col sm:flex-row'
    : 'flex flex-row flex-wrap'

  return (
    <div className={`${flexClass} gap-2 sm:gap-3 ${className}`}>{children}</div>
  )
}

// Mobile-optimized form grid
interface MobileFormGridProps {
  children: React.ReactNode
  columns?: {
    mobile: number
    tablet: number
    desktop: number
  }
  className?: string
}

export function MobileFormGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
  className = '',
}: MobileFormGridProps) {
  const gridClass = `grid grid-cols-${columns.mobile} sm:grid-cols-${columns.tablet} lg:grid-cols-${columns.desktop}`

  return (
    <div className={`${gridClass} gap-3 sm:gap-6 w-full ${className}`}>
      {children}
    </div>
  )
}

// Mobile-optimized input wrapper
interface MobileInputProps {
  label: string
  children: React.ReactNode
  required?: boolean
  error?: string
  className?: string
}

export function MobileInput({
  label,
  children,
  required = false,
  error,
  className = '',
}: MobileInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className='block text-sm font-medium text-gray-700'>
        {label}
        {required && <span className='text-red-500 ml-1'>*</span>}
      </label>
      {children}
      {error && <p className='text-sm text-red-600 break-words'>{error}</p>}
    </div>
  )
}
