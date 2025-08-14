// app/clients/page.tsx
'use client'

import React, { useState, useEffect } from 'react'

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
      const response = await fetch('/api/clients')
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
      const response = await fetch(`/api/pools?clientId=${client._id}`)
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
    <div className='max-w-7xl mx-auto p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Client Management
          </h1>
          <p className='text-gray-600 mt-1'>{clients.length} clients</p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => setShowAddClient(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
            + Add New Client
          </button>
          <button className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'>
            📅 Schedule View
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className='bg-white rounded-lg shadow p-4 mb-6'>
        <div className='flex flex-wrap gap-4 items-center'>
          <select className='border border-gray-300 rounded px-3 py-2'>
            <option>All Service Frequencies</option>
            <option>Twice Weekly</option>
            <option>Weekly</option>
            <option>Bi-Weekly</option>
            <option>Monthly</option>
          </select>
          <select className='border border-gray-300 rounded px-3 py-2'>
            <option>All Service Days</option>
            <option>Monday</option>
            <option>Tuesday</option>
            <option>Wednesday</option>
            <option>Thursday</option>
            <option>Friday</option>
          </select>
          <input
            type='text'
            placeholder='Search clients...'
            className='border border-gray-300 rounded px-3 py-2 flex-1 min-w-64'
          />
        </div>
      </div>

      {/* Client Cards Grid */}
      {clients.length === 0 ? (
        <div className='text-center p-10 bg-gray-50 rounded-lg border border-gray-200 text-gray-500'>
          <h3 className='text-lg font-semibold mb-3'>No clients found</h3>
          <p>Add your first client to get started!</p>
          <button
            onClick={() => setShowAddClient(true)}
            className='mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
            + Add Client
          </button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {clients.map((client) => (
            <div
              key={client._id}
              className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'>
              <div className='p-6'>
                {/* Client Header */}
                <div className='flex justify-between items-start mb-4'>
                  <div>
                    <h3 className='text-xl font-semibold text-gray-900'>
                      {client.name}
                    </h3>
                    <p className='text-gray-600 text-sm'>{client.email}</p>
                    <p className='text-gray-600 text-sm'>{client.phone}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadgeColor(
                      client.serviceFrequency
                    )}`}>
                    {client.serviceFrequency.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Address */}
                <div className='mb-4'>
                  <p className='text-sm text-gray-700'>
                    📍 {client.address.street}
                    <br />
                    {client.address.city}, {client.address.state}{' '}
                    {client.address.zipCode}
                  </p>
                </div>

                {/* Service Info */}
                <div className='mb-4 space-y-2'>
                  {client.serviceDay && (
                    <p className='text-sm'>
                      <span className='font-medium'>Service Day:</span>{' '}
                      {client.serviceDay}
                    </p>
                  )}
                  {client.preferredTimeSlot && (
                    <p className='text-sm'>
                      <span className='font-medium'>Preferred Time:</span>{' '}
                      {client.preferredTimeSlot}
                    </p>
                  )}
                  {client.nextServiceDate && (
                    <p className='text-sm'>
                      <span className='font-medium'>Next Service:</span>{' '}
                      {new Date(client.nextServiceDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Special Instructions */}
                {client.specialInstructions && (
                  <div className='mb-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400'>
                    <p className='text-sm text-yellow-800'>
                      <span className='font-medium'>Special Instructions:</span>
                      <br />
                      {client.specialInstructions}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='flex gap-2 pt-4 border-t border-gray-200'>
                  <button
                    onClick={() => handleViewPools(client)}
                    className='flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors'>
                    View Pools
                  </button>
                  <button className='flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors'>
                    Log Visit
                  </button>
                  <button className='bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300 transition-colors'>
                    ⚙️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Pools Modal */}
      {showClientPools && selectedClient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg max-w-4xl w-full mx-4 max-h-96 overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-2xl font-bold'>
                  Pools for {selectedClient.name}
                </h2>
                <button
                  onClick={() => setShowClientPools(false)}
                  className='text-gray-500 hover:text-gray-700 text-2xl'>
                  ✕
                </button>
              </div>

              <div className='space-y-4'>
                {clientPools.length === 0 ? (
                  <div className='text-center p-8 text-gray-500'>
                    <p>No pools found for this client.</p>
                  </div>
                ) : (
                  clientPools.map((pool) => (
                    <div
                      key={pool._id}
                      className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex justify-between items-start'>
                        <div>
                          <h3 className='text-lg font-semibold'>{pool.name}</h3>
                          <p className='text-gray-600'>
                            {pool.shape} •{' '}
                            {pool.volume.gallons.toLocaleString()} gallons •{' '}
                            {pool.type}
                          </p>
                          <div className='mt-2 text-sm text-gray-700'>
                            <p>Target pH: {pool.targetLevels.ph.target}</p>
                            <p>
                              Target Free Chlorine:{' '}
                              {pool.targetLevels.freeChlorine.target} ppm
                            </p>
                            <p>
                              Target Alkalinity:{' '}
                              {pool.targetLevels.totalAlkalinity.target} ppm
                            </p>
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
                            View History
                          </button>
                          <button className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700'>
                            Log Visit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className='mt-6 flex justify-end'>
                <button className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
                  + Add New Pool
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal (placeholder) */}
      {showAddClient && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg max-w-2xl w-full mx-4'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-2xl font-bold'>Add New Client</h2>
                <button
                  onClick={() => setShowAddClient(false)}
                  className='text-gray-500 hover:text-gray-700 text-2xl'>
                  ✕
                </button>
              </div>
              <p className='text-gray-600'>Client form would go here...</p>
              <div className='mt-6 flex justify-end gap-3'>
                <button
                  onClick={() => setShowAddClient(false)}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400'>
                  Cancel
                </button>
                <button className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
                  Save Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
