'use client'

import React from 'react'

interface ClientFiltersProps {
  clientTypeFilter: 'all' | 'retail' | 'service' | 'maintenance'
  frequencyFilter: 'all' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  viewMode: 'table' | 'grid'
  filteredCount: number
  totalCount: number
  onClientTypeChange: (
    value: 'all' | 'retail' | 'service' | 'maintenance'
  ) => void
  onFrequencyChange: (
    value: 'all' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  ) => void
  onViewModeChange: (value: 'table' | 'grid') => void
  onClearFilters: () => void
  onResetFilters: () => void
}

const ClientFilters: React.FC<ClientFiltersProps> = ({
  clientTypeFilter,
  frequencyFilter,
  viewMode,
  filteredCount,
  totalCount,
  onClientTypeChange,
  onFrequencyChange,
  onViewModeChange,
  onClearFilters,
  onResetFilters,
}) => {
  return (
    <div className='bg-background dark:bg-muted rounded-lg shadow mb-6 p-6'>
      {/* Filters row - responsive grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
            Client Type
          </label>
          <select
            value={clientTypeFilter}
            onChange={(e) => onClientTypeChange(e.target.value as any)}
            className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
            <option value='all'>All Types</option>
            <option value='retail'>Retail</option>
            <option value='service'>Service</option>
            <option value='maintenance'>Maintenance</option>
          </select>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
            Service Frequency
          </label>
          <select
            value={frequencyFilter}
            onChange={(e) => onFrequencyChange(e.target.value as any)}
            className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
            <option value='all'>All Frequencies</option>
            <option value='twice-weekly'>Twice Weekly</option>
            <option value='weekly'>Weekly</option>
            <option value='bi-weekly'>Bi-weekly</option>
            <option value='monthly'>Monthly</option>
          </select>
        </div>

        {/* View Mode - moves to new row on mobile */}
        <div className='sm:col-span-2 lg:col-span-1 flex flex-col'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
            View Mode
          </label>
          <div className='flex space-x-1 bg-background p-1 rounded-lg w-fit'>
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-muted shadow-sm'
                  : 'hover:bg-muted/50'
              }`}>
              Table
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-muted shadow-sm' : 'hover:bg-muted/50'
              }`}>
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Bottom row - mobile responsive */}
      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-4 border-t border-border'>
        <div className='text-sm text-muted-foreground'>
          Showing {filteredCount} of {totalCount} clients
        </div>
        <div className='flex gap-2'>
          <button
            onClick={onClearFilters}
            className='px-3 py-2 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors'>
            Clear Filters
          </button>
          <button
            onClick={onResetFilters}
            className='px-3 py-2 text-xs bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors'>
            Reset All
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientFilters
