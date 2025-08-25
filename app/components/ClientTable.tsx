'use client'

import React from 'react'
import {
  ShoppingCart,
  Wrench,
  Calendar,
  Users,
} from 'lucide-react'
import {
  Client,
  isMaintenanceClient,
} from '@/types/pool-service'

interface ClientTableProps {
  clients: Client[]
  onViewPools?: (client: Client) => void
  onEdit?: (client: Client) => void
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
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
    <div className='overflow-x-auto'>
      <table className='min-w-full divide-y divide-border'>
        <thead className='bg-muted/50'>
          <tr>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Client
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Type
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Contact
            </th>
            <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Status
            </th>
            <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className='bg-background divide-y divide-border'>
          {clients.map((client) => (
            <tr key={client._id.toString()}>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='flex items-center'>
                  {getClientTypeIcon(client.clientType)}
                  <div className='ml-4'>
                    <div className='text-sm font-medium text-foreground'>
                      {client.name}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {client.address.city}, {client.address.state}
                    </div>
                  </div>
                </div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    client.clientType === 'retail'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : client.clientType === 'service'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  }`}>
                  {client.clientType}
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <div className='text-sm text-foreground'>
                  {client.phone}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {client.email}
                </div>
              </td>
              <td className='px-6 py-4 whitespace-nowrap'>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                {isMaintenanceClient(client) && onViewPools && (
                  <button
                    onClick={() => onViewPools(client)}
                    className='text-blue-600 hover:text-blue-900 mr-3'>
                    View Pools
                  </button>
                )}
                {onEdit && (
                  <button 
                    onClick={() => onEdit(client)}
                    className='text-green-600 hover:text-green-900'>
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ClientTable