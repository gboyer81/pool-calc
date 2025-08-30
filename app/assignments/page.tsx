'use client'

// TODO: Remove old tables use only ClientAssignmentTable

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { Search } from 'lucide-react'
import { useBreadcrumb } from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/lib/toast'
import AssignmentTable from '@/components/AssignmentTable'
import ClientAssignmentTable from '@/components/ClientAssignmentTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

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
  serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  serviceDay?: string
  isActive: boolean
  assignedTechnician?: string // populated client data
  clientType?: 'maintenance' | 'service' | 'retail'
}

interface AssignmentStats {
  totalTechnicians: number
  activeTechnicians: number
  totalClients: number
  assignedClients: number
  unassignedClients: number
  avgClientsPerTechnician: number
}

export default function AssignmentsPage() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedTechnician, setSelectedTechnician] =
    useState<Technician | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [stats, setStats] = useState<AssignmentStats | null>(null)
  const [view, setView] = useState<'overview' | 'technicians' | 'clients'>(
    'overview'
  )
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [clientTypeFilter, setClientTypeFilter] = useState<
    'all' | 'maintenance' | 'service' | 'retail'
  >('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [frequencyFilter, setFrequencyFilter] = useState<
    'all' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  >('all')
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >('all')
  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  const formatServiceFrequency = (
    frequency: string | undefined | null
  ): string => {
    if (!frequency || typeof frequency !== 'string') return 'Not set'
    return frequency.replace('-', ' ')
  }

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Admin', href: '/admin' },
      { label: 'Client Assignments' },
    ])
    fetchData()
  }, [setBreadcrumbs])

  useEffect(() => {
    if (technicians.length > 0 && clients.length > 0) {
      calculateStats()
    }
  }, [technicians, clients])

  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone.includes(searchTerm) ||
          client.address.street
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          client.address.city
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          client.address.state.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Client type filter
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
        if (client.clientType !== 'maintenance') return true // Show all non-maintenance clients
        return client.serviceFrequency === frequencyFilter
      })
    }

    // Assignment filter
    if (assignmentFilter !== 'all') {
      filtered = filtered.filter((client) => {
        const isAssigned = technicians.some((tech) =>
          tech.assignedClients.includes(client._id)
        )
        return assignmentFilter === 'assigned' ? isAssigned : !isAssigned
      })
    }

    setFilteredClients(filtered)
  }, [
    clients,
    searchTerm,
    clientTypeFilter,
    statusFilter,
    frequencyFilter,
    assignmentFilter,
    technicians,
  ])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('technicianToken')

      // Fetch technicians
      const techniciansResponse = await fetch('/api/technicians', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      // Fetch clients
      const clientsResponse = await fetch('/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (techniciansResponse.ok && clientsResponse.ok) {
        const techniciansData = await techniciansResponse.json()
        const clientsData = await clientsResponse.json()

        if (techniciansData.success && clientsData.success) {
          setTechnicians(techniciansData.technicians || [])
          setClients(clientsData.clients || [])

          setError(null)
        } else {
          setError('Failed to fetch data')
        }
      } else {
        setError('Failed to fetch data')
      }
    } catch (err) {
      setError('Network error')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const activeTechnicians = technicians.filter((t) => t.isActive)
    const assignedClientIds = technicians.flatMap((t) => t.assignedClients)
    const assignedClients = assignedClientIds.length
    const totalClients = clients.filter((c) => c.isActive).length

    setStats({
      totalTechnicians: technicians.length,
      activeTechnicians: activeTechnicians.length,
      totalClients,
      assignedClients,
      unassignedClients: totalClients - assignedClients,
      avgClientsPerTechnician:
        activeTechnicians.length > 0
          ? Math.round((assignedClients / activeTechnicians.length) * 10) / 10
          : 0,
    })
  }

  const getClientById = (clientId: string): Client | undefined => {
    return clients.find((c) => c._id === clientId)
  }

  const getTechnicianForClient = (clientId: string): Technician | undefined => {
    return technicians.find((tech) => tech.assignedClients.includes(clientId))
  }

  const assignClientToTechnician = async (
    technicianId: string,
    clientId: string
  ) => {
    setActionLoading(true)
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
          await fetchData() // Refresh data
          setShowAssignModal(false)
          setSelectedClient(null)
          setSelectedTechnician(null)
          showToast.success(
            'Client assigned successfully',
            'The client has been assigned to the technician.'
          )
        } else {
          showToast.error('Assignment failed', data.error)
        }
      } else {
        showToast.error(
          'Assignment failed',
          'Failed to assign client to technician.'
        )
      }
    } catch (error) {
      console.error('Error assigning client:', error)
      showToast.error(
        'Assignment failed',
        'An error occurred while assigning the client.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  const removeClientFromTechnician = async (
    technicianId: string,
    clientId: string
  ) => {
    if (!confirm('Are you sure you want to remove this client assignment?')) {
      return
    }

    setActionLoading(true)
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
          await fetchData() // Refresh data
          showToast.success(
            'Assignment removed',
            'The client assignment has been removed successfully.'
          )
        } else {
          showToast.error('Removal failed', data.error)
        }
      } else {
        showToast.error('Removal failed', 'Failed to remove client assignment.')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      showToast.error(
        'Removal failed',
        'An error occurred while removing the assignment.'
      )
    } finally {
      setActionLoading(false)
    }
  }

  const getFrequencyBadge = (frequency: string | undefined | null) => {
    if (!frequency) {
      return (
        <Badge variant='secondary' className='text-xs'>
          Not set
        </Badge>
      )
    }

    switch (frequency) {
      case 'twice-weekly':
        return (
          <Badge
            variant='outline'
            className='border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs'
          >
            Twice Weekly
          </Badge>
        )
      case 'weekly':
        return (
          <Badge
            variant='outline'
            className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs'
          >
            Weekly
          </Badge>
        )
      case 'bi-weekly':
        return (
          <Badge
            variant='outline'
            className='border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300 text-xs'
          >
            Bi-weekly
          </Badge>
        )
      case 'monthly':
        return (
          <Badge
            variant='outline'
            className='border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 text-xs'
          >
            Monthly
          </Badge>
        )
      default:
        return (
          <Badge variant='secondary' className='text-xs'>
            {frequency}
          </Badge>
        )
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800'
      case 'technician':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-muted text-gray-800'
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'supervisor']}>
        <div className='flex justify-center items-center h-64'>
          <div className='text-lg'>Loading assignments...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'supervisor']}>
      <div className='flex flex-1 flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-blue-100 dark:border-blue-800'>
          <div>
            <h1 className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
              Client Assignments
            </h1>
            <p className='text-muted-foreground mt-1'>
              Manage technician-client assignments
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Button
              onClick={() => setShowAssignModal(true)}
              className='bg-green-600 hover:bg-green-700 text-white'
            >
              + Assign Client
            </Button>
            <Button
              variant='outline'
              onClick={() => (window.location.href = '/admin')}
              className='border-blue-200 dark:border-blue-700'
            >
              ← Admin Panel
            </Button>
          </div>
        </div>

        <div className='flex-1 p-6 space-y-6'>
          {/* Error Handling */}
          {error && (
            <Card className='border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'>
              <CardContent className='p-4'>
                <div className='text-red-800 dark:text-red-300'>
                  <strong>Error:</strong> {error}
                </div>
              </CardContent>
            </Card>
          )}

          {/* View Toggle */}
          <Card className='border-blue-100 dark:border-blue-800'>
            <CardContent className='px-2 py-1'>
              <div className='flex space-x-1 bg-muted p-1 rounded-lg w-fit'>
                {(['overview', 'technicians', 'clients'] as const).map(
                  (viewType) => (
                    <Button
                      key={viewType}
                      onClick={() => setView(viewType)}
                      variant={view === viewType ? 'default' : 'ghost'}
                      size='sm'
                      className={`${
                        view === viewType
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
                    </Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Overview */}
          {view === 'overview' && stats && (
            <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4'>
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {stats.totalTechnicians}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Total Technicians
                  </div>
                </CardContent>
              </Card>
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-green-600'>
                    {stats.activeTechnicians}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Active Technicians
                  </div>
                </CardContent>
              </Card>
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-blue-700 dark:text-blue-300'>
                    {stats.totalClients}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Total Clients
                  </div>
                </CardContent>
              </Card>
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {stats.assignedClients}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Assigned Clients
                  </div>
                </CardContent>
              </Card>
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-orange-600'>
                    {stats.unassignedClients}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Unassigned Clients
                  </div>
                </CardContent>
              </Card>
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardContent className='p-4'>
                  <div className='text-2xl font-bold text-blue-800 dark:text-blue-200'>
                    {stats.avgClientsPerTechnician}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Avg per Technician
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Technicians View */}
          {view === 'technicians' && (
            <Card className='border-blue-100 dark:border-blue-800'>
              <CardHeader>
                <CardTitle className='text-blue-900 dark:text-blue-100'>
                  Technicians & Their Assignments
                </CardTitle>
                <CardDescription>
                  View and manage client assignments for each technician
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssignmentTable
                  technicians={technicians}
                  clients={clients}
                  onAssignClient={assignClientToTechnician}
                  onRemoveClient={removeClientFromTechnician}
                  onViewAssignments={(technician) => {
                    setSelectedTechnician(technician)
                  }}
                  loading={loading}
                />
              </CardContent>
            </Card>
          )}

          {/* Clients View with Search */}
          {view === 'clients' && (
            <div className='space-y-6'>
              {/* Search and Filters */}
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardHeader>
                  <CardTitle className='text-blue-900 dark:text-blue-100 flex items-center gap-2'>
                    <Search className='h-5 w-5' />
                    Search & Filter Clients
                  </CardTitle>
                  <CardDescription>
                    Find and filter clients by various criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
                    <div className='md:col-span-2'>
                      <label className='block text-sm font-medium text-foreground mb-2'>
                        Search Clients
                      </label>
                      <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        <Input
                          placeholder='Search by name, email, phone, or address...'
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className='pl-10 border-blue-200 dark:border-blue-700 focus-visible:ring-blue-500'
                        />
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Client Type
                      </label>
                      <select
                        value={clientTypeFilter}
                        onChange={(e) =>
                          setClientTypeFilter(e.target.value as any)
                        }
                        className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='all'>All Types</option>
                        <option value='maintenance'>Maintenance</option>
                        <option value='service'>Service</option>
                        <option value='retail'>Retail</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Status
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='all'>All Status</option>
                        <option value='active'>Active</option>
                        <option value='inactive'>Inactive</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Assignment
                      </label>
                      <select
                        value={assignmentFilter}
                        onChange={(e) =>
                          setAssignmentFilter(e.target.value as any)
                        }
                        className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                      >
                        <option value='all'>All Clients</option>
                        <option value='assigned'>Assigned</option>
                        <option value='unassigned'>Unassigned</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Frequency
                      </label>
                      <select
                        value={frequencyFilter}
                        onChange={(e) =>
                          setFrequencyFilter(e.target.value as any)
                        }
                        className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                        disabled={
                          clientTypeFilter !== 'all' &&
                          clientTypeFilter !== 'maintenance'
                        }
                      >
                        <option value='all'>All Frequencies</option>
                        <option value='twice-weekly'>Twice Weekly</option>
                        <option value='weekly'>Weekly</option>
                        <option value='bi-weekly'>Bi-weekly</option>
                        <option value='monthly'>Monthly</option>
                      </select>
                    </div>
                  </div>

                  {/* Results summary */}
                  <div className='mt-3 text-sm text-muted-foreground mx-4'>
                    Showing {filteredClients.length} of {clients.length} clients
                    {searchTerm && ` matching "${searchTerm}"`}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats for Filtered Results */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='bg-blue-50 p-4 rounded-lg border'>
                  <div className='text-lg font-bold text-blue-600'>
                    {
                      filteredClients.filter((c) =>
                        technicians.some((t) =>
                          t.assignedClients.includes(c._id)
                        )
                      ).length
                    }
                  </div>
                  <div className='text-sm text-muted-foreground'>Assigned</div>
                </div>
                <div className='bg-orange-50 p-4 rounded-lg border'>
                  <div className='text-lg font-bold text-orange-600'>
                    {
                      filteredClients.filter(
                        (c) =>
                          !technicians.some((t) =>
                            t.assignedClients.includes(c._id)
                          )
                      ).length
                    }
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Unassigned
                  </div>
                </div>
                <div className='bg-green-50 p-4 rounded-lg border'>
                  <div className='text-lg font-bold text-green-600'>
                    {filteredClients.filter((c) => c.isActive).length}
                  </div>
                  <div className='text-sm text-muted-foreground'>Active</div>
                </div>
                <div className='bg-purple-50 p-4 rounded-lg border'>
                  <div className='text-lg font-bold text-purple-600'>
                    {
                      filteredClients.filter(
                        (c) => c.clientType === 'maintenance'
                      ).length
                    }
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    Maintenance
                  </div>
                </div>
              </div>

              {/* Client Assignments Table */}
              <Card className='border-blue-100 dark:border-blue-800'>
                <CardHeader>
                  <CardTitle className='text-blue-900 dark:text-blue-100'>
                    Client Assignments ({filteredClients.length})
                  </CardTitle>
                  <CardDescription>
                    Manage client assignments and technician relationships
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                  <ClientAssignmentTable
                    clients={filteredClients}
                    technicians={technicians}
                    onAssignClient={assignClientToTechnician}
                    onUnassignClient={(clientId) => {
                      const assignedTech = technicians.find((t) =>
                        t.assignedClients.includes(clientId)
                      )
                      if (assignedTech) {
                        removeClientFromTechnician(assignedTech._id, clientId)
                      }
                    }}
                    loading={loading}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Assignment Modal */}
          {showAssignModal && (
            <div className='fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 z-50'>
              <div className='bg-background rounded-lg p-6 w-full max-w-md'>
                <h3 className='text-lg font-semibold mb-4'>
                  Assign Client to Technician
                </h3>

                {selectedClient && (
                  <div className='mb-4 p-3 bg-muted/50 rounded'>
                    <div className='font-medium'>{selectedClient.name}</div>
                    <div className='text-sm text-gray-500'>
                      {selectedClient.address.city},{' '}
                      {selectedClient.address.state}
                    </div>
                  </div>
                )}

                <div className='space-y-3 mb-6'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Select Technician:
                  </label>
                  {technicians
                    .filter((t) => t.isActive && t.role === 'technician')
                    .map((tech) => (
                      <div
                        key={tech._id}
                        className='flex items-center justify-between p-3 border rounded'
                      >
                        <div>
                          <div className='font-medium'>{tech.name}</div>
                          <div className='text-sm text-gray-500'>
                            {tech.assignedClients.length} clients assigned
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            selectedClient &&
                            assignClientToTechnician(
                              tech._id,
                              selectedClient._id
                            )
                          }
                          disabled={actionLoading}
                          className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50'
                        >
                          {actionLoading ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                </div>

                <div className='flex justify-end space-x-3'>
                  <Button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedClient(null)
                    }}
                    variant='outline'
                    className='border-blue-200 dark:border-blue-700'
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
