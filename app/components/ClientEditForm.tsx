'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
import { showToast } from '@/lib/toast'
import PoolEditor from './PoolEditor'

interface ClientEditFormProps {
  isOpen: boolean
  client: Client | null
  onClose: () => void
  onSave: (updatedClient: Client) => Promise<void>
  saving?: boolean
}

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

const ClientEditForm: React.FC<ClientEditFormProps> = ({
  isOpen,
  client,
  onClose,
  onSave,
  saving = false,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [pools, setPools] = useState<Pool[]>([])
  const [poolsLoading, setPoolsLoading] = useState(false)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showPoolEditor, setShowPoolEditor] = useState(false)
  const [showAddPool, setShowAddPool] = useState(false)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [currentAssignment, setCurrentAssignment] = useState<Technician | null>(null)

  // Initialize form data when client changes
  useEffect(() => {
    if (client) {
      setFormData({
        ...client,
        address: { ...client.address },
        billingAddress: client.billingAddress ? { ...client.billingAddress } : undefined,
        retail: isRetailClient(client) ? { ...client.retail } : undefined,
        service: isServiceClient(client) ? { ...client.service } : undefined,
        maintenance: isMaintenanceClient(client) ? { ...client.maintenance } : undefined,
      })
      setFormErrors({})
      
      // Fetch pools for all client types
      fetchClientPools(client)
      if (isMaintenanceClient(client)) {
        fetchTechnicians()
      }
    }
  }, [client])

  const fetchClientPools = async (client: Client) => {
    try {
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
          setPools(data.pools || [])
        }
      }
    } catch (err) {
      console.error('Error fetching pools:', err)
    } finally {
      setPoolsLoading(false)
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
          if (client) {
            const assignedTechnician = data.technicians.find((tech: Technician) =>
              tech.assignedClients.includes(client._id.toString())
            )
            setCurrentAssignment(assignedTechnician || null)
          }
        }
      }
    } catch (err) {
      console.error('Error fetching technicians:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client || !formData) return

    try {
      await onSave(formData as Client)
      showToast.success('Client Updated', `Successfully updated ${formData.name}`)
      onClose()
    } catch (error) {
      console.error('Error saving client:', error)
      showToast.error('Update Failed', 'Failed to update client information')
    }
  }

  const handleSavePool = async (poolData: Partial<Pool>) => {
    if (!client || !selectedPool) return

    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/pools/${selectedPool._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(poolData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await fetchClientPools(client)
        setShowPoolEditor(false)
        setSelectedPool(null)
      }
    } catch (error) {
      console.error('Error updating pool:', error)
    }
  }

  const handleCreatePool = async (poolData: Partial<Pool>) => {
    if (!client) return

    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/pools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...poolData,
          clientId: client._id,
          isActive: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        await fetchClientPools(client)
        setShowAddPool(false)
        setSelectedPool(null)
      }
    } catch (error) {
      console.error('Error creating pool:', error)
    }
  }

  if (!client || !formData) {
    return null
  }

  const clientType = client.clientType

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/clients">Client Management</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Edit Client</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DialogTitle>Edit Client: {client.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="h-full flex flex-col">
          <TabsList className="grid w-full gap-1 grid-cols-5">
            <TabsTrigger value="basic" className="text-xs sm:text-sm px-1">Basic</TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm px-1">Contact</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-1">Settings</TabsTrigger>
            <TabsTrigger value="pools" className="text-blue-600 text-xs sm:text-sm px-1">Pools</TabsTrigger>
            <TabsTrigger value="advanced" className="text-xs sm:text-sm px-1">Advanced</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="basic">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Client Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData((prev: Record<string, any>) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Client Type</Label>
                  <div className="mt-2 p-3 bg-muted rounded">
                    <Badge variant="secondary">{clientType}</Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Client type cannot be changed after creation
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    value={formData.specialInstructions || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Any special instructions for this client..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive ?? true}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked as boolean }))}
                  />
                  <Label htmlFor="isActive">Active Client</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Service Address</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.address?.street || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, street: e.target.value } 
                      }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.address?.city || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, city: e.target.value } 
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.address?.state || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          address: { ...prev.address, state: e.target.value } 
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address?.zipCode || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, zipCode: e.target.value } 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox
                    id="separateBilling"
                    checked={!!formData.billingAddress}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData(prev => ({ 
                          ...prev, 
                          billingAddress: { street: '', city: '', state: '', zipCode: '' } 
                        }))
                      } else {
                        setFormData(prev => ({ 
                          ...prev, 
                          billingAddress: undefined 
                        }))
                      }
                    }}
                  />
                  <Label htmlFor="separateBilling">Use separate billing address</Label>
                </div>

                {formData.billingAddress && (
                  <div className="space-y-4 p-4 border rounded">
                    <h4 className="font-medium">Billing Address</h4>
                    <div>
                      <Label htmlFor="billingStreet">Street Address</Label>
                      <Input
                        id="billingStreet"
                        value={formData.billingAddress?.street || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          billingAddress: { ...prev.billingAddress, street: e.target.value } 
                        }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity">City</Label>
                        <Input
                          id="billingCity"
                          value={formData.billingAddress?.city || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            billingAddress: { ...prev.billingAddress, city: e.target.value } 
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingState">State</Label>
                        <Input
                          id="billingState"
                          value={formData.billingAddress?.state || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            billingAddress: { ...prev.billingAddress, state: e.target.value } 
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="billingZipCode">Zip Code</Label>
                      <Input
                        id="billingZipCode"
                        value={formData.billingAddress?.zipCode || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          billingAddress: { ...prev.billingAddress, zipCode: e.target.value } 
                        }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                {isRetailClient(client) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Retail Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pricingTier">Pricing Tier</Label>
                        <Select
                          value={formData.retail?.pricingTier || 'standard'}
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            retail: { ...prev.retail, pricingTier: value as any } 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="preferred">Preferred</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="paymentTerms">Payment Terms</Label>
                        <Select
                          value={formData.retail?.paymentTerms || 'net-30'}
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            retail: { ...prev.retail, paymentTerms: value as any } 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="net-30">Net 30</SelectItem>
                            <SelectItem value="net-15">Net 15</SelectItem>
                            <SelectItem value="cod">COD</SelectItem>
                            <SelectItem value="prepaid">Prepaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="taxExempt"
                        checked={formData.retail?.taxExempt || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          retail: { ...prev.retail, taxExempt: checked as boolean } 
                        }))}
                      />
                      <Label htmlFor="taxExempt">Tax Exempt</Label>
                    </div>

                    {formData.retail?.taxExempt && (
                      <div>
                        <Label htmlFor="taxExemptNumber">Tax Exempt Number</Label>
                        <Input
                          id="taxExemptNumber"
                          value={formData.retail?.taxExemptNumber || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            retail: { ...prev.retail, taxExemptNumber: e.target.value } 
                          }))}
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="creditLimit">Credit Limit ($)</Label>
                      <Input
                        id="creditLimit"
                        type="number"
                        value={formData.retail?.creditLimit || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          retail: { ...prev.retail, creditLimit: parseFloat(e.target.value) || undefined } 
                        }))}
                      />
                    </div>
                  </div>
                )}

                {isServiceClient(client) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Service Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="standardRate">Standard Labor Rate ($/hr)</Label>
                        <Input
                          id="standardRate"
                          type="number"
                          step="0.01"
                          value={formData.service?.laborRates?.standard || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            service: { 
                              ...prev.service, 
                              laborRates: { 
                                ...prev.service?.laborRates, 
                                standard: parseFloat(e.target.value) || 0 
                              } 
                            } 
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="emergencyRate">Emergency Rate ($/hr)</Label>
                        <Input
                          id="emergencyRate"
                          type="number"
                          step="0.01"
                          value={formData.service?.laborRates?.emergency || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            service: { 
                              ...prev.service, 
                              laborRates: { 
                                ...prev.service?.laborRates, 
                                emergency: parseFloat(e.target.value) || 0 
                              } 
                            } 
                          }))}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="emergencyService"
                        checked={formData.service?.emergencyService?.enabled || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          service: { 
                            ...prev.service, 
                            emergencyService: { 
                              ...prev.service?.emergencyService, 
                              enabled: checked as boolean 
                            } 
                          } 
                        }))}
                      />
                      <Label htmlFor="emergencyService">Emergency Service Available</Label>
                    </div>
                  </div>
                )}

                {isMaintenanceClient(client) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Maintenance Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serviceFrequency">Service Frequency</Label>
                        <Select
                          value={formData.maintenance?.serviceFrequency || 'weekly'}
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            maintenance: { ...prev.maintenance, serviceFrequency: value as any } 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="twice-weekly">Twice Weekly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="serviceDay">Preferred Service Day</Label>
                        <Select
                          value={formData.maintenance?.serviceDay || ''}
                          onValueChange={(value) => setFormData(prev => ({ 
                            ...prev, 
                            maintenance: { ...prev.maintenance, serviceDay: value } 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="chemicalSupply">Chemical Supply</Label>
                      <Select
                        value={formData.maintenance?.chemicalProgram?.chemicalSupply || 'technician-provided'}
                        onValueChange={(value) => setFormData(prev => ({ 
                          ...prev, 
                          maintenance: { 
                            ...prev.maintenance, 
                            chemicalProgram: { 
                              ...prev.maintenance?.chemicalProgram, 
                              chemicalSupply: value as any 
                            } 
                          } 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client-provided">Client Provided</SelectItem>
                          <SelectItem value="technician-provided">Technician Provided</SelectItem>
                          <SelectItem value="mixed">Mixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="gateCode">Gate Code</Label>
                      <Input
                        id="gateCode"
                        value={formData.maintenance?.accessInstructions?.gateCode || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          maintenance: { 
                            ...prev.maintenance, 
                            accessInstructions: { 
                              ...prev.maintenance?.accessInstructions, 
                              gateCode: e.target.value 
                            } 
                          } 
                        }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="keyLocation">Key Location</Label>
                      <Input
                        id="keyLocation"
                        value={formData.maintenance?.accessInstructions?.keyLocation || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          maintenance: { 
                            ...prev.maintenance, 
                            accessInstructions: { 
                              ...prev.maintenance?.accessInstructions, 
                              keyLocation: e.target.value 
                            } 
                          } 
                        }))}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="dogOnProperty"
                        checked={formData.maintenance?.accessInstructions?.dogOnProperty || false}
                        onCheckedChange={(checked) => setFormData(prev => ({ 
                          ...prev, 
                          maintenance: { 
                            ...prev.maintenance, 
                            accessInstructions: { 
                              ...prev.maintenance?.accessInstructions, 
                              dogOnProperty: checked as boolean 
                            } 
                          } 
                        }))}
                      />
                      <Label htmlFor="dogOnProperty">Dog on Property</Label>
                    </div>

                    <div>
                      <Label htmlFor="specialAccess">Special Access Instructions</Label>
                      <Textarea
                        id="specialAccess"
                        value={formData.maintenance?.accessInstructions?.specialAccess || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          maintenance: { 
                            ...prev.maintenance, 
                            accessInstructions: { 
                              ...prev.maintenance?.accessInstructions, 
                              specialAccess: e.target.value 
                            } 
                          } 
                        }))}
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pools">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3>Pools for {clientType} services</h3>
                  <Button
                    onClick={() => {
                      setSelectedPool({
                        name: '',
                        type: 'residential',
                        shape: 'rectangular',
                        dimensions: { avgDepth: 0 },
                        volume: { gallons: 0, calculatedAt: new Date() },
                        equipment: { filter: { type: 'sand' }, pump: {} },
                        targetLevels: {
                          ph: { target: 7.4, min: 7.2, max: 7.6 },
                          freeChlorine: { target: 3.0, min: 1.0, max: 5.0 },
                          totalAlkalinity: { target: 100, min: 80, max: 120 },
                          calciumHardness: { target: 250, min: 200, max: 400 },
                          cyanuricAcid: { target: 50, min: 30, max: 100 },
                        },
                        isActive: true,
                      } as Pool)
                      setShowAddPool(true)
                    }}
                  >
                    Add Pool
                  </Button>
                </div>

                {poolsLoading ? (
                  <div>Loading pools...</div>
                ) : pools.length === 0 ? (
                  <div>No pools found</div>
                ) : (
                  <div className="space-y-2">
                    {pools.map((pool) => (
                      <div key={pool._id.toString()} className="border p-4 rounded">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4>{pool.name}</h4>
                            <p>Type: {pool.type} | Shape: {pool.shape}</p>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedPool(pool)
                              setShowPoolEditor(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced">
              <div>Advanced settings</div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>

      <PoolEditor
        pool={selectedPool}
        isOpen={showPoolEditor || showAddPool}
        onClose={() => {
          setShowPoolEditor(false)
          setShowAddPool(false)
          setSelectedPool(null)
        }}
        onSave={showAddPool ? handleCreatePool : handleSavePool}
        saving={saving}
      />
    </Dialog>
  )
}

export default ClientEditForm