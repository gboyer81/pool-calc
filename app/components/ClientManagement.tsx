// app/components/ClientManagement.tsx
'use client'

import React, { useState, useEffect } from 'react'
import TabbedPoolEditor from './TabbedPoolEditor'
import {
  ShoppingCart,
  Wrench,
  Calendar,
  Users,
  Plus,
  Search,
  UserCheck,
  UserX,
  Target,
} from 'lucide-react'

// Import types from the enhanced pool-service.ts schema
import {
  Client,
  RetailClient,
  ServiceClient,
  MaintenanceClient,
  Pool,
  isRetailClient,
  isServiceClient,
  isMaintenanceClient,
} from '@/types/pool-service'

interface Technician {
  _id: string
  name: string
  email: string
  phone: string
  employeeId: string
  role: 'technician' | 'supervisor' | 'admin'
  assignedClients: string[]
  isActive: boolean
  serviceAreas: string[]
}

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Enhanced filtering state
  const [searchTerm, setSearchTerm] = useState('')
  const [clientTypeFilter, setClientTypeFilter] = useState<
    'all' | 'retail' | 'service' | 'maintenance'
  >('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [frequencyFilter, setFrequencyFilter] = useState<
    'all' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  >('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Form state
  const [showAddClient, setShowAddClient] = useState(false)
  const [selectedClientType, setSelectedClientType] = useState<
    'retail' | 'service' | 'maintenance'
  >('maintenance')
  const [clientSaving, setClientSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Pool state (keeping existing functionality)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientPools, setClientPools] = useState<Pool[]>([])
  const [showClientPools, setShowClientPools] = useState(false)
  const [poolsLoading, setPoolsLoading] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showPoolEditor, setShowPoolEditor] = useState(false)
  const [poolSaving, setPoolSaving] = useState(false)

  // Assignment state
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [showAssignmentSection, setShowAssignmentSection] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [currentAssignment, setCurrentAssignment] = useState<Technician | null>(
    null
  )

  // Client form data
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    // Type-specific data will be added based on selectedClientType
    retail: {
      pricingTier: 'standard' as const,
      taxExempt: false,
      paymentTerms: 'net-30' as const,
      creditLimit: undefined as number | undefined,
    },
    service: {
      laborRates: {
        standard: 85,
        emergency: 127.5,
      },
      serviceTypes: [] as string[],
      emergencyService: {
        enabled: true,
        afterHours: true,
      },
    },
    maintenance: {
      serviceFrequency: 'weekly' as const,
      serviceDay: 'Monday',
      specialInstructions: '',
      accessInstructions: {
        gateCode: '',
        keyLocation: '',
        dogOnProperty: false,
        specialAccess: '',
      },
      maintenancePreferences: {
        cleaningIntensity: 'standard' as const,
        chemicalBalance: 'standard' as const,
        equipmentMonitoring: 'comprehensive' as const,
      },
    },
  })

  const [clientFormErrors, setClientFormErrors] = useState<
    Record<string, string>
  >({})

  // Fetch clients and technicians on component mount
  useEffect(() => {
    fetchClients()
    fetchTechnicians()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(search) ||
          client.email.toLowerCase().includes(search) ||
          client.phone.includes(search) ||
          `${client.address.street} ${client.address.city}`
            .toLowerCase()
            .includes(search)
      )
    }

    // Type filter
    if (clientTypeFilter !== 'all') {
      filtered = filtered.filter(
        (client) => client.clientType === clientTypeFilter
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((client) =>
        statusFilter === 'active' ? client.isActive : !client.isActive
      )
    }

    // Frequency filter (only for maintenance clients)
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter((client) => {
        if (client.clientType !== 'maintenance') return true
        const maintenanceClient = client as MaintenanceClient
        return (
          maintenanceClient.maintenance.serviceFrequency === frequencyFilter
        )
      })
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, clientTypeFilter, statusFilter, frequencyFilter])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setClients(data.clients || [])
        } else {
          setError('Failed to fetch clients')
        }
      } else {
        setError('Failed to fetch clients')
      }
    } catch (err) {
      setError('Network error')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/technicians', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTechnicians(data.technicians || [])
        }
      }
    } catch (err) {
      console.error('Error fetching technicians:', err)
    }
  }

  const getClientTypeIcon = (type: string) => {
    switch (type) {
      case 'retail':
        return <ShoppingCart className='h-6 w-6 text-green-600' />
      case 'service':
        return <Wrench className='h-6 w-6 text-orange-600' />
      case 'maintenance':
        return <Calendar className='h-6 w-6 text-blue-600' />
      default:
        return <Users className='h-6 w-6 text-gray-600' />
    }
  }

  const resetClientForm = () => {
    setClientFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      retail: {
        pricingTier: 'standard',
        taxExempt: false,
        paymentTerms: 'net-30',
        creditLimit: undefined,
      },
      service: {
        laborRates: {
          standard: 85,
          emergency: 127.5,
        },
        serviceTypes: [],
        emergencyService: {
          enabled: true,
          afterHours: true,
        },
      },
      maintenance: {
        serviceFrequency: 'weekly',
        serviceDay: 'Monday',
        specialInstructions: '',
        accessInstructions: {
          gateCode: '',
          keyLocation: '',
          dogOnProperty: false,
          specialAccess: '',
        },
        maintenancePreferences: {
          cleaningIntensity: 'standard',
          chemicalBalance: 'standard',
          equipmentMonitoring: 'comprehensive',
        },
      },
    })
    setClientFormErrors({})
  }

  const handleClientFormChange = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1]
      setClientFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setClientFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

    // Clear error for this field when user starts typing
    if (clientFormErrors[field] || clientFormErrors[field.split('.')[1]]) {
      setClientFormErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        delete newErrors[field.split('.')[1]]
        return newErrors
      })
    }
  }

  // Pool functions (keeping your existing functionality)
  const fetchClientPools = async (client: Client) => {
    try {
      setSelectedClient(client)
      setShowClientPools(true)
      setPoolsLoading(true)

      // Get current assignment for this client
      const assignedTechnician = technicians.find((tech) =>
        tech.assignedClients.includes(client._id.toString())
      )
      setCurrentAssignment(assignedTechnician || null)

      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/pools?clientId=${client._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setClientPools(data.pools || [])
        }
      }
    } catch (err) {
      console.error('Error fetching pools:', err)
    } finally {
      setPoolsLoading(false)
    }
  }

  const handleSavePool = async (updatedPool: Partial<Pool>) => {
    // Your existing pool save logic
    console.log('Saving pool:', updatedPool)
  }

  // Assignment functions
  const assignClientToTechnician = async (
    technicianId: string,
    clientId: string
  ) => {
    setAssignmentLoading(true)
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(
        `/api/technicians/${technicianId}/assign-client`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update current assignment state
          const assignedTechnician = technicians.find(
            (t) => t._id === technicianId
          )
          setCurrentAssignment(assignedTechnician || null)

          // Refresh technicians data
          await fetchTechnicians()

          // Reset form
          setSelectedTechnician('')
          setShowAssignmentSection(false)

          // Show success message (you might want to use a toast instead)
          alert('Client assigned successfully!')
        } else {
          alert('Error: ' + data.error)
        }
      } else {
        alert('Failed to assign client')
      }
    } catch (error) {
      console.error('Error assigning client:', error)
      alert('Error assigning client')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const removeClientAssignment = async (
    technicianId: string,
    clientId: string
  ) => {
    if (!confirm('Are you sure you want to remove this client assignment?')) {
      return
    }

    setAssignmentLoading(true)
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(
        `/api/technicians/${technicianId}/remove-client`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientId }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update current assignment state
          setCurrentAssignment(null)

          // Refresh technicians data
          await fetchTechnicians()

          alert('Assignment removed successfully!')
        } else {
          alert('Error: ' + data.error)
        }
      } else {
        alert('Failed to remove assignment')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Error removing assignment')
    } finally {
      setAssignmentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64 bg-background'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            Client Management
          </h1>
          <p className='text-muted-foreground'>
            Manage retail, service, and maintenance clients
          </p>
        </div>
        <button
          onClick={() => {
            resetClientForm()
            setShowAddClient(true)
          }}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700'>
          <Plus className='h-4 w-4' />
          Add Client
        </button>
      </div>

      {error && (
        <div className='bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg mb-6'>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Filters */}
      <div className='bg-background dark:bg-muted rounded-lg shadow mb-6 p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
              Search
            </label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Search clients...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
              Client Type
            </label>
            <select
              value={clientTypeFilter}
              onChange={(e) => setClientTypeFilter(e.target.value as any)}
              className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
              <option value='all'>All Types</option>
              <option value='retail'>Retail</option>
              <option value='service'>Service</option>
              <option value='maintenance'>Maintenance</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
              Service Frequency
            </label>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value as any)}
              className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
              <option value='all'>All Frequencies</option>
              <option value='twice-weekly'>Twice Weekly</option>
              <option value='weekly'>Weekly</option>
              <option value='bi-weekly'>Bi-weekly</option>
              <option value='monthly'>Monthly</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
              View Mode
            </label>
            <div className='flex space-x-1 bg-background p-1 rounded-lg'>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-muted shadow-sm'
                    : 'hover:bg-muted/50'
                }`}>
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-muted shadow-sm'
                    : 'hover:bg-muted/50'
                }`}>
                Grid
              </button>
            </div>
          </div>
        </div>

        <div className='text-sm text-muted-foreground'>
          Showing {filteredClients.length} of {clients.length} clients
        </div>
      </div>

      {/* Client List */}
      <div className='bg-background rounded-lg shadow'>
        {filteredClients.length === 0 ? (
          <div className='p-8 text-center text-muted-foreground'>
            <Users className='h-12 w-12 mx-auto mb-4 opacity-50' />
            <h3 className='text-lg font-medium mb-2'>No clients found</h3>
            <p>Try adjusting your filters or add a new client.</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-border'>
              <thead className='bg-muted/50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Client
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Contact
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-background divide-y divide-border'>
                {filteredClients.map((client) => (
                  <tr key={client._id.toString()}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        {getClientTypeIcon(client.clientType)}
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-foreground'>
                            {client.name}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {client.address.city}, {client.address.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        {client.clientType}
                      </span>
                      {client.clientType === 'maintenance' && (
                        <div className='text-xs text-muted-foreground mt-1'>
                          {
                            (client as MaintenanceClient).maintenance
                              .serviceFrequency
                          }
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      <div>{client.email}</div>
                      <div className='text-muted-foreground'>
                        {client.phone}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      {isMaintenanceClient(client) && (
                        <button
                          onClick={() => fetchClientPools(client)}
                          className='text-blue-600 hover:text-blue-900 mr-3'>
                          View Pools
                        </button>
                      )}
                      <button className='text-green-600 hover:text-green-900'>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pool Modals (Enhanced with Assignment) */}
      {showClientPools &&
        selectedClient &&
        isMaintenanceClient(selectedClient) && (
          <div className='fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50'>
            <div className='bg-background rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-6'>
                <h3 className='text-lg font-semibold'>
                  Pools & Assignment for {selectedClient.name}
                </h3>
                <button
                  onClick={() => {
                    setShowClientPools(false)
                    setShowAssignmentSection(false)
                    setSelectedTechnician('')
                  }}
                  className='text-gray-500 hover:text-gray-700'>
                  ✕
                </button>
              </div>

              {/* Assignment Section */}
              <div className='bg-muted/50 rounded-lg p-4 mb-6'>
                <div className='flex items-center justify-between mb-4'>
                  <h4 className='font-medium flex items-center gap-2'>
                    <Target className='h-4 w-4' />
                    Technician Assignment
                  </h4>
                  {!showAssignmentSection && (
                    <button
                      onClick={() => setShowAssignmentSection(true)}
                      className='text-blue-600 hover:text-blue-800 text-sm'>
                      {currentAssignment
                        ? 'Change Assignment'
                        : 'Assign Technician'}
                    </button>
                  )}
                </div>

                {currentAssignment ? (
                  <div className='flex items-center justify-between bg-background rounded p-3'>
                    <div className='flex items-center gap-3'>
                      <UserCheck className='h-5 w-5 text-green-600' />
                      <div>
                        <div className='font-medium'>
                          {currentAssignment.name}
                        </div>
                        <div className='text-sm text-muted-foreground'>
                          {currentAssignment.role} •{' '}
                          {currentAssignment.employeeId}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        removeClientAssignment(
                          currentAssignment._id,
                          selectedClient._id.toString()
                        )
                      }
                      disabled={assignmentLoading}
                      className='text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded border border-red-200 hover:bg-red-50 disabled:opacity-50'>
                      {assignmentLoading ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className='flex items-center gap-3 bg-background rounded p-3'>
                    <UserX className='h-5 w-5 text-gray-400' />
                    <div className='text-muted-foreground'>
                      No technician assigned to this client
                    </div>
                  </div>
                )}

                {showAssignmentSection && (
                  <div className='mt-4 bg-background rounded p-4'>
                    <div className='flex gap-3'>
                      <select
                        value={selectedTechnician}
                        onChange={(e) => setSelectedTechnician(e.target.value)}
                        className='flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                        disabled={assignmentLoading}>
                        <option value=''>Select a technician...</option>
                        {technicians
                          .filter((tech) => tech.isActive)
                          .map((tech) => (
                            <option key={tech._id} value={tech._id}>
                              {tech.name} ({tech.role}) -{' '}
                              {tech.assignedClients.length} clients
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => {
                          if (selectedTechnician && selectedClient) {
                            assignClientToTechnician(
                              selectedTechnician,
                              selectedClient._id.toString()
                            )
                          }
                        }}
                        disabled={!selectedTechnician || assignmentLoading}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'>
                        {assignmentLoading ? 'Assigning...' : 'Assign'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAssignmentSection(false)
                          setSelectedTechnician('')
                        }}
                        disabled={assignmentLoading}
                        className='px-4 py-2 border border-input rounded-lg hover:bg-muted/50 disabled:opacity-50'>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pools Section */}
              <div className='bg-muted/50 rounded-lg p-4'>
                <h4 className='font-medium mb-4'>Pool Information</h4>
                {poolsLoading ? (
                  <div className='text-center py-8'>
                    <div className='text-muted-foreground'>
                      Loading pools...
                    </div>
                  </div>
                ) : clientPools.length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    <div className='text-lg mb-2'>No pools found</div>
                    <div className='text-sm'>
                      Add pools for this client to get started
                    </div>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {clientPools.map((pool) => (
                      <div
                        key={pool._id.toString()}
                        className='bg-background rounded p-3'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='font-medium'>
                              {pool.name || 'Unnamed Pool'}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {pool.shape} • {Math.round(pool.volume.gallons)}{' '}
                              gallons
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPool(pool)
                              setShowPoolEditor(true)
                            }}
                            className='text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded border border-blue-200 hover:bg-blue-50'>
                            Edit Pool
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Existing Pool Editor Modal */}
      {showPoolEditor && (
        <TabbedPoolEditor
          pool={selectedPool}
          isOpen={showPoolEditor}
          onClose={() => setShowPoolEditor(false)}
          onSave={handleSavePool}
          saving={poolSaving}
        />
      )}

      {/* Client Creation Modal */}
      {showAddClient && !showCreateForm && (
        <div className='fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50'>
          <div className='bg-background rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>Add New Client</h3>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2'>
                Client Type
              </label>
              <select
                value={selectedClientType}
                onChange={(e) => setSelectedClientType(e.target.value as any)}
                className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
                <option value='maintenance'>Maintenance Client</option>
                <option value='service'>Service Client</option>
                <option value='retail'>Retail Client</option>
              </select>
            </div>

            <div className='flex items-center space-x-4 p-4 bg-muted/50 rounded-lg mb-4'>
              {getClientTypeIcon(selectedClientType)}
              <div>
                <div className='font-medium'>
                  {selectedClientType === 'maintenance' &&
                    'Pool Maintenance Service'}
                  {selectedClientType === 'service' &&
                    'Equipment Service & Repair'}
                  {selectedClientType === 'retail' && 'Product Sales & Supply'}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {selectedClientType === 'maintenance' &&
                    'Regular pool cleaning and chemical balancing'}
                  {selectedClientType === 'service' &&
                    'Equipment repairs, installations, and emergency services'}
                  {selectedClientType === 'retail' &&
                    'Chemical and equipment sales with custom pricing'}
                </div>
              </div>
            </div>

            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowAddClient(false)}
                className='px-4 py-2 text-muted-foreground border border-input rounded-lg hover:bg-muted/50'>
                Cancel
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
