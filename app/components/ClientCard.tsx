'use client'

import React from 'react'
import {
  ShoppingCart,
  Wrench,
  Calendar,
  Users,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Client,
  isRetailClient,
  isServiceClient,
  isMaintenanceClient,
} from '@/types/pool-service'

interface ClientCardProps {
  client: Client
  onViewPools?: (client: Client) => void
  onEdit?: (client: Client) => void
}

const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onViewPools,
  onEdit,
}) => {
  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'retail':
        return <ShoppingCart className='h-6 w-6 text-green-600' />
      case 'service':
        return <Wrench className='h-6 w-6 text-orange-600' />
      case 'maintenance':
        return <Calendar className='h-6 w-6 text-blue-600' />
      default:
        return <Users className='h-6 w-6 text-gray-600' />
    }
  }

  return (
    <div className='bg-background border border-border rounded-lg p-4 hover:shadow-lg transition-shadow duration-200 flex flex-col'>
      {/* Client Header */}
      <div className='flex items-start justify-between mb-3'>
        <div className='flex items-center gap-3'>
          <div className='flex-shrink-0'>
            {getClientTypeIcon(client.clientType)}
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='font-semibold text-sm text-foreground truncate'>
              {client.name}
            </h3>
            <p className='text-xs text-muted-foreground truncate'>
              {client.address.city}, {client.address.state}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant={client.isActive ? "default" : "destructive"}>
          {client.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Client Type Badge */}
      <div className='mb-3'>
        <Badge 
          variant="outline" 
          className={
            client.clientType === 'retail'
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
              : client.clientType === 'service'
              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
              : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300'
          }>
          <div className='flex items-center gap-1'>
            {client.clientType === 'retail' && <ShoppingCart className="h-3 w-3" />}
            {client.clientType === 'service' && <Wrench className="h-3 w-3" />}
            {client.clientType === 'maintenance' && <Calendar className="h-3 w-3" />}
            <span className="capitalize">{client.clientType}</span>
          </div>
        </Badge>
      </div>

      {/* Contact Info */}
      <div className='space-y-1 mb-4'>
        <div className='flex items-center gap-2 text-xs'>
          <span className='text-muted-foreground'>📞</span>
          <span className='text-foreground truncate'>
            {client.phone}
          </span>
        </div>
        <div className='flex items-center gap-2 text-xs'>
          <span className='text-muted-foreground'>📧</span>
          <span className='text-foreground truncate'>
            {client.email}
          </span>
        </div>
      </div>

      {/* Additional Info for Different Client Types */}
      <div className='mb-4'>
        {isRetailClient(client) && (
          <div className='text-xs text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <ShoppingCart className='h-3 w-3' />
              Retail Customer
            </span>
          </div>
        )}
        {isServiceClient(client) && (
          <div className='text-xs text-muted-foreground'>
            <span className='flex items-center gap-1'>
              <Wrench className='h-3 w-3' />
              Service Customer
            </span>
          </div>
        )}
        {isMaintenanceClient(client) && (
          <div className='flex items-center gap-2 text-xs'>
            <Calendar className='h-3 w-3 text-muted-foreground' />
            <span className='text-muted-foreground'>Service:</span>
            <span className='text-foreground capitalize'>
              {client.maintenance.serviceFrequency.replace(
                '-',
                ' '
              )}
            </span>
          </div>
        )}
      </div>

      {/* Action Buttons - Always at bottom */}
      <div className='flex gap-2 pt-2 border-t border-border mt-auto'>
        {isMaintenanceClient(client) && onViewPools && (
          <button
            onClick={() => onViewPools(client)}
            className='flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-md transition-colors'>
            View Pools
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(client)}
            className='flex-1 text-xs px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30 rounded-md transition-colors'>
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

export default ClientCard