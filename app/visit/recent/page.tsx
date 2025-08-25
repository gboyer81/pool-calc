'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Truck,
  Wrench,
  ClipboardList,
  ChevronRight,
  Download,
  RefreshCw,
  Loader2,
} from 'lucide-react'

// Import types from the centralized types file
import type {
  ServiceVisit,
  Client,
  InventoryUsage,
  FollowUpResponse as FollowUp,
  PendingBilling,
} from '@/types/pool-service'

const VisitHistoryHomepage = () => {
  const [timeFilter, setTimeFilter] = useState('7days')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<Client[]>([])

  // Data state
  const [recentJobs, setRecentJobs] = useState<ServiceVisit[]>([])
  const [inventoryUsage, setInventoryUsage] = useState<InventoryUsage[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [pendingBilling, setPendingBilling] = useState<PendingBilling[]>([])

  // Summary stats
  const [stats, setStats] = useState({
    completedJobs: 0,
    revenue: 0,
    followUpsDue: 0,
    overdueAmount: 0,
  })

  useEffect(() => {
    loadDashboardData()
  }, [timeFilter])

  const getDateRange = () => {
    const now = new Date()
    const days = timeFilter === '7days' ? 7 : timeFilter === '30days' ? 30 : 90
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return {
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    }
  }

  const loadClients = async (token: string | null) => {
    try {
      const response = await fetch('/api/clients', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setClients(data.data)
        }
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('technicianToken')
      const { startDate, endDate } = getDateRange()

      // Load clients first
      await loadClients(token)

      // Load recent completed jobs
      await loadRecentJobs(token, startDate, endDate)

      // Load inventory usage
      await loadInventoryUsage(token, startDate, endDate)

      // Load follow-ups
      await loadFollowUps(token)

      // Load pending billing
      await loadPendingBilling(token)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentJobs = async (
    token: string | null,
    startDate: string,
    endDate: string
  ) => {
    try {
      const response = await fetch(
        `/api/visits?status=completed&startDate=${startDate}&endDate=${endDate}&limit=10&includeStats=true`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Convert date strings to Date objects
          const visitsWithDates = (data.visits || []).map((visit: any) => ({
            ...visit,
            scheduledDate: new Date(visit.scheduledDate),
            actualDate: visit.actualDate
              ? new Date(visit.actualDate)
              : undefined,
            createdAt: new Date(visit.createdAt),
            updatedAt: new Date(visit.updatedAt),
          }))

          setRecentJobs(visitsWithDates)

          // Calculate revenue from completed jobs
          const revenue = visitsWithDates.reduce(
            (total: number, visit: ServiceVisit) => {
              return total + (visit.billing?.totalAmount || 0)
            },
            0
          )

          setStats((prev) => ({
            ...prev,
            completedJobs: visitsWithDates.length,
            revenue: revenue,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading recent jobs:', error)
    }
  }

  const loadInventoryUsage = async (
    token: string | null,
    startDate: string,
    endDate: string
  ) => {
    try {
      const response = await fetch(
        `/api/inventory?type=usage&startDate=${startDate}&endDate=${endDate}&limit=6`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setInventoryUsage(data.data)
        }
      }
    } catch (error) {
      console.error('Error loading inventory usage:', error)
    }
  }

  const loadFollowUps = async (token: string | null) => {
    try {
      const response = await fetch(`/api/followups?status=pending&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const followUpsWithDates = data.data.map((followUp: any) => ({
            ...followUp,
            originalVisitDate: new Date(followUp.originalVisitDate),
            dueDate: new Date(followUp.dueDate),
          }))

          setFollowUps(followUpsWithDates)
          setStats((prev) => ({
            ...prev,
            followUpsDue: followUpsWithDates.length,
          }))
        }
      }
    } catch (error) {
      console.error('Error loading follow-ups:', error)
    }
  }

  const loadPendingBilling = async (token: string | null) => {
    try {
      const response = await fetch(`/api/billing?type=pending&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          // Convert date strings to Date objects
          const billsWithDates = data.data.map((bill: any) => ({
            ...bill,
            visitDate: new Date(bill.visitDate),
          }))

          setPendingBilling(billsWithDates)

          // Calculate overdue amount - filter by invoiced bills that are past due
          const overdueAmount = billsWithDates
            .filter((bill: PendingBilling) => {
              // Check if bill is invoiced and has a daysOverdue property > 0
              return bill.status === 'invoiced' && (bill as any).daysOverdue > 0
            })
            .reduce(
              (total: number, bill: PendingBilling) => total + bill.amount,
              0
            )

          setStats((prev) => ({ ...prev, overdueAmount }))
        }
      }
    } catch (error) {
      console.error('Error loading pending billing:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const handleScheduleFollowUp = async (followUpId: string) => {
    try {
      const token = localStorage.getItem('technicianToken')
      // For now, we'll just mark as scheduled - in a real app, this would open a scheduling modal
      const response = await fetch(`/api/followups/${followUpId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          status: 'scheduled',
          scheduledDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(), // Tomorrow
        }),
      })

      if (response.ok) {
        await loadFollowUps(token)
      }
    } catch (error) {
      console.error('Error scheduling follow-up:', error)
    }
  }

  const handleSendReminder = async (
    clientId: string,
    invoiceNumber: string
  ) => {
    try {
      // This would integrate with email/SMS service
      alert(`Reminder sent to client for invoice ${invoiceNumber}`)
    } catch (error) {
      console.error('Error sending reminder:', error)
    }
  }

  const handleMarkPaid = async (visitId: string) => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          billing: {
            paymentStatus: 'paid',
            paidDate: new Date().toISOString(),
          },
        }),
      })

      if (response.ok) {
        // Refresh the data
        await loadPendingBilling(token)
        const { startDate, endDate } = getDateRange()
        await loadRecentJobs(token, startDate, endDate)
      }
    } catch (error) {
      console.error('Error marking as paid:', error)
    }
  }

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

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
          <p className='text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm border p-6 mb-6'>
          <div className='flex justify-between items-center mb-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Visit History Dashboard
              </h1>
              <p className='text-gray-600 mt-1'>
                Overview of recent jobs, inventory usage, and pending tasks
              </p>
            </div>
            <div className='flex gap-3'>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className='px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                <option value='7days'>Last 7 Days</option>
                <option value='30days'>Last 30 Days</option>
                <option value='90days'>Last 90 Days</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50'>
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                Refresh
              </button>
              <button className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2'>
                <Download className='w-4 h-4' />
                Export
              </button>
            </div>
          </div>

          {/* Summary Stats */}
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
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Recently Completed Jobs */}
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
              {recentJobs.length > 0 ? (
                recentJobs.map((job) => (
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

          {/* Inventory Usage */}
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
        </div>

        {/* Bottom Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
          {/* Follow-up Visits Required */}
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

          {/* Pending Billing */}
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
        </div>
      </div>
    </div>
  )
}

export default VisitHistoryHomepage
