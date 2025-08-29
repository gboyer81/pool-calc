// Create a new file: @/lib/badge-utils.tsx
import React from 'react'
import { Badge, badgeVariants } from '../app/components/ui/badge'
import { type VariantProps } from 'class-variance-authority'

type BadgeVariant = VariantProps<typeof badgeVariants>['variant']

// Role badge configurations
export const getRoleBadgeConfig = (
  role: string
): { variant: BadgeVariant; className?: string } => {
  switch (role.toLowerCase()) {
    case 'admin':
      return {
        variant: 'destructive',
        className:
          'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30',
      }
    case 'supervisor':
      return {
        variant: 'default',
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
      }
    case 'technician':
      return {
        variant: 'secondary',
        className:
          'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30',
      }
    default:
      return {
        variant: 'outline',
        className:
          'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800/30',
      }
  }
}

// Client type badge configurations
export const getClientTypeBadgeConfig = (
  clientType: string
): { variant: BadgeVariant; className?: string } => {
  switch (clientType.toLowerCase()) {
    case 'retail':
      return {
        variant: 'default',
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
      }
    case 'service':
      return {
        variant: 'secondary',
        className:
          'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/30',
      }
    case 'maintenance':
      return {
        variant: 'outline',
        className:
          'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30',
      }
    default:
      return {
        variant: 'outline',
        className:
          'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800/30',
      }
  }
}

// Service frequency badge configurations
export const getFrequencyBadgeConfig = (
  frequency: string
): { variant: BadgeVariant; className?: string } => {
  switch (frequency.toLowerCase()) {
    case 'weekly':
      return {
        variant: 'default',
        className:
          'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/30',
      }
    case 'bi-weekly':
      return {
        variant: 'secondary',
        className:
          'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/30',
      }
    case 'monthly':
      return {
        variant: 'outline',
        className:
          'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/30',
      }
    default:
      return {
        variant: 'outline',
        className:
          'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800/30',
      }
  }
}

// Status badge configurations
export const getStatusBadgeConfig = (
  status: boolean | string
): { variant: BadgeVariant; className?: string } => {
  const isActive =
    typeof status === 'boolean' ? status : status.toLowerCase() === 'active'

  if (isActive) {
    return {
      variant: 'outline',
      className:
        'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
    }
  } else {
    return {
      variant: 'outline',
      className:
        'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
    }
  }
}

// Reusable badge components
interface RoleBadgeProps {
  role: string
  className?: string
  showFullText?: boolean
}

export function RoleBadge({
  role,
  className,
  showFullText = true,
}: RoleBadgeProps) {
  const config = getRoleBadgeConfig(role)

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ''}`}>
      {showFullText
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : role.charAt(0).toUpperCase()}
    </Badge>
  )
}

interface ClientTypeBadgeProps {
  clientType: string
  className?: string
}

export function ClientTypeBadge({
  clientType,
  className,
}: ClientTypeBadgeProps) {
  const config = getClientTypeBadgeConfig(clientType)

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ''}`}>
      {clientType.charAt(0).toUpperCase() + clientType.slice(1)}
    </Badge>
  )
}

interface StatusBadgeProps {
  status: boolean | string
  className?: string
  activeText?: string
  inactiveText?: string
}

export function StatusBadge({
  status,
  className,
  activeText = 'Active',
  inactiveText = 'Inactive',
}: StatusBadgeProps) {
  const config = getStatusBadgeConfig(status)
  const isActive =
    typeof status === 'boolean' ? status : status.toLowerCase() === 'active'

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ''}`}>
      {isActive ? activeText : inactiveText}
    </Badge>
  )
}

interface FrequencyBadgeProps {
  frequency: string
  className?: string
}

export function FrequencyBadge({ frequency, className }: FrequencyBadgeProps) {
  const config = getFrequencyBadgeConfig(frequency)

  return (
    <Badge
      variant={config.variant}
      className={`${config.className} ${className || ''}`}>
      {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
    </Badge>
  )
}
