// app/clients/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'

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
  preferredTimeSlot?: string
  specialInstructions?: string
  isActive: boolean
  createdAt: string
  nextServiceDate?: string
}

interface Pool {
  _id: string
  clientId: string
  name: string
  type: 'residential' | 'commercial'
  shape: string
  volume: { gallons: number }
  targetLevels: {
    ph: { target: number }
    freeChlorine: { target: number }
    totalAlkalinity: { target: number }
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientPools, setShowClientPools] = useState(false)
  const [clientPools, setClientPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients from API
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)

      // Get token from localStorage
      const token = localStorage.getItem('technicianToken')
      if (!token) {
        window.location.href = '/login'
        return
      }

      // FIX: Include authentication header
      const response = await fetch('/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('technicianToken')
        localStorage.removeItem('technicianData')
        window.location.href = '/login'
        return
      }

      const data = await response.json()

      if (data.success) {
        setClients(data.clients || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch clients')
      }
    } catch (err) {
      setError('Network error - unable to fetch clients')
      console.error('Error fetching clients:', err)
    } finally {
      setLoading(false)
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

  const handleViewPools = async (client: Client) => {
    try {
      setSelectedClient(client)

      // Get token for authenticated request
      const token = localStorage.getItem('technicianToken')
      if (!token) {
        window.location.href = '/login'
        return
      }

      // FIX: Include authentication header for pools request too
      const response = await fetch(`/api/pools?clientId=${client._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.status === 401) {
        localStorage.removeItem('technicianToken')
        localStorage.removeItem('technicianData')
        window.location.href = '/login'
        return
      }

      const data = await response.json()

      if (data.success) {
        setClientPools(data.pools || [])
      } else {
        setClientPools([])
        setError(data.error || 'Failed to fetch pools')
      }
      setShowClientPools(true)
    } catch (err) {
      setError('Failed to fetch pools')
      console.error('Error fetching pools:', err)
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-lg'>Loading clients...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='max-w-7xl mx-auto p-6'>
        <div className='bg-red-100 text-red-800 p-4 rounded-lg'>
          <strong>Error:</strong> {error}
          <button
            onClick={() => {
              setError(null)
              fetchClients()
            }}
            className='ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700'>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['technician', 'supervisor', 'admin']}>
      <div className='max-w-7xl mx-auto p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Client Management
            </h1>
            <p className='text-gray-600'>
              Manage your pool service clients and their information
            </p>
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
            Add New Client
          </button>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Total Clients
            </h3>
            <p className='text-3xl font-bold text-blue-600'>{clients.length}</p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Active Clients
            </h3>
            <p className='text-3xl font-bold text-green-600'>
              {clients.filter((c) => c.isActive).length}
            </p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Weekly Service
            </h3>
            <p className='text-3xl font-bold text-purple-600'>
              {clients.filter((c) => c.serviceFrequency === 'weekly').length}
            </p>
          </div>
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-semibold text-gray-900'>
              Bi-Weekly Service
            </h3>
            <p className='text-3xl font-bold text-orange-600'>
              {clients.filter((c) => c.serviceFrequency === 'bi-weekly').length}
            </p>
          </div>
        </div>

        {/* Clients Table */}
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          <div className='px-6 py-4 border-b border-gray-200'>
            <h2 className='text-xl font-semibold text-gray-900'>All Clients</h2>
          </div>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Client
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Contact
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Address
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Service
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {clients.map((client) => (
                  <tr key={client._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {client.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          ID: {client._id.slice(-6)}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {client.email}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {client.phone}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        {client.address.street}
                      </div>
                      <div className='text-sm text-gray-500'>
                        {client.address.city}, {client.address.state}{' '}
                        {client.address.zipCode}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFrequencyBadgeColor(
                          client.serviceFrequency
                        )}`}>
                        {client.serviceFrequency}
                      </span>
                      {client.serviceDay && (
                        <div className='text-xs text-gray-500 mt-1'>
                          {client.serviceDay}s
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                      <div className='flex space-x-2'>
                        <button
                          onClick={() => handleViewPools(client)}
                          className='text-blue-600 hover:text-blue-900'>
                          View Pools
                        </button>
                        <button
                          onClick={() => setSelectedClient(client)}
                          className='text-indigo-600 hover:text-indigo-900'>
                          Edit
                        </button>
                        <button className='text-red-600 hover:text-red-900'>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Pools Modal */}
        {showClientPools && selectedClient && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto'>
              <div className='p-6 border-b border-gray-200'>
                <div className='flex justify-between items-center'>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    Pools for {selectedClient.name}
                  </h2>
                  <button
                    onClick={() => setShowClientPools(false)}
                    className='text-gray-400 hover:text-gray-600'>
                    ✕
                  </button>
                </div>
              </div>
              <div className='p-6'>
                {clientPools.length === 0 ? (
                  <p className='text-gray-500 text-center py-8'>
                    No pools found for this client.
                  </p>
                ) : (
                  <div className='grid gap-4'>
                    {clientPools.map((pool) => (
                      <div
                        key={pool._id}
                        className='border border-gray-200 rounded-lg p-4'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <h3 className='font-semibold text-gray-900'>
                              {pool.name}
                            </h3>
                            <p className='text-sm text-gray-600'>
                              {pool.type} • {pool.shape}
                            </p>
                            <p className='text-sm text-gray-600'>
                              Volume: {pool.volume.gallons.toLocaleString()}{' '}
                              gallons
                            </p>
                          </div>
                          <div className='text-right text-sm text-gray-600'>
                            <div>pH Target: {pool.targetLevels.ph.target}</div>
                            <div>
                              FC Target: {pool.targetLevels.freeChlorine.target}
                            </div>
                            <div>
                              TA Target:{' '}
                              {pool.targetLevels.totalAlkalinity.target}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Client Modal - Placeholder */}
        {showAddClient && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-2xl w-full'>
              <div className='p-6 border-b border-gray-200'>
                <div className='flex justify-between items-center'>
                  <h2 className='text-xl font-semibold text-gray-900'>
                    Add New Client
                  </h2>
                  <button
                    onClick={() => setShowAddClient(false)}
                    className='text-gray-400 hover:text-gray-600'>
                    ✕
                  </button>
                </div>
              </div>
              <div className='p-6'>
                <p className='text-gray-500 text-center py-8'>
                  Add client form will be implemented here.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
