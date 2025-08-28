'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { Search } from 'lucide-react'
import { useBreadcrumb } from '@/components/Navigation'
import { Badge } from '@/components/ui/badge'
import { showToast } from '@/lib/toast'
import AssignmentTable from '@/components/AssignmentTable'
import ClientAssignmentTable from '@/components/ClientAssignmentTable'

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
  const [unassignedClients, setUnassignedClients] = useState<Client[]>([])
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
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Admin', href: '/admin' },
      { label: 'Client Assignments' }
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

          // Find unassigned clients
          const allAssignedClientIds = (
            techniciansData.technicians || []
          ).flatMap((tech: Technician) => tech.assignedClients)

          const unassigned = (clientsData.clients || []).filter(
            (client: Client) =>
              !allAssignedClientIds.includes(client._id) && client.isActive
          )

          setUnassignedClients(unassigned)
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
          showToast.success('Client assigned successfully', 'The client has been assigned to the technician.')
        } else {
          showToast.error('Assignment failed', data.error)
        }
      } else {
        showToast.error('Assignment failed', 'Failed to assign client to technician.')
      }
    } catch (error) {
      console.error('Error assigning client:', error)
      showToast.error('Assignment failed', 'An error occurred while assigning the client.')
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
          showToast.success('Assignment removed', 'The client assignment has been removed successfully.')
        } else {
          showToast.error('Removal failed', data.error)
        }
      } else {
        showToast.error('Removal failed', 'Failed to remove client assignment.')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      showToast.error('Removal failed', 'An error occurred while removing the assignment.')
    } finally {
      setActionLoading(false)
    }
  }

  const getFrequencyBadge = (frequency: string | undefined | null) => {
    if (!frequency) {
      return (
        <Badge variant="secondary" className="text-xs">
          Not set
        </Badge>
      )
    }

    switch (frequency) {
      case 'twice-weekly':
        return (
          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300 text-xs">
            Twice Weekly
          </Badge>
        )
      case 'weekly':
        return (
          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs">
            Weekly
          </Badge>
        )
      case 'bi-weekly':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:text-green-300 text-xs">
            Bi-weekly
          </Badge>
        )
      case 'monthly':
        return (
          <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300 text-xs">
            Monthly
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="text-xs">
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
      <div className='p-6'>
        {/* Header */}
        <div className='flex flex-col items-center md:flex-row md:justify-between md:items-center mb-6'>
          <div>
            <h1 className='md:mb-0 text-3xl font-bold text-foreground'>
              Client Assignments
            </h1>
            <p className='text-muted-foreground mb-2 md:mb-0'>
              Manage technician-client assignments
            </p>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={() => setShowAssignModal(true)}
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'>
              + Assign Client
            </button>
            <button
              onClick={() => (window.location.href = '/admin')}
              className='bg-muted/50 text-gray-700 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors'>
              ← Admin Panel
            </button>
          </div>
        </div>

        {error && (
          <div className='bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 p-4 rounded-lg mb-6'>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* View Toggle */}
        <div className='flex space-x-1 bg-muted p-1 rounded-lg mb-6 w-fit'>
          {(['overview', 'technicians', 'clients'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === viewType
                  ? 'bg-background text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        {view === 'overview' && stats && (
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8'>
            <div className='bg-background p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.totalTechnicians}
              </div>
              <div className='text-sm text-muted-foreground'>
                Total Technicians
              </div>
            </div>
            <div className='bg-background p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.activeTechnicians}
              </div>
              <div className='text-sm text-muted-foreground'>
                Active Technicians
              </div>
            </div>
            <div className='bg-background p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-purple-600'>
                {stats.totalClients}
              </div>
              <div className='text-sm text-muted-foreground'>Total Clients</div>
            </div>
            <div className='bg-background p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.assignedClients}
              </div>
              <div className='text-sm text-muted-foreground'>
                Assigned Clients
              </div>
            </div>
            <div className='bg-background p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-orange-600'>
                {stats.unassignedClients}
              </div>
              <div className='text-sm text-muted-foreground'>
                Unassigned Clients
              </div>
            </div>
            <div className='bg-background p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-indigo-600'>
                {stats.avgClientsPerTechnician}
              </div>
              <div className='text-sm text-muted-foreground'>
                Avg per Technician
              </div>
            </div>
          </div>
        )}

        {/* Technicians View */}
        {view === 'technicians' && (
          <div className='space-y-4'>
            <div className='bg-background rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-foreground mb-4'>
                Technicians & Their Assignments
              </h2>
              <AssignmentTable
                technicians={technicians}
                clients={clients}
                onAssignClient={assignClientToTechnician}
                onRemoveClient={removeClientFromTechnician}
                onViewAssignments={(technician) => {
                  setSelectedTechnician(technician)
                  // Additional logic for viewing assignments
                }}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* Clients View with Search */}
        {view === 'clients' && (
          <div className='space-y-6'>
            {/* Search and Filters */}
            <div className='bg-background p-4 rounded-lg shadow border'>
              <div className='grid grid-cols-1 md:grid-cols-6 gap-4'>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Search Clients
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <input
                      type='text'
                      placeholder='Search by name, email, phone, or address...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10 pr-4 py-2 w-full border border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Client Type
                  </label>
                  <select
                    value={clientTypeFilter}
                    onChange={(e) => setClientTypeFilter(e.target.value as any)}
                    className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
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
                    className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
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
                    onChange={(e) => setAssignmentFilter(e.target.value as any)}
                    className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'>
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
                    onChange={(e) => setFrequencyFilter(e.target.value as any)}
                    className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                    disabled={
                      clientTypeFilter !== 'all' &&
                      clientTypeFilter !== 'maintenance'
                    }>
                    <option value='all'>All Frequencies</option>
                    <option value='twice-weekly'>Twice Weekly</option>
                    <option value='weekly'>Weekly</option>
                    <option value='bi-weekly'>Bi-weekly</option>
                    <option value='monthly'>Monthly</option>
                  </select>
                </div>
              </div>

              {/* Results summary */}
              <div className='mt-3 text-sm text-muted-foreground'>
                Showing {filteredClients.length} of {clients.length} clients
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            </div>

            {/* Quick Stats for Filtered Results */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='bg-blue-50 p-4 rounded-lg border'>
                <div className='text-lg font-bold text-blue-600'>
                  {
                    filteredClients.filter((c) =>
                      technicians.some((t) => t.assignedClients.includes(c._id))
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
                <div className='text-sm text-muted-foreground'>Unassigned</div>
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
                <div className='text-sm text-muted-foreground'>Maintenance</div>
              </div>
            </div>

            {/* Unassigned Clients - Now filtered */}
            {filteredClients.filter(
              (c) =>
                !technicians.some((t) => t.assignedClients.includes(c._id)) &&
                c.isActive
            ).length > 0 &&
              (assignmentFilter === 'all' ||
                assignmentFilter === 'unassigned') && (
                <div className='bg-orange-50 rounded-lg shadow-sm border border-orange-200'>
                  <div className='px-6 py-4 border-b border-orange-200'>
                    <h2 className='text-lg font-semibold text-orange-900'>
                      Unassigned Clients (
                      {
                        filteredClients.filter(
                          (c) =>
                            !technicians.some((t) =>
                              t.assignedClients.includes(c._id)
                            ) && c.isActive
                        ).length
                      }
                      )
                    </h2>
                  </div>
                  <div className='p-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                      {filteredClients
                        .filter(
                          (c) =>
                            !technicians.some((t) =>
                              t.assignedClients.includes(c._id)
                            ) && c.isActive
                        )
                        .map((client) => (
                          <div
                            key={client._id}
                            className='bg-background p-4 rounded-lg border'>
                            <div className='flex justify-between items-start mb-2'>
                              <div>
                                <h3 className='font-medium text-foreground'>
                                  {client.name}
                                </h3>
                                <p className='text-sm text-gray-500'>
                                  {client.address.city}, {client.address.state}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedClient(client)
                                  setShowAssignModal(true)
                                }}
                                className='text-green-600 hover:text-green-800 text-sm'>
                                Assign
                              </button>
                            </div>
                            <div className='flex items-center space-x-2'>
                              {getFrequencyBadge(client.serviceFrequency)}
                              {client.serviceDay && (
                                <span className='text-xs text-gray-500'>
                                  {client.serviceDay}s
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

            {/* All Clients Table - Now with filtered results */}
            <div className='bg-background rounded-lg shadow-sm border overflow-hidden'>
              <div className='px-6 py-4 border-b border-border'>
                <h2 className='text-lg font-semibold text-foreground'>
                  Client Assignments ({filteredClients.length})
                </h2>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-muted/50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Service Info
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Assigned Technician
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-background divide-y divide-gray-200'>
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className='px-6 py-8 text-center text-gray-500'>
                          No clients found matching your filters
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => {
                        const assignedTech = getTechnicianForClient(client._id)
                        return (
                          <tr key={client._id} className='hover:bg-muted/50'>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div>
                                <div className='text-sm font-medium text-foreground'>
                                  {client.name}
                                </div>
                                <div className='text-sm text-gray-500'>
                                  {client.email}
                                </div>
                                <div className='text-xs text-gray-400'>
                                  {client.address.street}, {client.address.city}
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='space-y-1'>
                                {getFrequencyBadge(client.serviceFrequency)}
                                {client.serviceDay && (
                                  <div className='text-xs text-gray-500'>
                                    {client.serviceDay}s
                                  </div>
                                )}
                                <div className='text-xs text-gray-500'>
                                  Type: {client.clientType || 'maintenance'}
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              {assignedTech ? (
                                <div>
                                  <div className='text-sm font-medium text-foreground'>
                                    {assignedTech.name}
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    {assignedTech.employeeId}
                                  </div>
                                </div>
                              ) : (
                                <span className='text-sm text-orange-600 font-medium'>
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm space-x-2'>
                              {assignedTech ? (
                                <button
                                  onClick={() =>
                                    removeClientFromTechnician(
                                      assignedTech._id,
                                      client._id
                                    )
                                  }
                                  disabled={actionLoading}
                                  className='text-red-600 hover:text-red-800'>
                                  Remove
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedClient(client)
                                    setShowAssignModal(true)
                                  }}
                                  className='text-green-600 hover:text-green-800'>
                                  Assign
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modern Client Assignment Table (Alternative View) */}
        {view === 'clients' && (
          <div className='mt-6 space-y-4'>
            <div className='bg-background rounded-lg shadow-sm border p-6'>
              <h2 className='text-lg font-semibold text-foreground mb-4'>
                Client Assignments (Table View)
              </h2>
              <ClientAssignmentTable
                clients={filteredClients}
                technicians={technicians}
                onAssignClient={assignClientToTechnician}
                onUnassignClient={(clientId) => {
                  const assignedTech = technicians.find(t => t.assignedClients.includes(clientId))
                  if (assignedTech) {
                    removeClientFromTechnician(assignedTech._id, clientId)
                  }
                }}
                loading={loading}
              />
            </div>
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
                      className='flex items-center justify-between p-3 border rounded'>
                      <div>
                        <div className='font-medium'>{tech.name}</div>
                        <div className='text-sm text-gray-500'>
                          {tech.assignedClients.length} clients assigned
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          selectedClient &&
                          assignClientToTechnician(tech._id, selectedClient._id)
                        }
                        disabled={actionLoading}
                        className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50'>
                        {actionLoading ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
              </div>

              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedClient(null)
                  }}
                  className='px-4 py-2 text-muted-foreground border border-input rounded hover:bg-muted/50'>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
