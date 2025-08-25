'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { FollowUpResponse as FollowUp } from '@/types/pool-service'

interface FollowupVisitsProps {
  followUps: FollowUp[]
  loading?: boolean
  onScheduleFollowUp?: (followUpId: string) => void
}

const FollowupVisits: React.FC<FollowupVisitsProps> = ({
  followUps,
  loading = false,
  onScheduleFollowUp,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'low':
        return 'text-green-700 bg-green-100 border-green-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const handleScheduleFollowUp = async (followUpId: string) => {
    if (onScheduleFollowUp) {
      onScheduleFollowUp(followUpId)
    }
  }

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border'>
        <div className='p-6 border-b'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Follow-up Visits Required
            </h2>
            <AlertTriangle className='w-5 h-5 text-yellow-500' />
          </div>
        </div>
        <div className='p-6'>
          <div className='animate-pulse space-y-4'>
            {[...Array(2)].map((_, i) => (
              <div key={i} className='h-24 bg-gray-200 rounded'></div>
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
            Follow-up Visits Required
          </h2>
          <AlertTriangle className='w-5 h-5 text-yellow-500' />
        </div>
      </div>
      <div className='divide-y'>
        {followUps.length > 0 ? (
          followUps.map((followUp) => (
            <div
              key={followUp._id}
              className='p-6 hover:bg-gray-50 transition-colors'>
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {followUp.clientName}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    {followUp.followUpType}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                    followUp.priority
                  )}`}>
                  {followUp.priority}
                </span>
              </div>
              <div className='grid grid-cols-2 gap-4 text-sm mb-3'>
                <div>
                  <p className='text-gray-500'>Due Date</p>
                  <p className='font-medium'>
                    {followUp.dueDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500'>Original Visit</p>
                  <p className='font-medium'>
                    {followUp.originalVisitDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className='text-sm text-gray-600 mb-3'>
                {followUp.notes}
              </p>
              <div className='flex justify-between items-center'>
                <span className='text-xs text-gray-500'>
                  Tech: {followUp.originalTechnician}
                </span>
                <button
                  onClick={() => handleScheduleFollowUp(followUp._id)}
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                  Schedule
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className='p-6 text-center text-gray-500'>
            No follow-up visits required.
          </div>
        )}
      </div>
    </div>
  )
}

export default FollowupVisits