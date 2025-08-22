// app/components/CustomerMgmt.tsx
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
        afterHoursRate: 1.5,
        weekendRate: 1.25,
      },
    },
    maintenance: {
      serviceFrequency: 'weekly' as const,
      serviceDay: '',
      chemicalProgram: {
        chemicalSupply: 'technician-provided' as const,
      },
      serviceIntervals: {
        waterTesting: 1,
        equipmentCheck: 1,
        filterCleaning: 4,
        deepCleaning: 8,
      },
    },
  })

  const [clientFormErrors, setClientFormErrors] = useState<
    Record<string, string>
  >({})

  // Enhanced filtering logic
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
          client.address.city.toLowerCase().includes(searchTerm.toLowerCase())
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
        return (
          isMaintenanceClient(client) &&
          client.maintenance.serviceFrequency === frequencyFilter
        )
      })
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, clientTypeFilter, statusFilter, frequencyFilter])

  // Fetch clients from API
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

  useEffect(() => {
    fetchClients()
  }, [])

  // Client type icon
  const getClientTypeIcon = (clientType: string) => {
    switch (clientType) {
      case 'retail':
        return <ShoppingCart className='w-4 h-4' />
      case 'service':
        return <Wrench className='w-4 h-4' />
      case 'maintenance':
        return <Calendar className='w-4 h-4' />
      default:
        return <Users className='w-4 h-4' />
    }
  }

  // Client type badge colors
  const getClientTypeBadge = (clientType: string) => {
    const colors = {
      retail: 'bg-blue-100 text-blue-800',
      service: 'bg-orange-100 text-orange-800',
      maintenance: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    }
    return (
      colors[clientType as keyof typeof colors] || 'bg-muted text-gray-800'
    )
  }

  // Client specific information display
  const getClientSpecificInfo = (client: Client) => {
    switch (client.clientType) {
      case 'retail':
        return (
          <div className='text-sm text-muted-foreground'>
            <div>
              Tier:{' '}
              <span className='font-medium'>{client.retail.pricingTier}</span>
            </div>
            <div>Terms: {client.retail.paymentTerms}</div>
            {client.retail.creditLimit && (
              <div>Credit: ${client.retail.creditLimit.toLocaleString()}</div>
            )}
          </div>
        )
      case 'service':
        return (
          <div className='text-sm text-muted-foreground'>
            <div>
              Standard:{' '}
              <span className='font-medium'>
                ${client.service.laborRates.standard}/hr
              </span>
            </div>
            <div>
              Emergency:{' '}
              <span className='font-medium'>
                ${client.service.laborRates.emergency}/hr
              </span>
            </div>
            <div>Services: {client.service.serviceTypes.length} types</div>
          </div>
        )
      case 'maintenance':
        return (
          <div className='text-sm text-muted-foreground'>
            <div>
              Frequency:{' '}
              <span className='font-medium'>
                {client.maintenance.serviceFrequency}
              </span>
            </div>
            <div>Day: {client.maintenance.serviceDay || 'Not set'}</div>
            <div>
              Chemicals: {client.maintenance.chemicalProgram.chemicalSupply}
            </div>
          </div>
        )
    }
  }

  // Statistics calculation
  const clientTypeStats = {
    retail: clients.filter((c) => c.clientType === 'retail').length,
    service: clients.filter((c) => c.clientType === 'service').length,
    maintenance: clients.filter((c) => c.clientType === 'maintenance').length,
  }

  // Reset client form
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
          afterHoursRate: 1.5,
          weekendRate: 1.25,
        },
      },
      maintenance: {
        serviceFrequency: 'weekly',
        serviceDay: '',
        chemicalProgram: {
          chemicalSupply: 'technician-provided',
        },
        serviceIntervals: {
          waterTesting: 1,
          equipmentCheck: 1,
          filterCleaning: 4,
          deepCleaning: 8,
        },
      },
    })
    setClientFormErrors({})
  }

  // Validate client form
  const validateClientForm = () => {
    const errors: Record<string, string> = {}

    if (!clientFormData.name.trim()) {
      errors.name = 'Client name is required'
    }

    if (!clientFormData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(clientFormData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!clientFormData.phone.trim()) {
      errors.phone = 'Phone number is required'
    }

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
    }

    return errors
  }

  // Handle client form submission
  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateClientForm()
    if (Object.keys(errors).length > 0) {
      setClientFormErrors(errors)
      return
    }

    setClientSaving(true)
    try {
      const token = localStorage.getItem('technicianToken')

      // Build client data based on selected type
      const baseClientData = {
        name: clientFormData.name,
        email: clientFormData.email,
        phone: clientFormData.phone,
        address: clientFormData.address,
        clientType: selectedClientType,
        isActive: true,
      }

      let clientData: any = baseClientData

      // Add type-specific data
      switch (selectedClientType) {
        case 'retail':
          clientData.retail = clientFormData.retail
          break
        case 'service':
          clientData.service = clientFormData.service
          break
        case 'maintenance':
          clientData.isMaintenance = true
          clientData.maintenance = clientFormData.maintenance
          break
      }

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchClients() // Refresh the list
          setShowAddClient(false)
          setShowCreateForm(false)
          resetClientForm()
        } else {
          alert(data.error || 'Failed to create client')
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

  // Handle form field changes
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

  // Pool functions (keeping your existing functionality)
  const fetchClientPools = async (client: Client) => {
    try {
      setSelectedClient(client)
      setShowClientPools(true)
      setPoolsLoading(true)

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
          <Plus className='w-4 h-4' />
          Add Client
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
        <div className='bg-background p-6 rounded-lg shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-2xl font-bold text-foreground'>
                {clients.length}
              </div>
              <div className='text-sm text-muted-foreground'>Total Clients</div>
            </div>
            <Users className='w-8 h-8 text-gray-400' />
          </div>
        </div>
        <div className='bg-background p-6 rounded-lg shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-2xl font-bold text-green-600'>
                {clientTypeStats.maintenance}
              </div>
              <div className='text-sm text-muted-foreground'>Maintenance</div>
            </div>
            <Calendar className='w-8 h-8 text-green-400' />
          </div>
        </div>
        <div className='bg-background p-6 rounded-lg shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-2xl font-bold text-orange-600'>
                {clientTypeStats.service}
              </div>
              <div className='text-sm text-muted-foreground'>Service</div>
            </div>
            <Wrench className='w-8 h-8 text-orange-400' />
          </div>
        </div>
        <div className='bg-background p-6 rounded-lg shadow border'>
          <div className='flex items-center justify-between'>
            <div>
              <div className='text-2xl font-bold text-blue-600'>
                {clientTypeStats.retail}
              </div>
              <div className='text-sm text-muted-foreground'>Retail</div>
            </div>
            <ShoppingCart className='w-8 h-8 text-blue-400' />
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      <div className='bg-background p-4 rounded-lg shadow border mb-6'>
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
          <div className='md:col-span-2'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Search Clients
            </label>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <input
                type='text'
                placeholder='Search clients...'
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
              Frequency
            </label>
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value as any)}
              className='w-full px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
              disabled={
                clientTypeFilter !== 'all' && clientTypeFilter !== 'maintenance'
              }>
              <option value='all'>All Frequencies</option>
              <option value='twice-weekly'>Twice Weekly</option>
              <option value='weekly'>Weekly</option>
              <option value='bi-weekly'>Bi-weekly</option>
              <option value='monthly'>Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Table */}
      <div className='bg-background rounded-lg shadow border overflow-hidden'>
        <div className='px-6 py-4 border-b border-border'>
          <h2 className='text-lg font-semibold text-foreground'>
            Clients ({filteredClients.length})
          </h2>
        </div>

        {filteredClients.length === 0 ? (
          <div className='p-6 text-center text-gray-500'>No clients found</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
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
                    Details
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-background divide-y divide-gray-200'>
                {filteredClients.map((client) => (
                  <tr key={client._id.toString()} className='hover:bg-muted/50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div>
                          <div className='text-sm font-medium text-foreground'>
                            {client.name}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {client.address.city}, {client.address.state}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        {getClientTypeIcon(client.clientType)}
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getClientTypeBadge(
                            client.clientType
                          )}`}>
                          {client.clientType}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-foreground'>
                        📧 {client.email}
                      </div>
                      <div className='text-sm text-gray-500'>
                        📞 {client.phone}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getClientSpecificInfo(client)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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

      {/* Client Creation Modal */}
      {showAddClient && !showCreateForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-background rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-semibold mb-4'>Add New Client</h3>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
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

      {/* Client Creation Form */}
      {showAddClient && showCreateForm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xl flex items-center justify-center z-50'>
          <div className='bg-background rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
            <div className='p-6'>
              <div className='flex justify-between items-center mb-6'>
                <h2 className='text-2xl font-bold'>
                  Add New {selectedClientType} Client
                </h2>
                <button
                  onClick={() => {
                    setShowAddClient(false)
                    setShowCreateForm(false)
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
                          : 'border-input'
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
                          : 'border-input'
                      }`}
                      placeholder='client@email.com'
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
                          : 'border-input'
                      }`}
                      placeholder='(555) 123-4567'
                    />
                    {clientFormErrors.phone && (
                      <p className='text-red-500 text-xs mt-1'>
                        {clientFormErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className='space-y-4'>
                  <h3 className='text-lg font-semibold text-foreground'>
                    Address
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
                            : 'border-input'
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
                              : 'border-input'
                          }`}
                          placeholder='Miami'
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
                              : 'border-input'
                          }`}
                          placeholder='FL'
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
                              : 'border-input'
                          }`}
                          placeholder='33101'
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

                {/* Type-specific fields would go here */}
                {selectedClientType === 'maintenance' && (
                  <div className='space-y-4'>
                    <h3 className='text-lg font-semibold text-foreground'>
                      Maintenance Details
                    </h3>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Service Frequency
                        </label>
                        <select
                          value={clientFormData.maintenance.serviceFrequency}
                          onChange={(e) =>
                            setClientFormData((prev) => ({
                              ...prev,
                              maintenance: {
                                ...prev.maintenance,
                                serviceFrequency: e.target.value as any,
                              },
                            }))
                          }
                          className='w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                          <option value='weekly'>Weekly</option>
                          <option value='bi-weekly'>Bi-weekly</option>
                          <option value='twice-weekly'>Twice Weekly</option>
                          <option value='monthly'>Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Preferred Service Day
                        </label>
                        <select
                          value={clientFormData.maintenance.serviceDay}
                          onChange={(e) =>
                            setClientFormData((prev) => ({
                              ...prev,
                              maintenance: {
                                ...prev.maintenance,
                                serviceDay: e.target.value,
                              },
                            }))
                          }
                          className='w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                          <option value=''>Select day</option>
                          <option value='monday'>Monday</option>
                          <option value='tuesday'>Tuesday</option>
                          <option value='wednesday'>Wednesday</option>
                          <option value='thursday'>Thursday</option>
                          <option value='friday'>Friday</option>
                          <option value='saturday'>Saturday</option>
                          <option value='sunday'>Sunday</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Chemical Supply
                      </label>
                      <select
                        value={
                          clientFormData.maintenance.chemicalProgram
                            .chemicalSupply
                        }
                        onChange={(e) =>
                          setClientFormData((prev) => ({
                            ...prev,
                            maintenance: {
                              ...prev.maintenance,
                              chemicalProgram: {
                                ...prev.maintenance.chemicalProgram,
                                chemicalSupply: e.target.value as any,
                              },
                            },
                          }))
                        }
                        className='w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'>
                        <option value='technician-provided'>
                          Technician Provided
                        </option>
                        <option value='client-provided'>Client Provided</option>
                        <option value='mixed'>Mixed</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className='flex justify-end space-x-4 pt-6 border-t'>
                  <button
                    type='button'
                    onClick={() => {
                      setShowAddClient(false)
                      setShowCreateForm(false)
                      resetClientForm()
                    }}
                    className='px-6 py-2 text-muted-foreground border border-input rounded-md hover:bg-muted/50'>
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={clientSaving}
                    className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'>
                    {clientSaving ? 'Creating...' : 'Create Client'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pool Modals (only show for maintenance clients) */}
      {showClientPools &&
        selectedClient &&
        isMaintenanceClient(selectedClient) && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-background rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold'>
                  Pools for {selectedClient.name}
                </h3>
                <button
                  onClick={() => setShowClientPools(false)}
                  className='text-gray-500 hover:text-gray-700'>
                  ✕
                </button>
              </div>
              <div className='text-center text-gray-500'>
                Pool list will be displayed here
              </div>
            </div>
          </div>
        )}

      {showPoolEditor && (
        <TabbedPoolEditor
          pool={selectedPool}
          isOpen={showPoolEditor}
          onClose={() => setShowPoolEditor(false)}
          onSave={handleSavePool}
          saving={poolSaving}
        />
      )}
    </div>
  )
}
