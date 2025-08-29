'use client'

import React, { useState, useEffect } from 'react'
import { Download, RefreshCw, Loader2, Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'

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
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const VisitHistoryHomepage = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
    to: new Date(),
  })
  const [showCalendar, setShowCalendar] = useState(false)
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

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showCalendar && !target.closest('.calendar-container')) {
        setShowCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showCalendar])

  useEffect(() => {
    loadDashboardData()
  }, [dateRange])

  const getDateRange = () => {
    const startDate = dateRange?.from || new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
    const endDate = dateRange?.to || new Date()
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
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
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b border-blue-100 dark:border-blue-800'>
        <div>
          <h1 className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
            Visit History Dashboard
          </h1>
          <p className='text-muted-foreground mt-1'>
            Overview of recent jobs, inventory usage, and pending tasks
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='relative calendar-container'>
            <Button
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className='border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'>
              <CalendarIcon className='w-4 h-4 mr-2' />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                'Pick date range'
              )}
            </Button>
            {showCalendar && (
              <div className='absolute top-full left-0 mt-2 z-50 bg-card border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg p-3'>
                <Calendar
                  mode='range'
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={(date) =>
                    date > new Date() || date < new Date('2020-01-01')
                  }
                />
                <div className='flex gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700'>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
                        to: new Date(),
                      })
                      setShowCalendar(false)
                    }}>
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({
                        from: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
                        to: new Date(),
                      })
                      setShowCalendar(false)
                    }}>
                    Last 30 days
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowCalendar(false)}
                    className='ml-auto bg-blue-600 hover:bg-blue-700'>
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className='bg-blue-600 hover:bg-blue-700 text-white'>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className='border-blue-200 dark:border-blue-700'>
            <Download className='w-4 h-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      <div className='flex-1 p-6 space-y-6'>
        {/* Summary Stats */}
        <Card className='border-blue-100 dark:border-blue-800'>
          <CardContent className='p-6'>
            <SummaryStats
              stats={stats}
              dateRange={dateRange}
              loading={loading}
            />
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <RecentlyCompletedJobs jobs={recentJobs} loading={loading} />
          <RecentInventoryUsage
            inventoryUsage={inventoryUsage}
            loading={loading}
          />
        </div>

        {/* Bottom Row */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
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
