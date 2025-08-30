// app/components/ClientManagement.tsx
'use client'

import React, { useState, useEffect } from 'react'
import TabbedPoolEditor from './TabbedPoolEditor'
import {
  Users,
  Plus,
  Search,
} from 'lucide-react'
import { useBreadcrumb } from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Import new components
import ClientFilters from './ClientFilters'
import ClientCard from './ClientCard'
import ClientTable from './ClientTable'
import ClientModal from './ClientModal'
import ClientCreateForm from './ClientCreateForm'
import ClientEditForm from './ClientEditForm'
import PoolManagementModal from './PoolManagementModal'

import { useClientManagementState } from '../hooks/useClientManagementState'
// Import types from the enhanced pool-service.ts schema
import {
  Client,
  RetailClient,
  ServiceClient,
  MaintenanceClient,
  Pool,
  isMaintenanceClient,
} from '@/types/pool-service'
import { showToast } from '@/lib/toast'

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
  const { setBreadcrumbs } = useBreadcrumb()
  const {
    viewMode,
    searchTerm,
    clientTypeFilter,
    frequencyFilter,
    setViewMode,
    setSearchTerm,
    setClientTypeFilter,
    setFrequencyFilter,
    clearFilters,
    resetFilters,
    isLoaded: preferencesLoaded,
  } = useClientManagementState()

  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [showAddClient, setShowAddClient] = useState(false)
  const [selectedClientType, setSelectedClientType] = useState<
    'retail' | 'service' | 'maintenance'
  >('maintenance')
  const [clientSaving, setClientSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Edit client state
  const [showEditClient, setShowEditClient] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

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
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Client Management' }
    ])
    fetchClients()
    fetchTechnicians()
  }, [setBreadcrumbs])

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
  }, [clients, searchTerm, clientTypeFilter, frequencyFilter])

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

  const handleCreateClient = async (formData: any) => {
    setClientSaving(true)
    setClientFormErrors({})

    try {
      const token = localStorage.getItem('technicianToken')
      
      // Prepare the client data based on the selected type
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: {
          street: formData.address.street.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          zipCode: formData.address.zipCode.trim(),
        },
        clientType: selectedClientType,
        isActive: true,
      }

      // Add type-specific data
      if (selectedClientType === 'maintenance') {
        Object.assign(clientData, {
          maintenance: {
            serviceFrequency: formData.maintenance.serviceFrequency,
            serviceDay: formData.maintenance.serviceDay,
            specialInstructions: formData.maintenance.specialInstructions,
            accessInstructions: {
              gateCode: formData.maintenance.accessInstructions.gateCode,
              keyLocation: formData.maintenance.accessInstructions.keyLocation,
              dogOnProperty: formData.maintenance.accessInstructions.dogOnProperty,
              specialAccess: formData.maintenance.accessInstructions.specialAccess,
            },
            maintenancePreferences: {
              cleaningIntensity: formData.maintenance.maintenancePreferences.cleaningIntensity,
              chemicalBalance: formData.maintenance.maintenancePreferences.chemicalBalance,
              equipmentMonitoring: formData.maintenance.maintenancePreferences.equipmentMonitoring,
            },
          },
        })
      } else if (selectedClientType === 'service') {
        Object.assign(clientData, {
          service: {
            laborRates: formData.service.laborRates,
            serviceTypes: formData.service.serviceTypes,
            emergencyService: formData.service.emergencyService,
          },
        })
      } else if (selectedClientType === 'retail') {
        Object.assign(clientData, {
          retail: {
            pricingTier: formData.retail.pricingTier,
            taxExempt: formData.retail.taxExempt,
            paymentTerms: formData.retail.paymentTerms,
            creditLimit: formData.retail.creditLimit,
          },
        })
      }

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(clientData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Success - refresh the client list and close the modal
        await fetchClients()
        setShowAddClient(false)
        setShowCreateForm(false)
        resetClientForm()
        
        // Show success message
        showToast.success('Client created successfully', `${clientData.name} has been added to your client list.`)
      } else {
        // Handle validation errors
        if (data.errors) {
          setClientFormErrors(data.errors)
        } else {
          setError(data.message || 'Failed to create client')
        }
      }
    } catch (err) {
      console.error('Error creating client:', err)
      setError('Network error - please try again')
    } finally {
      setClientSaving(false)
    }
  }

  const handleEditClient = (client: Client) => {
    setEditingClient(client)
    setShowEditClient(true)
  }

  const handleUpdateClient = async (updatedClient: Client) => {
    setClientSaving(true)
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/clients/${updatedClient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedClient),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh the client list
        await fetchClients()
        setShowEditClient(false)
        setEditingClient(null)
        
        // Show success message
        showToast.success('Client updated successfully', `${updatedClient.name} has been updated.`)
      } else {
        setError(data.message || 'Failed to update client')
      }
    } catch (err) {
      console.error('Error updating client:', err)
      setError('Network error - please try again')
    } finally {
      setClientSaving(false)
    }
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

          // Show success message
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
    <div className='flex flex-1 flex-col'>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b border-blue-100 dark:border-blue-800'>
        <div>
          <h1 className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
            Client Management
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage retail, service, and maintenance clients
          </p>
        </div>
        <Button
          onClick={() => {
            resetClientForm()
            setShowAddClient(true)
          }}
          className='bg-blue-600 hover:bg-blue-700 text-white'>
          <Plus className='h-4 w-4 mr-2' />
          Add Client
        </Button>
      </div>

      <div className='flex-1 p-6 space-y-6'>
        {/* Search Section */}
        <Card className='border-blue-100 dark:border-blue-800'>
          <CardHeader>
            <CardTitle className='text-blue-900 dark:text-blue-100 flex items-center gap-2'>
              <Search className='h-5 w-5' />
              Search Clients
            </CardTitle>
            <CardDescription>
              Search by name, email, phone, or address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search clients...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 border-blue-200 dark:border-blue-700 focus-visible:ring-blue-500'
              />
            </div>
          </CardContent>
        </Card>

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

        {/* Filters */}
        <ClientFilters
          clientTypeFilter={clientTypeFilter}
          frequencyFilter={frequencyFilter}
          viewMode={viewMode}
          filteredCount={filteredClients.length}
          totalCount={clients.length}
          onClientTypeChange={setClientTypeFilter}
          onFrequencyChange={setFrequencyFilter}
          onViewModeChange={setViewMode}
          onClearFilters={clearFilters}
          onResetFilters={resetFilters}
        />

        {/* Client List */}
        <Card className='border-blue-100 dark:border-blue-800'>
          {filteredClients.length === 0 ? (
            <CardContent className='flex flex-col items-center justify-center py-12 text-center'>
              <Users className='h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-medium mb-2 text-blue-900 dark:text-blue-100'>No clients found</h3>
              <p className='text-muted-foreground'>Try adjusting your filters or add a new client.</p>
            </CardContent>
          ) : viewMode === 'table' ? (
            <CardContent className='p-0'>
              <ClientTable
                clients={filteredClients}
                onViewPools={fetchClientPools}
                onEdit={handleEditClient}
              />
            </CardContent>
          ) : (
            <CardContent className='p-6'>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client._id.toString()}
                    client={client}
                    onViewPools={fetchClientPools}
                    onEdit={handleEditClient}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Pool Management Modal */}
      <PoolManagementModal
        isOpen={showClientPools && selectedClient !== null && isMaintenanceClient(selectedClient)}
        client={selectedClient && isMaintenanceClient(selectedClient) ? selectedClient : null}
        pools={clientPools}
        poolsLoading={poolsLoading}
        technicians={technicians}
        currentAssignment={currentAssignment}
        showAssignmentSection={showAssignmentSection}
        selectedTechnician={selectedTechnician}
        assignmentLoading={assignmentLoading}
        onClose={() => {
          setShowClientPools(false)
          setShowAssignmentSection(false)
          setSelectedTechnician('')
        }}
        onShowAssignmentSection={setShowAssignmentSection}
        onSelectedTechnicianChange={setSelectedTechnician}
        onAssignTechnician={assignClientToTechnician}
        onRemoveAssignment={removeClientAssignment}
        onEditPool={(pool) => {
          setSelectedPool(pool)
          setShowPoolEditor(true)
        }}
      />

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
      <ClientModal
        isOpen={showAddClient && !showCreateForm}
        selectedClientType={selectedClientType}
        onClientTypeChange={setSelectedClientType}
        onClose={() => setShowAddClient(false)}
        onContinue={() => setShowCreateForm(true)}
      />

      {/* Client Creation Form */}
      <ClientCreateForm
        isOpen={showCreateForm}
        clientType={selectedClientType}
        formData={clientFormData}
        formErrors={clientFormErrors}
        saving={clientSaving}
        onFormChange={handleClientFormChange}
        onSubmit={(e) => {
          e.preventDefault()
          handleCreateClient(clientFormData)
        }}
        onClose={() => {
          setShowAddClient(false)
          setShowCreateForm(false)
          resetClientForm()
        }}
      />

      {/* Client Edit Form */}
      <ClientEditForm
        isOpen={showEditClient}
        client={editingClient}
        onClose={() => {
          setShowEditClient(false)
          setEditingClient(null)
        }}
        onSave={handleUpdateClient}
        saving={clientSaving}
      />
    </div>
  )
}
