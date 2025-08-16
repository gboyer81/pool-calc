'use client'

import React, { useState, useEffect } from 'react'

interface TechnicianData {
  _id: string
  name: string
  email: string
  employeeId: string
  role: string
  assignedClients: string[]
}

interface Client {
  _id: string
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  serviceFrequency: string
  serviceDay?: string
  preferredTimeSlot?: string
  specialInstructions?: string
  isActive: boolean
  nextServiceDate?: string
}

interface TodaysRoute {
  client: Client
  estimatedTime: string
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
  pools: number
}

export default function TechnicianDashboard() {
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [todaysRoute, setTodaysRoute] = useState<TodaysRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Load technician data and fetch clients
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get technician data from localStorage
        const technicianData = localStorage.getItem('technicianData')
        const token = localStorage.getItem('technicianToken')

        if (!technicianData || !token) {
          window.location.href = '/login'
          return
        }

        const parsedTechnician = JSON.parse(technicianData)
        setTechnician(parsedTechnician)

        // Fetch assigned clients
        const clientsResponse = await fetch('/api/clients', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          if (clientsData.success) {
            setClients(clientsData.clients || [])
            generateTodaysRoute(clientsData.clients || [])
          } else {
            setError(clientsData.error || 'Failed to fetch clients')
          }
        } else if (clientsResponse.status === 401) {
          // Token expired
          localStorage.removeItem('technicianToken')
          localStorage.removeItem('technicianData')
          window.location.href = '/login'
        } else {
          setError('Failed to fetch clients')
        }
      } catch (err) {
        setError('Failed to load dashboard data')
        console.error('Dashboard error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const generateTodaysRoute = (clientList: Client[]) => {
    const today = new Date()
    const dayName = today
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()

    // Filter clients for today's service
    const todaysClients = clientList.filter((client) => {
      if (!client.serviceDay) return false
      return client.serviceDay.toLowerCase() === dayName
    })

    // Generate route with mock data
    const route: TodaysRoute[] = todaysClients.map((client, index) => ({
      client,
      estimatedTime: getTimeSlot(client.preferredTimeSlot, index),
      status: 'pending',
      pools: Math.floor(Math.random() * 2) + 1, // 1-2 pools per client
    }))

    setTodaysRoute(
      route.sort((a, b) => a.estimatedTime.localeCompare(b.estimatedTime))
    )
  }

  const getTimeSlot = (preferredSlot: string | undefined, index: number) => {
    const baseHour =
      preferredSlot === 'morning'
        ? 8
        : preferredSlot === 'afternoon'
        ? 13
        : preferredSlot === 'evening'
        ? 16
        : 9

    const hour = baseHour + Math.floor(index * 1.5)
    const minutes = (index % 2) * 30
    return `${hour.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`
  }

  const updateRouteStatus = (
    clientId: string,
    status: TodaysRoute['status']
  ) => {
    setTodaysRoute((prev) =>
      prev.map((item) =>
        item.client._id === clientId ? { ...item, status } : item
      )
    )
  }

  const getStatusColor = (status: TodaysRoute['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'skipped':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const handleLogout = () => {
    localStorage.removeItem('technicianToken')
    localStorage.removeItem('technicianData')
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-lg'>Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-4xl mx-auto p-6'>
        <div className='bg-red-100 text-red-800 p-4 rounded-lg'>
          <strong>Error:</strong> {error}
          <button
            onClick={() => window.location.reload()}
            className='ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700'>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-screen-2xl mx-auto p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            {getGreeting()}, {technician?.name}! 👋
          </h1>
          <p className='text-gray-600 mt-1'>
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            •{' '}
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => (window.location.href = '/clients')}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
            👥 My Clients
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'>
            🧮 Calculator
          </button>
          <button
            onClick={handleLogout}
            className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors'>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-blue-100 rounded-lg'>
              <span className='text-2xl'>👥</span>
            </div>
            <div className='ml-4'>
              <p className='text-sm text-gray-600'>Total Clients</p>
              <p className='text-2xl font-bold text-gray-900'>
                {clients.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <span className='text-2xl'>📅</span>
            </div>
            <div className='ml-4'>
              <p className='text-sm text-gray-600'>Today's Visits</p>
              <p className='text-2xl font-bold text-gray-900'>
                {todaysRoute.length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-yellow-100 rounded-lg'>
              <span className='text-2xl'>⏱️</span>
            </div>
            <div className='ml-4'>
              <p className='text-sm text-gray-600'>Completed</p>
              <p className='text-2xl font-bold text-gray-900'>
                {todaysRoute.filter((r) => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <div className='flex items-center'>
            <div className='p-2 bg-purple-100 rounded-lg'>
              <span className='text-2xl'>🏊‍♀️</span>
            </div>
            <div className='ml-4'>
              <p className='text-sm text-gray-600'>Total Pools</p>
              <p className='text-2xl font-bold text-gray-900'>
                {todaysRoute.reduce((sum, r) => sum + r.pools, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Route */}
      <div className='bg-white rounded-lg shadow-md mb-8'>
        <div className='p-6 border-b border-gray-200'>
          <h2 className='text-xl font-semibold flex items-center'>
            🗺️ Today's Route
            {todaysRoute.length === 0 && (
              <span className='ml-3 text-sm text-gray-500 font-normal'>
                No visits scheduled for today
              </span>
            )}
          </h2>
        </div>

        {todaysRoute.length === 0 ? (
          <div className='p-8 text-center text-gray-500'>
            <div className='text-4xl mb-4'>🏖️</div>
            <p className='text-lg'>No visits scheduled for today!</p>
            <p className='text-sm mt-2'>
              Enjoy your day off or check for emergency calls.
            </p>
          </div>
        ) : (
          <div className='p-6'>
            <div className='space-y-4'>
              {todaysRoute.map((visit, index) => (
                <div
                  key={visit.client._id}
                  className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'>
                  <div className='flex items-center space-x-4'>
                    <div className='text-2xl font-bold text-blue-600 min-w-16'>
                      {visit.estimatedTime}
                    </div>

                    <div className='flex-1'>
                      <h3 className='font-semibold text-gray-900'>
                        {visit.client.name}
                      </h3>
                      <p className='text-sm text-gray-600'>
                        📍 {visit.client.address.street},{' '}
                        {visit.client.address.city}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {visit.pools} pool{visit.pools > 1 ? 's' : ''} •{' '}
                        {visit.client.serviceFrequency}
                      </p>
                      {visit.client.specialInstructions && (
                        <p className='text-xs text-yellow-700 bg-yellow-50 p-1 rounded mt-1'>
                          ⚠️ {visit.client.specialInstructions}
                        </p>
                      )}
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
                          onClick={() =>
                            (window.location.href = `/visit/log?clientId=${visit.client._id}`)
                          }
                          className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700'>
                          Log Visit
                        </button>
                      )}

                      {visit.status === 'completed' && (
                        <span className='text-green-600 font-medium text-sm'>
                          ✓ Done
                        </span>
                      )}

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
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>🧮 Quick Calculator</h3>
          <p className='text-gray-600 text-sm mb-4'>
            Access chemical calculators for pool maintenance
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className='w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors'>
            Open Calculator
          </button>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>📋 Log Emergency Visit</h3>
          <p className='text-gray-600 text-sm mb-4'>
            Record an unscheduled service call
          </p>
          <button className='w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors'>
            Emergency Log
          </button>
        </div>

        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>📊 Today's Summary</h3>
          <p className='text-gray-600 text-sm mb-4'>
            View completed visits and chemical usage
          </p>
          <button className='w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition-colors'>
            View Report
          </button>
        </div>
      </div>
    </div>
  )
}
