'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, Loader2 } from 'lucide-react'

// Import types from the centralized types file
import type {
  ServiceVisit,
  Client,
  InventoryUsage,
  FollowUpResponse as FollowUp,
  PendingBilling,
} from '@/types/pool-service'

// Import new components
import RecentlyCompletedJobs from '@/components/RecentlyCompletedJobs'
import FollowupVisits from '@/components/FollowupVisits'
import RecentInventoryUsage from '@/components/RecentInventoryUsage'
import PendingBillingComponent from '@/components/PendingBilling'
import SummaryStats from '@/components/SummaryStats'

const VisitHistoryHomepage = () => {
  const [timeFilter, setTimeFilter] = useState('7days')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [, setClients] = useState<Client[]>([])

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
    _clientId: string,
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

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
          <p className='text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen p-6'>
      <div>
        {/* Header */}
        <div className='bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4'>
            <div className='flex-1 min-w-0'>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                Visit History Dashboard
              </h1>
              <p className='text-gray-600 mt-1 text-sm sm:text-base'>
                Overview of recent jobs, inventory usage, and pending tasks
              </p>
            </div>
            <div className='flex flex-col sm:flex-row gap-3'>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'>
                <option value='7days'>Last 7 Days</option>
                <option value='30days'>Last 30 Days</option>
                <option value='90days'>Last 90 Days</option>
              </select>
              <div className='flex gap-3'>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className='flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50'>
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
                <button className='flex-1 sm:flex-none px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2'>
                  <Download className='w-4 h-4' />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <SummaryStats
            stats={stats}
            timeFilter={timeFilter}
            loading={loading}
          />
        </div>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <RecentlyCompletedJobs jobs={recentJobs} loading={loading} />
          <RecentInventoryUsage
            inventoryUsage={inventoryUsage}
            loading={loading}
          />
        </div>

        {/* Bottom Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
          <FollowupVisits
            followUps={followUps}
            loading={loading}
            onScheduleFollowUp={handleScheduleFollowUp}
          />
          <PendingBillingComponent
            pendingBilling={pendingBilling}
            loading={loading}
            onSendReminder={handleSendReminder}
            onMarkPaid={handleMarkPaid}
          />
        </div>
      </div>
    </div>
  )
}

export default VisitHistoryHomepage
