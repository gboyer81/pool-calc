// app/dashboard/page.tsx - Updated with Emergency Modal Integration
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import EmergencyVisitModal from '@/components/EmergencyVisitModal'

interface TechnicianData {
  _id: string
  name: string
  email: string
  employeeId: string
  role: 'technician' | 'supervisor' | 'admin'
  assignedClients: string[]
}

interface ClientVisit {
  client: {
    _id: string
    name: string
    address: { street: string; city: string; state: string }
    serviceFrequency: string
    specialInstructions?: string
  }
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
  estimatedDuration: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [todaysRoute, setTodaysRoute] = useState<ClientVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Emergency Modal State - THIS IS WHAT TRIGGERS THE MODAL
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyClientId, setEmergencyClientId] = useState<string>()

  useEffect(() => {
    const loadData = async () => {
      try {
        const technicianData = localStorage.getItem('technicianData')
        const token = localStorage.getItem('technicianToken')

        if (!technicianData || !token) {
          router.push('/login')
          return
        }

        const parsedTechnician = JSON.parse(technicianData)
        setTechnician(parsedTechnician)

        // Fix the API call by including technicianId
        const routeResponse = await fetch(
          `/api/routes/today?technicianId=${parsedTechnician._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (routeResponse.ok) {
          const routeData = await routeResponse.json()
          // Handle the route data
          console.log('✅ Route data loaded:', routeData)
        } else {
          console.error('❌ Failed to load route data:', routeResponse.status)
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error)
      }
    }

    loadData()
  }, [router])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Load technician data
      const technicianData = localStorage.getItem('technicianData')
      if (technicianData) {
        const tech = JSON.parse(technicianData)
        setTechnician(tech)

        // Load today's route
        const token = localStorage.getItem('technicianToken')
        const response = await fetch(
          `/api/routes/today?technicianId=${tech._id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (response.ok) {
          const routeData = await response.json()
          setTodaysRoute(routeData.visits || [])
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const updateRouteStatus = async (clientId: string, status: string) => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/routes/update-status', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId, status }),
      })

      if (response.ok) {
        loadDashboardData() // Reload the route
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  // TRIGGER 1: Emergency Modal Handlers
  const handleEmergencyClick = () => {
    setEmergencyClientId(undefined) // No pre-selected client
    setShowEmergencyModal(true)
  }

  const handleEmergencyForClient = (clientId: string) => {
    setEmergencyClientId(clientId) // Pre-select the client
    setShowEmergencyModal(true)
  }

  const handleEmergencyComplete = (visitId: string) => {
    console.log('Emergency visit logged:', visitId)
    // Optionally reload the route or show a success message
    loadDashboardData()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'skipped':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-lg'>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['technician', 'supervisor', 'admin']}>
      <div className='p-6'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Welcome back, {technician?.name?.split(' ')[0] || 'Technician'} 👋!
          </h1>
          <p className='text-muted-foreground'>
            Today's Schedule •{' '}
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
            {error}
          </div>
        )}

        {/* TRIGGER 2: Emergency Button in Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <div className='bg-background dark:bg-muted rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold mb-4'>🧮 Quick Calculator</h3>
            <p className='text-muted-foreground text-sm mb-4'>
              Access chemical calculators for pool maintenance
            </p>
            <button
              onClick={() => (window.location.href = '/')}
              className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors'>
              Open Calculator
            </button>
          </div>

          <div className='bg-background dark:bg-muted rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold mb-4'>
              🚨 Log Emergency Visit
            </h3>
            <p className='text-muted-foreground text-sm mb-4'>
              Record an unscheduled emergency service call
            </p>
            {/* UPDATED: This button now triggers the modal */}
            <button
              onClick={handleEmergencyClick}
              className='w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors'>
              Emergency Log
            </button>
          </div>

          <div className='bg-background dark:bg-muted rounded-lg shadow p-6'>
            <h3 className='text-lg font-semibold mb-4'>📊 Today's Summary</h3>
            <p className='text-muted-foreground text-sm mb-4'>
              View completed visits and chemical usage
            </p>
            <button className='w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors'>
              View Report
            </button>
          </div>
        </div>

        {/* Today's Route */}
        {todaysRoute.length > 0 && (
          <div className='bg-background rounded-lg shadow border mb-6'>
            <div className='px-6 py-4 border-b border-border'>
              <div className='flex justify-between items-center'>
                <h2 className='text-xl font-semibold text-foreground'>
                  📅 Today's Route ({todaysRoute.length} visits)
                </h2>
                {/* TRIGGER 3: Emergency button in route header */}
                <button
                  onClick={handleEmergencyClick}
                  className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm'>
                  🚨 Emergency
                </button>
              </div>
            </div>

            <div className='divide-y divide-border'>
              {todaysRoute.map((visit, index) => (
                <div
                  key={index}
                  className='p-6 flex justify-between items-center'>
                  <div className='flex-1'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h3 className='text-lg font-medium text-foreground'>
                          {visit.client.name}
                        </h3>
                        <p className='text-muted-foreground text-sm'>
                          {visit.client.address.street},{' '}
                          {visit.client.address.city}
                        </p>
                        <p className='text-xs text-muted-foreground mt-1'>
                          ~{visit.estimatedDuration} min{'s'} •{' '}
                          {visit.client.serviceFrequency}
                        </p>
                        {visit.client.specialInstructions && (
                          <p className='text-xs text-yellow-700 bg-yellow-50 p-1 rounded mt-1'>
                            ⚠️ {visit.client.specialInstructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center space-x-3'>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        visit.status
                      )}`}>
                      {visit.status.replace('-', ' ').toUpperCase()}
                    </span>

                    <div className='flex space-x-2'>
                      {visit.status === 'pending' && (
                        <>
                          <button
                            onClick={() =>
                              updateRouteStatus(visit.client._id, 'in-progress')
                            }
                            className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
                            Start
                          </button>
                          <button
                            onClick={() =>
                              updateRouteStatus(visit.client._id, 'skipped')
                            }
                            className='bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600'>
                            Skip
                          </button>
                        </>
                      )}

                      {visit.status === 'in-progress' && (
                        <button
                          onClick={() => {
                            const clientId = visit.client._id?.toString()

                            // Debug logging
                            console.log(
                              '🎯 Dashboard: Starting visit for client:',
                              clientId
                            )

                            // Validate clientId
                            if (
                              !clientId ||
                              !/^[0-9a-fA-F]{24}$/.test(clientId)
                            ) {
                              console.error('❌ Invalid clientId:', clientId)
                              alert(
                                'Invalid client ID. Please refresh and try again.'
                              )
                              return
                            }

                            // Use router.push instead of window.location.href
                            router.push(
                              `/visit/history?clientId=${clientId}&type=maintenance-routine`
                            )
                          }}
                          className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700'>
                          Log Visit
                        </button>
                      )}

                      {visit.status === 'completed' && (
                        <span className='text-green-600 font-medium text-sm'>
                          ✓ Done
                        </span>
                      )}

                      {/* TRIGGER 4: Emergency button for specific client */}
                      <button
                        onClick={() =>
                          handleEmergencyForClient(visit.client._id)
                        }
                        className='bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600'
                        title='Log emergency for this client'>
                        🚨
                      </button>

                      <button
                        onClick={() =>
                          window.open(
                            `https://maps.google.com?q=${encodeURIComponent(
                              visit.client.address.street +
                                ', ' +
                                visit.client.address.city +
                                ', ' +
                                visit.client.address.state
                            )}`,
                            '_blank'
                          )
                        }
                        className='bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300'>
                        📍 Navigate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Route Message */}
        {todaysRoute.length === 0 && !loading && (
          <div className='text-center py-12 bg-background rounded-lg shadow'>
            <div className='text-6xl mb-4'>📅</div>
            <h3 className='text-xl font-semibold text-foreground mb-2'>
              No scheduled visits today
            </h3>
            <p className='text-muted-foreground mb-4'>
              Your route is clear! Use the emergency log for any unscheduled
              calls.
            </p>
            {/* TRIGGER 5: Emergency button when no scheduled visits */}
            <button
              onClick={handleEmergencyClick}
              className='bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors'>
              🚨 Log Emergency Visit
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mt-6'>
          <div className='bg-background rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='text-2xl mr-3'>✅</div>
              <div>
                <p className='text-2xl font-bold text-green-600'>
                  {todaysRoute.filter((v) => v.status === 'completed').length}
                </p>
                <p className='text-sm text-muted-foreground'>Completed</p>
              </div>
            </div>
          </div>

          <div className='bg-background rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='text-2xl mr-3'>⏳</div>
              <div>
                <p className='text-2xl font-bold text-blue-600'>
                  {todaysRoute.filter((v) => v.status === 'pending').length}
                </p>
                <p className='text-sm text-muted-foreground'>Remaining</p>
              </div>
            </div>
          </div>

          <div className='bg-background rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='text-2xl mr-3'>🔄</div>
              <div>
                <p className='text-2xl font-bold text-orange-600'>
                  {todaysRoute.filter((v) => v.status === 'in-progress').length}
                </p>
                <p className='text-sm text-muted-foreground'>In Progress</p>
              </div>
            </div>
          </div>

          <div className='bg-background rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='text-2xl mr-3'>⚠️</div>
              <div>
                <p className='text-2xl font-bold text-gray-600'>
                  {todaysRoute.filter((v) => v.status === 'skipped').length}
                </p>
                <p className='text-sm text-muted-foreground'>Skipped</p>
              </div>
            </div>
          </div>
        </div>

        {/* TRIGGER 6: Floating Emergency Action Button (Mobile-friendly) */}
        <button
          onClick={handleEmergencyClick}
          className='fixed bottom-6 right-6 bg-red-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-red-700 transition-colors flex items-center justify-center text-2xl z-40 md:hidden'
          title='Emergency Visit'>
          🚨
        </button>
      </div>

      {/* THE EMERGENCY MODAL - This is what gets triggered */}
      <EmergencyVisitModal
        isOpen={showEmergencyModal}
        onClose={() => {
          setShowEmergencyModal(false)
          setEmergencyClientId(undefined)
        }}
        preselectedClientId={emergencyClientId}
        onSubmit={handleEmergencyComplete}
      />
    </ProtectedRoute>
  )
}
