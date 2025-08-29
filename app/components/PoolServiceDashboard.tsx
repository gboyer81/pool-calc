'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { PoolServiceCards } from "@/components/PoolServiceCards"
import { TodaysRouteChart } from "@/components/TodaysRouteChart"
import { RouteDataTable } from "@/components/RouteDataTable"
import EmergencyVisitModal from '@/components/EmergencyVisitModal'

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

export function PoolServiceDashboard() {
  const router = useRouter()
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [todaysRoute, setTodaysRoute] = useState<TodaysRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [emergencyClientId, setEmergencyClientId] = useState<string>()

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
        const technicianData = localStorage.getItem('technicianData')
        const token = localStorage.getItem('technicianToken')

        if (!technicianData || !token) {
          router.push('/login')
          return
        }

        const parsedTechnician = JSON.parse(technicianData)
        setTechnician(parsedTechnician)

        const clientsResponse = await fetch('/api/clients', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        const routeResponse = await fetch(
          `/api/routes/today?technicianId=${parsedTechnician._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          if (clientsData.success) {
            setClients(clientsData.clients || [])
            generateTodaysRoute(clientsData.clients || [])
          }
        } else if (clientsResponse.status === 401) {
          localStorage.removeItem('technicianToken')
          localStorage.removeItem('technicianData')
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setError('Failed to load dashboard data. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const generateTodaysRoute = (clientList: Client[]) => {
    const today = new Date()
    const dayName = today
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()

    const todaysClients = clientList.filter((client) => {
      if (!client.serviceDay) return false
      return client.serviceDay.toLowerCase() === dayName
    })

    const route: TodaysRoute[] = todaysClients.map((client, index) => ({
      client,
      estimatedTime: getTimeSlot(client.preferredTimeSlot, index),
      status: 'pending',
      pools: Math.floor(Math.random() * 2) + 1,
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

  const handleLogout = () => {
    localStorage.removeItem('technicianToken')
    localStorage.removeItem('technicianData')
    
    // Dispatch custom event to notify other components of auth change
    window.dispatchEvent(new CustomEvent('authStateChanged'))
    
    router.push('/login')
  }

  const handleEmergencyClick = () => {
    setEmergencyClientId(undefined)
    setShowEmergencyModal(true)
  }

  const handleEmergencyForClient = (clientId: string) => {
    setEmergencyClientId(clientId)
    setShowEmergencyModal(true)
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64 bg-background'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg border border-red-200 dark:border-red-700'>
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

  const completedVisits = todaysRoute.filter((r) => r.status === 'completed').length
  const totalPools = todaysRoute.reduce((sum, r) => sum + r.pools, 0)

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-blue-800">
          <div>
            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {getGreeting()}, {technician?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })} • {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/clients')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
            >
              👥 Clients
            </button>
            <button
              onClick={() => router.push('/calculator')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1"
            >
              🧮 Calculator
            </button>
            <button
              onClick={handleEmergencyClick}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              🚨 Emergency
            </button>
          </div>
        </div>
        
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <PoolServiceCards
              totalClients={clients.length}
              todaysVisits={todaysRoute.length}
              completedVisits={completedVisits}
              totalPools={totalPools}
            />
            <div className="px-4 lg:px-6">
              <TodaysRouteChart route={todaysRoute} />
            </div>
            <div className="px-4 lg:px-6">
              <div className="bg-card rounded-lg border border-blue-100 dark:border-blue-800 shadow-sm">
                <div className="p-6 border-b border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        🗺️ Today's Route
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {todaysRoute.length === 0 
                          ? "No visits scheduled for today" 
                          : `${todaysRoute.length} visit${todaysRoute.length !== 1 ? 's' : ''} scheduled`
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <RouteDataTable data={todaysRoute} onUpdateStatus={updateRouteStatus} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showEmergencyModal && (
        <EmergencyVisitModal
          isOpen={showEmergencyModal}
          onClose={() => setShowEmergencyModal(false)}
          preselectedClientId={emergencyClientId}
        />
      )}
    </>
  )
}