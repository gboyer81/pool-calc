'use client'

import React, { useState, useEffect } from 'react'
import TabbedPoolEditor from './TabbedPoolEditor'

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
  equipment?: {
    filter?: {
      type: 'sand' | 'cartridge' | 'de'
      model?: string
      lastCleaned?: Date | string
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
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showClientPools, setShowClientPools] = useState(false)
  const [clientPools, setClientPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [frequencyFilter, setFrequencyFilter] = useState<
    'all' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  >('all')
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'frequency'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Pool editing state
  const [showEditPool, setShowEditPool] = useState(false)
  const [editingPool, setEditingPool] = useState<Pool | null>(null)
  const [poolSaving, setPoolSaving] = useState(false)

  // View toggle state
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Add client form state
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
    serviceFrequency: 'weekly' as
      | 'twice-weekly'
      | 'weekly'
      | 'bi-weekly'
      | 'monthly',
    serviceDay: '',
    preferredTimeSlot: '',
    specialInstructions: '',
  })
  const [clientFormErrors, setClientFormErrors] = useState<
    Record<string, string>
  >({})
  const [clientSaving, setClientSaving] = useState(false)

  // Fetch clients
  useEffect(() => {
    fetchClients()
  }, [])

  // Filter and search clients
  useEffect(() => {
    let filtered = [...clients]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(term) ||
          client.email.toLowerCase().includes(term) ||
          client.phone.includes(term) ||
          client.address.street.toLowerCase().includes(term) ||
          client.address.city.toLowerCase().includes(term) ||
          client.address.state.toLowerCase().includes(term) ||
          client.address.zipCode.includes(term)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((client) =>
        statusFilter === 'active' ? client.isActive : !client.isActive
      )
    }

    // Apply frequency filter
    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(
        (client) => client.serviceFrequency === frequencyFilter
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'city':
          aValue = a.address.city.toLowerCase()
          bValue = b.address.city.toLowerCase()
          break
        case 'frequency':
          aValue = a.serviceFrequency
          bValue = b.serviceFrequency
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter, frequencyFilter, sortBy, sortOrder])

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

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setClients(data.clients || [])
          setError(null)
        } else {
          setError(data.error || 'Failed to fetch clients')
        }
      } else {
        setError('Failed to fetch clients')
      }
    } catch (err) {
      setError('Network error')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchClientPools = async (client: Client) => {
    try {
      setSelectedClient(client)
      setShowClientPools(true)

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
        } else {
          console.error('Failed to fetch pools:', data.error)
          setClientPools([])
        }
      } else {
        console.error('Failed to fetch pools - HTTP status:', response.status)
        setClientPools([])
      }
    } catch (error) {
      console.error('Error fetching pools:', error)
      setClientPools([])
    }
  }

  const handleEditPool = (pool: Pool) => {
    setEditingPool(pool)
    setShowEditPool(true)
  }

  const handleSavePool = async (updatedPool: Partial<Pool>) => {
    if (!editingPool) return

    setPoolSaving(true)
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/pools/${editingPool._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPool),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setShowEditPool(false)
          setEditingPool(null)
          if (selectedClient) {
            await fetchClientPools(selectedClient)
          }
        } else {
          throw new Error(data.error || 'Failed to update pool')
        }
      } else {
        throw new Error('Failed to update pool')
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

  const handleSort = (field: 'name' | 'city' | 'frequency') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: 'name' | 'city' | 'frequency') => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setFrequencyFilter('all')
    setSortBy('name')
    setSortOrder('asc')
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
      serviceFrequency: 'weekly',
      serviceDay: '',
      preferredTimeSlot: '',
      specialInstructions: '',
    })
    setClientFormErrors({})
  }

  const validateClientForm = () => {
    const errors: Record<string, string> = {}

    // Required field validation
    if (!clientFormData.name.trim()) {
      errors.name = 'Client name is required'
    }

    if (!clientFormData.email.trim()) {
      errors.email = 'Email is required'
    } else {
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(clientFormData.email)) {
        errors.email = 'Please enter a valid email address'
      }
    }

    if (!clientFormData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      // Basic phone validation
      const phoneRegex = /^[\+]?[(]?[\d\s\-\(\)]{10,}$/
      if (!phoneRegex.test(clientFormData.phone)) {
        errors.phone = 'Please enter a valid phone number'
      }
    }

    // Address validation
    if (!clientFormData.address.street.trim()) {
      errors.street = 'Street address is required'
    }
    if (!clientFormData.address.city.trim()) {
      errors.city = 'City is required'
    }
    if (!clientFormData.address.state.trim()) {
      errors.state = 'State is required'
    }
    if (!clientFormData.address.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required'
    } else {
      // Basic ZIP code validation
      const zipRegex = /^\d{5}(-\d{4})?$/
      if (!zipRegex.test(clientFormData.address.zipCode)) {
        errors.zipCode =
          'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
      }
    }

    setClientFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateClientForm()) {
      return
    }

    setClientSaving(true)
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientFormData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Success - refresh client list and close modal
          await fetchClients()
          setShowAddClient(false)
          resetClientForm()

          // Show success message (you could also use a toast notification)
          alert(`Client "${clientFormData.name}" added successfully!`)
        } else {
          // Handle API validation errors
          if (data.error.includes('email already exists')) {
            setClientFormErrors({
              email: 'A client with this email already exists',
            })
          } else {
            alert('Error creating client: ' + data.error)
          }
        }
      } else {
        alert('Failed to create client. Please try again.')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Network error. Please check your connection and try again.')
    } finally {
      setClientSaving(false)
    }
  }

  const handleClientFormChange = (field: string, value: string) => {
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
          <p className='text-gray-600 mt-1'>
            {filteredClients.length} of {clients.length} clients
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
        <div className='flex gap-3'>
          <div className='flex border border-gray-300 rounded-lg overflow-hidden'>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              📋 Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}>
              ⊞ Grid
            </button>
          </div>
          <button
            onClick={() => {
              resetClientForm()
              setShowAddClient(true)
            }}
            className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'>
            + Add Client
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className='bg-white rounded-lg shadow-sm border p-4 mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Search */}
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Search Clients
            </label>
            <input
              type='text'
              placeholder='Search by name, email, phone, or address...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
              <option value='all'>All Clients</option>
              <option value='active'>Active Only</option>
              <option value='inactive'>Inactive Only</option>
            </select>
          </div>

          {/* Frequency Filter */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Service Frequency
            </label>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value as any)}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
              <option value='all'>All Frequencies</option>
              <option value='twice-weekly'>Twice Weekly</option>
              <option value='weekly'>Weekly</option>
              <option value='bi-weekly'>Bi-Weekly</option>
              <option value='monthly'>Monthly</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchTerm ||
          statusFilter !== 'all' ||
          frequencyFilter !== 'all') && (
          <div className='mt-3 flex justify-between items-center'>
            <span className='text-sm text-gray-600'>
              Active filters applied
            </span>
            <button
              onClick={clearFilters}
              className='text-sm text-blue-600 hover:text-blue-800'>
              Clear all filters
            </button>
          </div>
        )}
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

      {/* Table View */}
      {viewMode === 'table' && (
        <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('name')}>
                    <div className='flex items-center gap-1'>
                      Client {getSortIcon('name')}
                    </div>
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Contact Info
                  </th>
                  <th
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('city')}>
                    <div className='flex items-center gap-1'>
                      Location {getSortIcon('city')}
                    </div>
                  </th>
                  <th
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                    onClick={() => handleSort('frequency')}>
                    <div className='flex items-center gap-1'>
                      Service {getSortIcon('frequency')}
                    </div>
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
                {filteredClients.map((client) => (
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
                        📧 {client.email}
                      </div>
                      <div className='text-sm text-gray-500'>
                        📞 {client.phone}
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
                        className={`px-2 py-1 rounded text-xs font-medium ${getFrequencyBadgeColor(
                          client.serviceFrequency
                        )}`}>
                        {client.serviceFrequency.replace('-', ' ')}
                      </span>
                      {client.serviceDay && (
                        <div className='text-xs text-gray-500 mt-1'>
                          {client.serviceDay}s
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {client.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm space-x-2'>
                      <button
                        onClick={() => fetchClientPools(client)}
                        className='bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors'>
                        View Pools
                      </button>
                      <button className='bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors'>
                        Log Visit
                      </button>
                      <button className='bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 transition-colors'>
                        ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-500 text-lg'>
                {searchTerm ||
                statusFilter !== 'all' ||
                frequencyFilter !== 'all'
                  ? 'No clients match your search criteria'
                  : 'No clients found'}
              </div>
              {(searchTerm ||
                statusFilter !== 'all' ||
                frequencyFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className='mt-2 text-blue-600 hover:text-blue-800'>
                  Clear filters to see all clients
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Grid View (Original Card Layout) */}
      {viewMode === 'grid' && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredClients.map((client) => (
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

          {filteredClients.length === 0 && (
            <div className='col-span-full text-center py-12'>
              <div className='text-gray-500 text-lg'>
                {searchTerm ||
                statusFilter !== 'all' ||
                frequencyFilter !== 'all'
                  ? 'No clients match your search criteria'
                  : 'No clients found'}
              </div>
              {(searchTerm ||
                statusFilter !== 'all' ||
                frequencyFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className='mt-2 text-blue-600 hover:text-blue-800'>
                  Clear filters to see all clients
                </button>
              )}
            </div>
          )}
        </div>
      )}

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
                            {pool.targetLevels.freeChlorine.target}
                          </p>
                          <p>
                            Target Alkalinity:{' '}
                            {pool.targetLevels.totalAlkalinity.target}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditPool(pool)}
                        className='bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700'>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}

                {clientPools.length === 0 && (
                  <div className='text-center text-gray-500 py-8'>
                    No pools found for this client
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pool Editor Modal */}
      {showEditPool && (
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

      {/* Add Client Modal */}
      {showAddClient && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>Add New Client</h2>
                <button
                  onClick={() => {
                    setShowAddClient(false)
                    resetClientForm()
                  }}
                  className='text-gray-500 hover:text-gray-700 text-2xl'>
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitClient} className='space-y-6'>
                {/* Basic Information */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Client Name *
                    </label>
                    <input
                      type='text'
                      value={clientFormData.name}
                      onChange={(e) =>
                        handleClientFormChange('name', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        clientFormErrors.name
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder='Enter client name'
                    />
                    {clientFormErrors.name && (
                      <p className='text-red-500 text-xs mt-1'>
                        {clientFormErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email Address *
                    </label>
                    <input
                      type='email'
                      value={clientFormData.email}
                      onChange={(e) =>
                        handleClientFormChange('email', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        clientFormErrors.email
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder='client@example.com'
                    />
                    {clientFormErrors.email && (
                      <p className='text-red-500 text-xs mt-1'>
                        {clientFormErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone Number *
                    </label>
                    <input
                      type='tel'
                      value={clientFormData.phone}
                      onChange={(e) =>
                        handleClientFormChange('phone', e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        clientFormErrors.phone
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder='(555) 123-4567'
                    />
                    {clientFormErrors.phone && (
                      <p className='text-red-500 text-xs mt-1'>
                        {clientFormErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Service Frequency *
                    </label>
                    <select
                      value={clientFormData.serviceFrequency}
                      onChange={(e) =>
                        handleClientFormChange(
                          'serviceFrequency',
                          e.target.value
                        )
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                      <option value='twice-weekly'>Twice Weekly</option>
                      <option value='weekly'>Weekly</option>
                      <option value='bi-weekly'>Bi-Weekly</option>
                      <option value='monthly'>Monthly</option>
                    </select>
                  </div>
                </div>

                {/* Address Information */}
                <div className='border-t pt-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4'>
                    Service Address
                  </h3>
                  <div className='grid grid-cols-1 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Street Address *
                      </label>
                      <input
                        type='text'
                        value={clientFormData.address.street}
                        onChange={(e) =>
                          handleClientFormChange(
                            'address.street',
                            e.target.value
                          )
                        }
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          clientFormErrors.street
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder='123 Main Street'
                      />
                      {clientFormErrors.street && (
                        <p className='text-red-500 text-xs mt-1'>
                          {clientFormErrors.street}
                        </p>
                      )}
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          City *
                        </label>
                        <input
                          type='text'
                          value={clientFormData.address.city}
                          onChange={(e) =>
                            handleClientFormChange(
                              'address.city',
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            clientFormErrors.city
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder='Springfield'
                        />
                        {clientFormErrors.city && (
                          <p className='text-red-500 text-xs mt-1'>
                            {clientFormErrors.city}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          State *
                        </label>
                        <input
                          type='text'
                          value={clientFormData.address.state}
                          onChange={(e) =>
                            handleClientFormChange(
                              'address.state',
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            clientFormErrors.state
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder='CA'
                          maxLength={2}
                        />
                        {clientFormErrors.state && (
                          <p className='text-red-500 text-xs mt-1'>
                            {clientFormErrors.state}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          ZIP Code *
                        </label>
                        <input
                          type='text'
                          value={clientFormData.address.zipCode}
                          onChange={(e) =>
                            handleClientFormChange(
                              'address.zipCode',
                              e.target.value
                            )
                          }
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            clientFormErrors.zipCode
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                          placeholder='12345'
                        />
                        {clientFormErrors.zipCode && (
                          <p className='text-red-500 text-xs mt-1'>
                            {clientFormErrors.zipCode}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional Service Details */}
                <div className='border-t pt-6'>
                  <h3 className='text-lg font-medium text-gray-900 mb-4'>
                    Service Preferences (Optional)
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Preferred Service Day
                      </label>
                      <select
                        value={clientFormData.serviceDay}
                        onChange={(e) =>
                          handleClientFormChange('serviceDay', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                        <option value=''>Any Day</option>
                        <option value='monday'>Monday</option>
                        <option value='tuesday'>Tuesday</option>
                        <option value='wednesday'>Wednesday</option>
                        <option value='thursday'>Thursday</option>
                        <option value='friday'>Friday</option>
                        <option value='saturday'>Saturday</option>
                        <option value='sunday'>Sunday</option>
                      </select>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Preferred Time Slot
                      </label>
                      <select
                        value={clientFormData.preferredTimeSlot}
                        onChange={(e) =>
                          handleClientFormChange(
                            'preferredTimeSlot',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                        <option value=''>Any Time</option>
                        <option value='morning'>Morning (8 AM - 12 PM)</option>
                        <option value='afternoon'>
                          Afternoon (12 PM - 5 PM)
                        </option>
                        <option value='evening'>Evening (5 PM - 8 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div className='mt-4'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Special Instructions
                    </label>
                    <textarea
                      value={clientFormData.specialInstructions}
                      onChange={(e) =>
                        handleClientFormChange(
                          'specialInstructions',
                          e.target.value
                        )
                      }
                      rows={3}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                      placeholder='Gate codes, special access instructions, pool-specific notes, etc.'
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className='border-t pt-6 flex justify-end gap-3'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowAddClient(false)
                      resetClientForm()
                    }}
                    className='bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors'
                    disabled={clientSaving}>
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={clientSaving}
                    className='bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
                    {clientSaving ? 'Creating Client...' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
