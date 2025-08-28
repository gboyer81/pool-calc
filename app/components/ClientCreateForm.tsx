'use client'

import React from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface ClientFormData {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  retail: {
    pricingTier: 'standard'
    taxExempt: boolean
    paymentTerms: 'net-30'
    creditLimit: number | undefined
  }
  service: {
    laborRates: {
      standard: number
      emergency: number
    }
    serviceTypes: string[]
    emergencyService: {
      enabled: boolean
      afterHours: boolean
    }
  }
  maintenance: {
    serviceFrequency: 'weekly'
    serviceDay: string
    specialInstructions: string
    accessInstructions: {
      gateCode: string
      keyLocation: string
      dogOnProperty: boolean
      specialAccess: string
    }
    maintenancePreferences: {
      cleaningIntensity: 'standard'
      chemicalBalance: 'standard'
      equipmentMonitoring: 'comprehensive'
    }
  }
}

interface ClientCreateFormProps {
  isOpen: boolean
  clientType: 'retail' | 'service' | 'maintenance'
  formData: ClientFormData
  formErrors: Record<string, string>
  saving: boolean
  onFormChange: (field: string, value: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}

const ClientCreateForm: React.FC<ClientCreateFormProps> = ({
  isOpen,
  clientType,
  formData,
  formErrors,
  saving,
  onFormChange,
  onSubmit,
  onClose,
}) => {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4'>
      <div className='bg-background rounded-lg p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <Breadcrumb className='mb-4'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href='/dashboard'>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href='/clients'>Client Management</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Create Client</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <h3 className='text-lg font-semibold mb-4'>
          Create {clientType.charAt(0).toUpperCase() + clientType.slice(1)} Client
        </h3>

        <form onSubmit={onSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Client Name *
              </label>
              <input
                type='text'
                value={formData.name}
                onChange={(e) => onFormChange('name', e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                required
              />
              {formErrors.name && (
                <p className='text-red-500 text-xs mt-1'>{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Email *
              </label>
              <input
                type='email'
                value={formData.email}
                onChange={(e) => onFormChange('email', e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                required
              />
              {formErrors.email && (
                <p className='text-red-500 text-xs mt-1'>{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Phone *
              </label>
              <input
                type='tel'
                value={formData.phone}
                onChange={(e) => onFormChange('phone', e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                required
              />
              {formErrors.phone && (
                <p className='text-red-500 text-xs mt-1'>{formErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Address Information */}
          <div>
            <h4 className='text-md font-semibold mb-3'>Address</h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='md:col-span-2'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  Street Address *
                </label>
                <input
                  type='text'
                  value={formData.address.street}
                  onChange={(e) => onFormChange('address.street', e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>
              
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  City *
                </label>
                <input
                  type='text'
                  value={formData.address.city}
                  onChange={(e) => onFormChange('address.city', e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  State *
                </label>
                <input
                  type='text'
                  value={formData.address.state}
                  onChange={(e) => onFormChange('address.state', e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  ZIP Code *
                </label>
                <input
                  type='text'
                  value={formData.address.zipCode}
                  onChange={(e) => onFormChange('address.zipCode', e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>
            </div>
          </div>

          {/* Client Type Specific Fields */}
          {clientType === 'maintenance' && (
            <div>
              <h4 className='text-md font-semibold mb-3'>Maintenance Settings</h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                    Service Frequency
                  </label>
                  <select
                    value={formData.maintenance.serviceFrequency}
                    onChange={(e) => onFormChange('maintenance.serviceFrequency', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
                    <option value='twice-weekly'>Twice Weekly</option>
                    <option value='weekly'>Weekly</option>
                    <option value='bi-weekly'>Bi-weekly</option>
                    <option value='monthly'>Monthly</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                    Service Day
                  </label>
                  <select
                    value={formData.maintenance.serviceDay}
                    onChange={(e) => onFormChange('maintenance.serviceDay', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
                    <option value='Monday'>Monday</option>
                    <option value='Tuesday'>Tuesday</option>
                    <option value='Wednesday'>Wednesday</option>
                    <option value='Thursday'>Thursday</option>
                    <option value='Friday'>Friday</option>
                    <option value='Saturday'>Saturday</option>
                    <option value='Sunday'>Sunday</option>
                  </select>
                </div>
              </div>

              <div className='mt-4'>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                  Special Instructions
                </label>
                <textarea
                  value={formData.maintenance.specialInstructions}
                  onChange={(e) => onFormChange('maintenance.specialInstructions', e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                  rows={3}
                  placeholder='Any special instructions for service...'
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className='flex justify-end space-x-4 pt-6 border-t border-border'>
            <button
              type='button'
              onClick={onClose}
              disabled={saving}
              className='px-6 py-2 text-muted-foreground border border-input rounded-lg hover:bg-muted/50 disabled:opacity-50'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'>
              {saving ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClientCreateForm