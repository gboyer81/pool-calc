'use client'

import React from 'react'
import {
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'

interface SummaryStatsProps {
  stats: {
    completedJobs: number
    revenue: number
    followUpsDue: number
    overdueAmount: number
  }
  timeFilter: string
  loading?: boolean
}

const SummaryStats: React.FC<SummaryStatsProps> = ({
  stats,
  timeFilter,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='bg-gray-100 p-4 rounded-lg border'>
            <div className='animate-pulse'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-8 bg-gray-200 rounded w-1/2'></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <div className='bg-blue-50 p-4 rounded-lg border border-blue-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-blue-700 text-sm font-medium'>
              Completed Jobs
            </p>
            <p className='text-2xl font-bold text-blue-900'>
              {stats.completedJobs}
            </p>
          </div>
          <CheckCircle className='w-8 h-8 text-blue-600' />
        </div>
      </div>
      <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-green-700 text-sm font-medium'>
              Revenue ({timeFilter.replace('days', 'd')})
            </p>
            <p className='text-2xl font-bold text-green-900'>
              ${stats.revenue.toLocaleString()}
            </p>
          </div>
          <DollarSign className='w-8 h-8 text-green-600' />
        </div>
      </div>
      <div className='bg-yellow-50 p-4 rounded-lg border border-yellow-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-yellow-700 text-sm font-medium'>
              Follow-ups Due
            </p>
            <p className='text-2xl font-bold text-yellow-900'>
              {stats.followUpsDue}
            </p>
          </div>
          <AlertTriangle className='w-8 h-8 text-yellow-600' />
        </div>
      </div>
      <div className='bg-red-50 p-4 rounded-lg border border-red-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-red-700 text-sm font-medium'>
              Overdue Bills
            </p>
            <p className='text-2xl font-bold text-red-900'>
              ${stats.overdueAmount.toLocaleString()}
            </p>
          </div>
          <XCircle className='w-8 h-8 text-red-600' />
        </div>
      </div>
    </div>
  )
}

export default SummaryStats