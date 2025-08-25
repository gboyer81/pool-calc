'use client'

import React from 'react'
import { Package, AlertTriangle } from 'lucide-react'
import type { InventoryUsage } from '@/types/pool-service'

interface RecentInventoryUsageProps {
  inventoryUsage: InventoryUsage[]
  loading?: boolean
}

const RecentInventoryUsage: React.FC<RecentInventoryUsageProps> = ({
  inventoryUsage,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border'>
        <div className='p-6 border-b'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Recent Inventory Usage
            </h2>
            <Package className='w-5 h-5 text-gray-400' />
          </div>
        </div>
        <div className='p-6'>
          <div className='animate-pulse space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-lg shadow-sm border'>
      <div className='p-6 border-b'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Recent Inventory Usage
          </h2>
          <Package className='w-5 h-5 text-gray-400' />
        </div>
      </div>
      <div className='divide-y'>
        {inventoryUsage.length > 0 ? (
          inventoryUsage.map((item) => (
            <div key={item._id} className='p-4'>
              <div className='flex justify-between items-start mb-2'>
                <h3 className='font-medium text-gray-900'>{item.name}</h3>
                <span className='text-sm text-gray-500'>
                  ${item.totalCost.toFixed(2)}
                </span>
              </div>
              <div className='text-sm text-gray-600 space-y-1'>
                <p>
                  Used: {item.quantityUsed} {item.unit}
                </p>
                <p>
                  Stock: {item.remainingStock} {item.unit}
                </p>
                {item.remainingStock <= item.minStock && (
                  <p className='text-red-600 font-medium flex items-center gap-1'>
                    <AlertTriangle className='w-3 h-3' /> Low Stock
                  </p>
                )}
              </div>
              <div className='mt-2'>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full ${
                      item.remainingStock <= item.minStock
                        ? 'bg-red-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        (item.remainingStock / (item.minStock * 2)) * 100,
                        100
                      )}%`,
                    }}></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='p-4 text-center text-gray-500'>
            No inventory usage data available.
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentInventoryUsage