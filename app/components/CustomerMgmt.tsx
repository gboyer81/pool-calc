'use client'

import React, { useState, useEffect } from 'react'
import TabbedPoolEditor from '@/components/TabbedPoolEditor'

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
  dimensions?: {
    length?: number
    width?: number
    diameter?: number
    avgDepth: number
  }
  notes?: string
  // Add these optional properties for the tabbed editor
  equipment?: {
    filter?: {
      type: 'sand' | 'cartridge' | 'de'
      model?: string
    }
    pump?: {
      model?: string
      horsepower?: number
    }
    heater?: {
      type: 'gas' | 'electric' | 'heat-pump'
      model?: string
    }
    saltSystem?: {
      model?: string
      targetSalt: number
    }
  }
  extendedTargetLevels?: {
    ph?: { min?: number; max?: number; target: number }
    freeChlorine?: { min?: number; max?: number; target: number }
    totalAlkalinity?: { min?: number; max?: number; target: number }
    calciumHardness?: { min?: number; max?: number; target?: number }
    cyanuricAcid?: { min?: number; max?: number; target?: number }
    salt?: { min?: number; max?: number; target?: number }
  }
}

interface PoolFormData {
  name: string
  type: 'residential' | 'commercial'
  shape: string
  gallons: string
  avgDepth: string
  phTarget: string
  freeChlorineTarget: string
  totalAlkalinityTarget: string
  notes: string
}

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientPools, setShowClientPools] = useState(false)
  const [clientPools, setClientPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pool editing state
  const [showEditPool, setShowEditPool] = useState(false)
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  const [poolSaving, setPoolSaving] = useState(false)

  // Fetch clients
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('technicianToken')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch('/api/clients', {
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

  const fetchClientPools = async (client: Client) => {
    try {
      setSelectedClient(client)
      const token = localStorage.getItem('technicianToken')
      if (!token) {
        window.location.href = '/login'
        return
      }

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

  const handleEditPool = (pool: Pool) => {
    console.log('🐛 handleEditPool triggered with pool:', pool)
    setEditingPool(pool)
    setShowEditPool(true)
  }

  const handleSavePool = async (updatedPoolData: Partial<Pool>) => {
    if (!editingPool) return

    try {
      setPoolSaving(true)
      const token = localStorage.getItem('technicianToken')
      if (!token) {
        window.location.href = '/login'
        return
      }

      const response = await fetch(`/api/pools/${editingPool._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPoolData),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the pools list
        if (selectedClient) {
          await fetchClientPools(selectedClient)
        }
        setShowEditPool(false)
        setEditingPool(null)
        alert('Pool updated successfully!')
      } else {
        throw new Error(data.error || 'Failed to update pool')
      }
    } catch (error: any) {
      console.error('Error saving pool:', error)
      alert('Error saving pool: ' + error.message)
    } finally {
      setPoolSaving(false)
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

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='text-lg'>Loading clients...</div>
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
          <p className='text-gray-600 mt-1'>{clients.length} active clients</p>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={() => setShowAddClient(true)}
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
            + Add Client
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className='bg-red-100 text-red-800 p-4 rounded-lg mb-6'>
          <strong>Error:</strong> {error}
          <button
            onClick={() => {
              setError(null)
              fetchClients()
            }}
            className='ml-4 bg-red-600 text-white px-3 py-1 rounded'>
            Retry
          </button>
        </div>
      )}

      {/* Client Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {clients.map((client) => (
          <div
            key={client._id}
            className='bg-white rounded-lg shadow p-6 border border-gray-200'>
            <div className='flex justify-between items-start mb-3'>
              <h3 className='text-lg font-semibold text-gray-900'>
                {client.name}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className='space-y-2 text-sm text-gray-600'>
              <p>📧 {client.email}</p>
              <p>📞 {client.phone}</p>
              <p>
                📍 {client.address.street}, {client.address.city}
              </p>
              <div className='flex items-center gap-2'>
                <span>🗓️</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyBadgeColor(
                    client.serviceFrequency
                  )}`}>
                  {client.serviceFrequency}
                </span>
              </div>
            </div>
            <div className='mt-4 flex gap-2'>
              <button
                onClick={() => fetchClientPools(client)}
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
        ))}
      </div>

      {/* Client Pools Modal */}
      {showClientPools && selectedClient && (
        <div className='fixed inset-0 bg-black/70 backdrop-blur-xl flex items-center justify-center z-50'>
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
                {clientPools.map((pool) => (
                  <div
                    key={pool._id}
                    className='border border-gray-200 rounded-lg p-4'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <h3 className='text-lg font-semibold'>{pool.name}</h3>
                        <p className='text-gray-600'>
                          {pool.shape} • {pool.volume.gallons.toLocaleString()}{' '}
                          gallons • {pool.type}
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
                        <button
                          onClick={() => handleEditPool(pool)}
                          className='bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700'>
                          ⚙️ Edit
                        </button>
                        <button className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
                          View History
                        </button>
                        <button className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700'>
                          Log Visit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Edit Pool Modal */}
      {showEditPool && editingPool && (
        <TabbedPoolEditor
          pool={editingPool}
          isOpen={showEditPool}
          onClose={() => {
            setShowEditPool(false)
            setEditingPool(null)
          }}
          onSave={handleSavePool}
          saving={poolSaving}
        />
      )}

      {/* Add Client Modal (placeholder) */}
      {showAddClient && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50'>
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
