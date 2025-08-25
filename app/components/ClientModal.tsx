'use client'

import React from 'react'
import {
  ShoppingCart,
  Wrench,
  Calendar,
  Users,
} from 'lucide-react'

interface ClientModalProps {
  isOpen: boolean
  selectedClientType: 'retail' | 'service' | 'maintenance'
  onClientTypeChange: (type: 'retail' | 'service' | 'maintenance') => void
  onClose: () => void
  onContinue: () => void
}

const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  selectedClientType,
  onClientTypeChange,
  onClose,
  onContinue,
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

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50'>
      <div className='bg-background rounded-lg p-6 w-full max-w-md'>
        <h3 className='text-lg font-semibold mb-4'>Add New Client</h3>

        <div className='mb-4'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
            Client Type
          </label>
          <select
            value={selectedClientType}
            onChange={(e) => onClientTypeChange(e.target.value as any)}
            className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
            <option value='maintenance'>Maintenance Client</option>
            <option value='service'>Service Client</option>
            <option value='retail'>Retail Client</option>
          </select>
        </div>

        <div className='flex items-center space-x-4 p-4 bg-muted/50 rounded-lg mb-4'>
          {getClientTypeIcon(selectedClientType)}
          <div>
            <div className='font-medium'>
              {selectedClientType === 'maintenance' &&
                'Pool Maintenance Service'}
              {selectedClientType === 'service' &&
                'Equipment Service & Repair'}
              {selectedClientType === 'retail' && 'Product Sales & Supply'}
            </div>
            <div className='text-sm text-muted-foreground'>
              {selectedClientType === 'maintenance' &&
                'Regular pool cleaning and chemical balancing'}
              {selectedClientType === 'service' &&
                'Equipment repairs, installations, and emergency services'}
              {selectedClientType === 'retail' &&
                'Chemical and equipment sales with custom pricing'}
            </div>
          </div>
        </div>

        <div className='flex justify-end space-x-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-muted-foreground border border-input rounded-lg hover:bg-muted/50'>
            Cancel
          </button>
          <button
            onClick={onContinue}
            className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientModal