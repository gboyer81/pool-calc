'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'

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

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (technicians.length > 0 && clients.length > 0) {
      calculateStats()
    }
  }, [technicians, clients])

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
        } else {
          alert('Error: ' + data.error)
        }
      } else {
        alert('Failed to remove client assignment')
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Error removing assignment')
    } finally {
      setActionLoading(false)
    }
  }

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'twice-weekly':
        return 'bg-purple-100 text-purple-800'
      case 'weekly':
        return 'bg-blue-100 text-blue-800'
      case 'bi-weekly':
        return 'bg-green-100 text-green-800'
      case 'monthly':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800'
      case 'technician':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className='max-w-screen-2xl mx-auto p-6'>
        {/* Header */}
        <div className='flex flex-col items-center md:flex-row md:justify-between md:items-center mb-6'>
          <div>
            <h1 className='md:mb-0 text-3xl font-bold text-gray-900'>
              Client Assignments
            </h1>
            <p className='text-gray-600 mb-2 md:mb-0'>
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
              className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors'>
              ← Admin Panel
            </button>
          </div>
        </div>

        {error && (
          <div className='bg-red-100 text-red-800 p-4 rounded-lg mb-6'>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* View Toggle */}
        <div className='flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 w-fit'>
          {(['overview', 'technicians', 'clients'] as const).map((viewType) => (
            <button
              key={viewType}
              onClick={() => setView(viewType)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                view === viewType
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Overview */}
        {view === 'overview' && stats && (
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8'>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.totalTechnicians}
              </div>
              <div className='text-sm text-gray-600'>Total Technicians</div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-green-600'>
                {stats.activeTechnicians}
              </div>
              <div className='text-sm text-gray-600'>Active Technicians</div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-purple-600'>
                {stats.totalClients}
              </div>
              <div className='text-sm text-gray-600'>Total Clients</div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-blue-600'>
                {stats.assignedClients}
              </div>
              <div className='text-sm text-gray-600'>Assigned Clients</div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-orange-600'>
                {stats.unassignedClients}
              </div>
              <div className='text-sm text-gray-600'>Unassigned Clients</div>
            </div>
            <div className='bg-white p-6 rounded-lg shadow-sm border'>
              <div className='text-2xl font-bold text-indigo-600'>
                {stats.avgClientsPerTechnician}
              </div>
              <div className='text-sm text-gray-600'>Avg per Technician</div>
            </div>
          </div>
        )}

        {/* Technicians View */}
        {view === 'technicians' && (
          <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
            <div className='px-6 py-4 border-b border-gray-200'>
              <h2 className='text-lg font-semibold text-gray-900'>
                Technicians & Their Assignments
              </h2>
            </div>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Technician
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Role
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Assigned Clients
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Service Areas
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {technicians.map((technician) => (
                    <tr key={technician._id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div>
                          <div className='text-sm font-medium text-gray-900'>
                            {technician.name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {technician.email}
                          </div>
                          <div className='text-xs text-gray-400'>
                            ID: {technician.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            technician.role
                          )}`}>
                          {technician.role.toUpperCase()}
                        </span>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='space-y-1'>
                          <div className='text-sm font-medium text-gray-900'>
                            {technician.assignedClients.length} clients assigned
                          </div>
                          {technician.assignedClients
                            .slice(0, 3)
                            .map((clientId) => {
                              const client = getClientById(clientId)
                              return client ? (
                                <div
                                  key={clientId}
                                  className='flex items-center justify-between bg-gray-50 p-2 rounded text-xs'>
                                  <div>
                                    <span className='font-medium'>
                                      {client.name}
                                    </span>
                                    <span className='text-gray-500 ml-2'>
                                      {client.address.city}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      removeClientFromTechnician(
                                        technician._id,
                                        clientId
                                      )
                                    }
                                    disabled={actionLoading}
                                    className='text-red-600 hover:text-red-800 ml-2'>
                                    ✕
                                  </button>
                                </div>
                              ) : null
                            })}
                          {technician.assignedClients.length > 3 && (
                            <div className='text-xs text-gray-500'>
                              +{technician.assignedClients.length - 3} more
                            </div>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {technician.serviceAreas.length > 0
                          ? technician.serviceAreas.join(', ')
                          : 'No areas set'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            technician.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                          {technician.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Clients View */}
        {view === 'clients' && (
          <div className='space-y-6'>
            {/* Unassigned Clients */}
            {unassignedClients.length > 0 && (
              <div className='bg-orange-50 rounded-lg shadow-sm border border-orange-200'>
                <div className='px-6 py-4 border-b border-orange-200'>
                  <h2 className='text-lg font-semibold text-orange-900'>
                    Unassigned Clients ({unassignedClients.length})
                  </h2>
                </div>
                <div className='p-6'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {unassignedClients.map((client) => (
                      <div
                        key={client._id}
                        className='bg-white p-4 rounded-lg border'>
                        <div className='flex justify-between items-start mb-2'>
                          <div>
                            <h3 className='font-medium text-gray-900'>
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
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyBadgeColor(
                              client.serviceFrequency
                            )}`}>
                            {client.serviceFrequency.replace('-', ' ')}
                          </span>
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

            {/* All Clients */}
            <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
              <div className='px-6 py-4 border-b border-gray-200'>
                <h2 className='text-lg font-semibold text-gray-900'>
                  All Clients & Their Assignments
                </h2>
              </div>
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Client
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Service Details
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Assigned Technician
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {clients
                      .filter((c) => c.isActive)
                      .map((client) => {
                        const assignedTech = getTechnicianForClient(client._id)
                        return (
                          <tr key={client._id} className='hover:bg-gray-50'>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div>
                                <div className='text-sm font-medium text-gray-900'>
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
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyBadgeColor(
                                    client.serviceFrequency
                                  )}`}>
                                  {client.serviceFrequency.replace('-', ' ')}
                                </span>
                                {client.serviceDay && (
                                  <div className='text-xs text-gray-500'>
                                    {client.serviceDay}s
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              {assignedTech ? (
                                <div>
                                  <div className='text-sm font-medium text-gray-900'>
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
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Modal */}
        {showAssignModal && (
          <div className='fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-md'>
              <h3 className='text-lg font-semibold mb-4'>
                Assign Client to Technician
              </h3>

              {selectedClient && (
                <div className='mb-4 p-3 bg-gray-50 rounded'>
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
                  className='px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50'>
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
