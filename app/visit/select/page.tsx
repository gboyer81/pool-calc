// app/visit/select/page.tsx - Updated with client selection
'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Client } from '@/types/pool-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Clock, Users, AlertCircle } from 'lucide-react'

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
      <div className='flex flex-1 flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-blue-100 dark:border-blue-800'>
          <div>
            <h1 className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
              Select Visit Type
            </h1>
            {client ? (
              <div className='mt-2'>
                <p className='text-lg text-blue-700 dark:text-blue-300'>{client.name}</p>
                <p className='text-sm text-muted-foreground'>
                  {client.address.street}, {client.address.city} • {getClientTypeLabel(client.clientType)}
                </p>
              </div>
            ) : (
              <p className='text-muted-foreground mt-1'>
                Select a client and choose the type of visit you want to log
              </p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className='flex-shrink-0'
          >
            Cancel
          </Button>
        </div>
        
        <div className='flex-1 p-6 space-y-6'>

          {/* Client Selection */}
          {(!selectedClientId || availableClients.length > 0) && (
            <Card className='border-blue-100 dark:border-blue-800'>
              <CardHeader>
                <CardTitle className='text-blue-900 dark:text-blue-100 flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Select or Search for Client
                </CardTitle>
                <CardDescription>
                  Search by name, address, or city, or browse all available clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='relative' ref={searchRef}>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowResults(true)}
                    placeholder='Search client name, address, or city... (or click to browse all)'
                    className='pl-10 border-blue-200 dark:border-blue-700 focus-visible:ring-blue-500'
                  />

                  {/* Client Results Dropdown */}
                  {showResults && filteredClients.length > 0 && (
                    <div className='absolute z-10 w-full mt-1 bg-card border border-blue-200 dark:border-blue-700 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                      {filteredClients.map((availableClient) => (
                        <div
                          key={availableClient._id.toString()}
                          onClick={() => {
                            setSelectedClientId(availableClient._id.toString())
                            setSearchQuery(availableClient.name)
                            setShowResults(false)
                          }}
                          className='px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-blue-100 dark:border-blue-800 last:border-b-0'>
                          <div className='font-medium text-foreground'>
                            {availableClient.name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {availableClient.address.street}, {availableClient.address.city}
                          </div>
                          <Badge variant="outline" className='text-xs mt-1 border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300'>
                            {getClientTypeLabel(availableClient.clientType)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {showResults && searchQuery.trim() && filteredClients.length === 0 && (
                    <div className='absolute z-10 w-full mt-1 bg-card border border-blue-200 dark:border-blue-700 rounded-md shadow-lg p-4 text-muted-foreground text-center'>
                      No clients found matching "{searchQuery}"
                    </div>
                  )}

                  {/* Browse all clients */}
                  {showResults && !searchQuery.trim() && filteredClients.length > 0 && (
                    <div className='absolute z-10 w-full mt-1 bg-card border border-blue-200 dark:border-blue-700 rounded-md shadow-lg max-h-60 overflow-y-auto'>
                      <div className='px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 font-medium'>
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
                          className='px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-blue-100 dark:border-blue-800 last:border-b-0'>
                          <div className='font-medium text-foreground'>
                            {availableClient.name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {availableClient.address.street}, {availableClient.address.city}
                          </div>
                          <Badge variant="outline" className='text-xs mt-1 border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300'>
                            {getClientTypeLabel(availableClient.clientType)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Visit Options Grid */}
          {selectedClientId && client ? (
            <div className='space-y-6'>
              <div>
                <h2 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4'>
                  Available Visit Types for {client.name}
                </h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {getAvailableVisits().map((option) => (
                    <Card
                      key={option.type}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border-blue-100 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-600 ${
                        selectedVisit?.type === option.type
                          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                      onClick={() => setSelectedVisit(option)}>
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <div className={`w-10 h-10 ${option.color} rounded-lg flex items-center justify-center text-lg`}>
                            {option.icon}
                          </div>
                          {option.priority && (
                            <Badge
                              variant={option.priority === 'emergency' ? 'destructive' : 'secondary'}
                              className='text-xs'>
                              {option.priority.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className='text-lg text-blue-900 dark:text-blue-100'>
                          {option.title}
                        </CardTitle>
                        <CardDescription>
                          {option.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='pt-0'>
                        <div className='flex items-center justify-between text-sm text-muted-foreground mb-4'>
                          {option.estimatedDuration && (
                            <div className='flex items-center gap-1'>
                              <Clock className='h-4 w-4' />
                              {option.estimatedDuration} min
                            </div>
                          )}
                          <Badge variant="outline" className='text-xs border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300'>
                            {option.clientTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)).join(', ')}
                          </Badge>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            startVisit(option)
                          }}
                          className='w-full bg-blue-600 hover:bg-blue-700 text-white'>
                          Start {option.title}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Emergency Quick Actions */}
              <Card className='border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'>
                <CardHeader>
                  <CardTitle className='text-red-900 dark:text-red-100 flex items-center gap-2'>
                    <AlertCircle className='h-5 w-5' />
                    Emergency Service
                  </CardTitle>
                  <CardDescription className='text-red-700 dark:text-red-300'>
                    For urgent issues requiring immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <Button
                      onClick={() =>
                        startVisit(visitOptions.find((v) => v.type === 'service-emergency')!)
                      }
                      variant="destructive"
                      className='bg-red-600 hover:bg-red-700'>
                      🚨 Emergency Service Call
                    </Button>
                    <Button
                      onClick={() =>
                        startVisit(visitOptions.find((v) => v.type === 'service-repair')!)
                      }
                      className='bg-orange-600 hover:bg-orange-700 text-white'>
                      🔧 Urgent Repair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className='border-blue-100 dark:border-blue-800'>
              <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
                <Users className='h-12 w-12 text-muted-foreground mb-4' />
                <p className='text-muted-foreground text-lg'>
                  Please select a client to see available visit types.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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
