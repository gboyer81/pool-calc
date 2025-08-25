'use client'

import React from 'react'
import {
  ClipboardList,
  Wrench,
  Truck,
  ChevronRight,
} from 'lucide-react'
import type { ServiceVisit } from '@/types/pool-service'

interface RecentlyCompletedJobsProps {
  jobs: ServiceVisit[]
  loading?: boolean
}

const RecentlyCompletedJobs: React.FC<RecentlyCompletedJobsProps> = ({
  jobs,
  loading = false,
}) => {
  const getServiceTypeIcon = (serviceType: string) => {
    if (serviceType.includes('maintenance')) {
      return <ClipboardList className='w-4 h-4 text-blue-600' />
    } else if (serviceType.includes('service')) {
      return <Wrench className='w-4 h-4 text-orange-600' />
    } else if (serviceType.includes('retail')) {
      return <Truck className='w-4 h-4 text-green-600' />
    }
    return <ClipboardList className='w-4 h-4 text-gray-600' />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'pending':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'overdue':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'paid':
        return 'text-green-700 bg-green-100 border-green-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className='lg:col-span-2 bg-white rounded-lg shadow-sm border'>
        <div className='p-6 border-b'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Recently Completed Jobs
            </h2>
          </div>
        </div>
        <div className='p-6'>
          <div className='animate-pulse space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-20 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='lg:col-span-2 bg-white rounded-lg shadow-sm border'>
      <div className='p-6 border-b'>
        <div className='flex justify-between items-center'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Recently Completed Jobs
          </h2>
          <button className='text-blue-600 hover:text-blue-800 flex items-center gap-1'>
            View All <ChevronRight className='w-4 h-4' />
          </button>
        </div>
      </div>
      <div className='divide-y'>
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div
              key={job._id.toString()}
              className='p-6 hover:bg-gray-50 transition-colors'>
              <div className='flex justify-between items-start mb-3'>
                <div className='flex items-center gap-3'>
                  {getServiceTypeIcon(job.serviceType)}
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      {job.client?.name || 'Unknown Client'}
                    </h3>
                    <p className='text-sm text-gray-500'>
                      {job.client?.address?.street},{' '}
                      {job.client?.address?.city}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    job.billing?.paymentStatus || 'pending'
                  )}`}>
                  {job.billing?.paymentStatus || 'pending'}
                </span>
              </div>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm'>
                <div>
                  <p className='text-gray-500'>Date</p>
                  <p className='font-medium'>
                    {new Date(
                      job.actualDate || job.scheduledDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500'>Duration</p>
                  <p className='font-medium'>{job.duration || 0} min</p>
                </div>
                <div>
                  <p className='text-gray-500'>Amount</p>
                  <p className='font-medium'>
                    ${job.billing?.totalAmount || 0}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500'>Technician</p>
                  <p className='font-medium'>
                    {job.technician?.name || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='p-6 text-center text-gray-500'>
            No completed jobs found for the selected time period.
          </div>
        )}
      </div>
    </div>
  )
}

export default RecentlyCompletedJobs