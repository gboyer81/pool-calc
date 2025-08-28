// app/visit/select/page.tsx - Updated with client selection
'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Client } from '@/types/pool-service'

interface VisitOption {
  type: string
  title: string
  description: string
  icon: string
  color: string
  clientTypes: string[]
  priority?: 'low' | 'normal' | 'high' | 'emergency'
  estimatedDuration?: number
}

const visitOptions: VisitOption[] = [
  {
    type: 'maintenance-routine',
    title: 'Routine Maintenance',
    description: 'Regular pool cleaning, chemical testing, and equipment check',
    icon: '💧',
    color: 'bg-blue-500',
    clientTypes: ['maintenance'],
    estimatedDuration: 45,
  },
  {
    type: 'maintenance-chemical',
    title: 'Chemical Balance Only',
    description: 'Water testing and chemical adjustment without cleaning',
    icon: '🧪',
    color: 'bg-green-500',
    clientTypes: ['maintenance'],
    estimatedDuration: 15,
  },
  {
    type: 'service-emergency',
    title: 'Emergency Service',
    description: 'Urgent equipment failure or safety issue',
    icon: '🚨',
    color: 'bg-red-500',
    clientTypes: ['service', 'maintenance'],
    priority: 'emergency',
    estimatedDuration: 120,
  },
  {
    type: 'service-repair',
    title: 'Equipment Repair',
    description: 'Scheduled repair of pumps, heaters, or other equipment',
    icon: '🔧',
    color: 'bg-orange-500',
    clientTypes: ['service', 'maintenance'],
    estimatedDuration: 90,
  },
  {
    type: 'service-installation',
    title: 'Equipment Installation',
    description: 'Installing new equipment or system upgrades',
    icon: '⚙️',
    color: 'bg-purple-500',
    clientTypes: ['service'],
    estimatedDuration: 180,
  },
  {
    type: 'retail-delivery',
    title: 'Product Delivery',
    description: 'Delivering chemicals, equipment, or supplies to customer',
    icon: '📦',
    color: 'bg-yellow-500',
    clientTypes: ['retail', 'service', 'maintenance'],
    estimatedDuration: 20,
  },
  {
    type: 'retail-pickup',
    title: 'Product Pickup',
    description: 'Collecting returns, warranty items, or trade-ins',
    icon: '📤',
    color: 'bg-indigo-500',
    clientTypes: ['retail', 'service'],
    estimatedDuration: 15,
  },
]

function VisitSelectContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlClientId = searchParams.get('clientId') // Client ID from URL (if provided)

  const [client, setClient] = useState<Client | null>(null)
  const [availableClients, setAvailableClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>(
    urlClientId || ''
  ) // Current selection
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showResults, setShowResults] = useState<boolean>(false)
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVisit, setSelectedVisit] = useState<VisitOption | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAvailableClients()
  }, [])

  // Define startVisit function before useEffect that uses it
  const startVisit = (visitOption: VisitOption) => {
    if (!selectedClientId) {
      alert('Please select a client first')
      return
    }

    const queryParams = new URLSearchParams()
    queryParams.set('clientId', selectedClientId) // ← Now uses selected client ID
    queryParams.set('type', visitOption.type)

    if (visitOption.priority) {
      queryParams.set('priority', visitOption.priority)
    }

    router.push(`/visit/history?${queryParams.toString()}`)
  }

  useEffect(() => {
    // Listen for service type selection from sidebar
    const handleSidebarServiceTypeSelected = (event: CustomEvent) => {
      const { serviceType } = event.detail
      const visitOption = visitOptions.find(option => option.type === serviceType)
      if (visitOption) {
        startVisit(visitOption)
      }
    }

    // Listen for client selection from sidebar
    const handleSidebarClientSelected = (event: CustomEvent) => {
      const { client } = event.detail
      setSelectedClientId(client._id.toString())
      setSearchQuery(client.name)
    }

    window.addEventListener('sidebarServiceTypeSelected', handleSidebarServiceTypeSelected as EventListener)
    window.addEventListener('sidebarClientSelected', handleSidebarClientSelected as EventListener)
    return () => {
      window.removeEventListener('sidebarServiceTypeSelected', handleSidebarServiceTypeSelected as EventListener)
      window.removeEventListener('sidebarClientSelected', handleSidebarClientSelected as EventListener)
    }
  }, [selectedClientId, startVisit]) // Re-run when selectedClientId changes

  useEffect(() => {
    // Load specific client when selected
    if (selectedClientId) {
      loadClient(selectedClientId)
    } else {
      setClient(null)
    }
  }, [selectedClientId])

  useEffect(() => {
    // Filter clients based on search query, or show all if no query
    if (searchQuery.trim()) {
      const filtered = availableClients.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.address.street
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          client.address.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredClients(filtered)
    } else {
      // Show all clients when no search query (for browsing)
      setFilteredClients(availableClients)
    }
  }, [searchQuery, availableClients])

  useEffect(() => {
    // Handle click outside to close search results
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadAvailableClients = async () => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableClients(data.clients || [])
      } else {
        console.error('Failed to load clients')
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadClient = async (clientId: string) => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else {
        console.error('Failed to load client')
        setClient(null)
      }
    } catch (error) {
      console.error('Error loading client:', error)
      setClient(null)
    }
  }

  const getAvailableVisits = (): VisitOption[] => {
    if (!client) return visitOptions

    return visitOptions.filter((option) =>
      option.clientTypes.includes(client.clientType)
    )
  }

  const getClientTypeLabel = (clientType: string): string => {
    const labels = {
      maintenance: 'Maintenance Client',
      service: 'Service Client',
      retail: 'Retail Client',
    }
    return labels[clientType as keyof typeof labels] || clientType
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-lg'>Loading client information...</div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['technician', 'supervisor', 'admin']}>
      <div className='p-4 sm:p-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4'>
            <div className='flex-1 min-w-0'>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                Select Visit Type
              </h1>
              {client ? (
                <div className='mt-2'>
                  <p className='text-base sm:text-lg text-gray-600'>{client.name}</p>
                  <p className='text-sm text-gray-500'>
                    {client.address.street}, {client.address.city} •{' '}
                    {getClientTypeLabel(client.clientType)}
                  </p>
                </div>
              ) : (
                <p className='text-gray-600 mt-2 text-sm sm:text-base'>
                  Select a client and choose the type of visit you want to log
                </p>
              )}
            </div>

            <button
              onClick={() => router.push('/')}
              className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 w-full sm:w-auto flex-shrink-0'>
              Cancel
            </button>
          </div>
        </div>

        {/* Client Selection - Show if no client selected or if multiple clients available */}
        {(!selectedClientId || availableClients.length > 0) && (
          <div className='bg-white rounded-lg shadow p-6 mb-6'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select or Search for Client
            </label>
            <div className='relative' ref={searchRef}>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowResults(true)}
                placeholder='Search client name, address, or city... (or click to browse all)'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              />

              {/* Client Results Dropdown - Shows filtered results or all clients */}
              {showResults && filteredClients.length > 0 && (
                <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                  {filteredClients.map((availableClient) => (
                    <div
                      key={availableClient._id.toString()}
                      onClick={() => {
                        setSelectedClientId(availableClient._id.toString())
                        setSearchQuery(availableClient.name)
                        setShowResults(false)
                      }}
                      className='px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0'>
                      <div className='font-medium text-gray-900'>
                        {availableClient.name}
                      </div>
                      <div className='text-sm text-gray-600'>
                        {availableClient.address.street},{' '}
                        {availableClient.address.city}
                      </div>
                      <div className='text-xs text-gray-500'>
                        {getClientTypeLabel(availableClient.clientType)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No results message - only show when actively searching */}
              {showResults &&
                searchQuery.trim() &&
                filteredClients.length === 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4 text-gray-500 text-center'>
                    No clients found matching "{searchQuery}"
                  </div>
                )}

              {/* Show all clients message when dropdown is open but no search */}
              {showResults &&
                !searchQuery.trim() &&
                filteredClients.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                    <div className='px-4 py-2 bg-blue-50 border-b text-sm text-blue-700 font-medium'>
                      All Clients ({filteredClients.length})
                    </div>
                    {filteredClients.map((availableClient) => (
                      <div
                        key={availableClient._id.toString()}
                        onClick={() => {
                          setSelectedClientId(availableClient._id.toString())
                          setSearchQuery(availableClient.name)
                          setShowResults(false)
                        }}
                        className='px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0'>
                        <div className='font-medium text-gray-900'>
                          {availableClient.name}
                        </div>
                        <div className='text-sm text-gray-600'>
                          {availableClient.address.street},{' '}
                          {availableClient.address.city}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {getClientTypeLabel(availableClient.clientType)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Show visit options only when client is selected */}
        {selectedClientId && client ? (
          <>
            {/* Visit Options Grid */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {getAvailableVisits().map((option) => (
                <div
                  key={option.type}
                  className={`relative bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-blue-300 transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                    selectedVisit?.type === option.type
                      ? 'border-blue-500 bg-blue-50'
                      : ''
                  }`}
                  onClick={() => setSelectedVisit(option)}>
                  <div className='p-6'>
                    {/* Header */}
                    <div className='flex items-center justify-between mb-3'>
                      <div
                        className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-2xl`}>
                        {option.icon}
                      </div>
                      {option.priority && (
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            option.priority === 'emergency'
                              ? 'bg-red-100 text-red-800'
                              : option.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                          {option.priority.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h3 className='text-xl font-bold text-gray-900 mb-2'>
                      {option.title}
                    </h3>

                    {/* Description */}
                    <p className='text-gray-600 mb-4'>{option.description}</p>

                    {/* Duration & Details */}
                    <div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
                      {option.estimatedDuration && (
                        <span>⏱️ ~{option.estimatedDuration} min</span>
                      )}
                      <span>
                        {option.clientTypes
                          .map(
                            (type) =>
                              type.charAt(0).toUpperCase() + type.slice(1)
                          )
                          .join(', ')}
                      </span>
                    </div>

                    {/* Start Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startVisit(option)
                      }}
                      className={`w-full ${option.color} hover:opacity-90 text-white py-3 px-4 rounded-lg font-medium transition-opacity`}>
                      Start {option.title}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Emergency Quick Actions */}
            <div className='mt-8 bg-red-50 border border-red-200 rounded-lg p-6'>
              <div className='flex items-center mb-4'>
                <div className='w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white text-xl mr-3'>
                  🚨
                </div>
                <div>
                  <h3 className='text-lg font-semibold text-red-900'>
                    Emergency Service
                  </h3>
                  <p className='text-sm text-red-700'>
                    For urgent issues requiring immediate attention
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <button
                  onClick={() =>
                    startVisit(
                      visitOptions.find((v) => v.type === 'service-emergency')!
                    )
                  }
                  className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium'>
                  🚨 Emergency Service Call
                </button>
                <button
                  onClick={() =>
                    startVisit(
                      visitOptions.find((v) => v.type === 'service-repair')!
                    )
                  }
                  className='bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 font-medium'>
                  🔧 Urgent Repair
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className='bg-gray-50 rounded-lg p-8 text-center'>
            <p className='text-gray-600'>
              Please select a client to see available visit types.
            </p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default function VisitSelectPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="text-lg">Loading...</div></div>}>
      <VisitSelectContent />
    </Suspense>
  )
}
