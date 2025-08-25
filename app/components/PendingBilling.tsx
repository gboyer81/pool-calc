'use client'

import React from 'react'
import { DollarSign } from 'lucide-react'
import type { PendingBilling as PendingBillingType } from '@/types/pool-service'

interface PendingBillingProps {
  pendingBilling: PendingBillingType[]
  loading?: boolean
  onSendReminder?: (clientId: string, invoiceNumber: string) => void
  onMarkPaid?: (visitId: string) => void
}

const PendingBilling: React.FC<PendingBillingProps> = ({
  pendingBilling,
  loading = false,
  onSendReminder,
  onMarkPaid,
}) => {
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

  const handleSendReminder = async (
    clientId: string,
    invoiceNumber: string
  ) => {
    if (onSendReminder) {
      onSendReminder(clientId, invoiceNumber)
    }
  }

  const handleMarkPaid = async (visitId: string) => {
    if (onMarkPaid) {
      onMarkPaid(visitId)
    }
  }

  if (loading) {
    return (
      <div className='bg-white rounded-lg shadow-sm border'>
        <div className='p-6 border-b'>
          <div className='flex justify-between items-center'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Incomplete Billing
            </h2>
            <DollarSign className='w-5 h-5 text-green-500' />
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
            Incomplete Billing
          </h2>
          <DollarSign className='w-5 h-5 text-green-500' />
        </div>
      </div>
      <div className='divide-y'>
        {pendingBilling.length > 0 ? (
          pendingBilling.map((bill) => (
            <div
              key={bill._id.toString()}
              className='p-6 hover:bg-gray-50 transition-colors'>
              <div className='flex justify-between items-start mb-3'>
                <div>
                  <h3 className='font-medium text-gray-900'>
                    {bill.clientName}
                  </h3>
                  <p className='text-sm text-gray-500'>
                    {bill.invoiceNumber}
                  </p>
                </div>
                <div className='text-right'>
                  <p className='font-bold text-lg'>
                    ${bill.amount.toLocaleString()}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      bill.status
                    )}`}>
                    {bill.status}
                  </span>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4 text-sm mb-3'>
                <div>
                  <p className='text-gray-500'>Visit Date</p>
                  <p className='font-medium'>
                    {bill.visitDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-gray-500'>Service Type</p>
                  <p className='font-medium capitalize'>
                    {bill.serviceType.replace('-', ' ')}
                  </p>
                </div>
              </div>
              {bill.status === 'invoiced' &&
                (bill as any).daysOverdue > 0 && (
                  <div className='bg-red-50 border border-red-200 rounded p-2 mb-3'>
                    <p className='text-red-700 text-sm font-medium'>
                      {(bill as any).daysOverdue} days overdue
                    </p>
                  </div>
                )}
              <div className='flex justify-between items-center'>
                <button
                  onClick={() =>
                    handleSendReminder(
                      bill.clientId.toString(),
                      bill.invoiceNumber || 'N/A'
                    )
                  }
                  className='text-blue-600 hover:text-blue-800 text-sm font-medium'>
                  Send Reminder
                </button>
                <button
                  onClick={() => handleMarkPaid(bill.visitIds.toString())}
                  className='text-green-600 hover:text-green-800 text-sm font-medium'>
                  Mark Paid
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className='p-6 text-center text-gray-500'>
            No pending billing items.
          </div>
        )}
      </div>
    </div>
  )
}

export default PendingBilling