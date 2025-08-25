'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import PoolCalculator from '@/components/PoolCalculator'
import {
  Client,
  Pool,
  ServiceClient,
  MaintenanceClient,
  RetailClient,
} from '@/types/pool-service'

interface VisitLog {
  clientId: string
  poolId?: string
  serviceType:
    | 'maintenance-routine'
    | 'maintenance-chemical'
    | 'service-repair'
    | 'service-installation'
    | 'service-emergency'
    | 'retail-delivery'
    | 'retail-pickup'
  priority?: 'low' | 'normal' | 'high' | 'emergency'

  // Common fields
  duration: number
  notes: string
  nextVisitRecommendations?: string

  // Maintenance-specific
  readings?: {
    ph?: number
    totalChlorine?: number
    freeChlorine?: number
    totalAlkalinity?: number
    calciumHardness?: number
    cyanuricAcid?: number
    salt?: number
    phosphates?: number
    temperature?: number
  }
  chemicalsAdded: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
    calculatedRecommendation?: string
  }>
  tasksCompleted: Array<{
    task: string
    completed: boolean
    notes?: string
  }>
  poolCondition?: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }

  // Service-specific
  serviceDetails?: {
    issueDescription?: string
    diagnosisNotes?: string
    partsUsed?: Array<{
      partName: string
      partNumber?: string
      quantity: number
      cost?: number
    }>
    laborHours?: number
    warrantyWork?: boolean
    followUpRequired?: boolean
    equipmentTested?: boolean
  }

  // Retail-specific
  retailDetails?: {
    itemsDelivered?: Array<{
      productName: string
      sku?: string
      quantity: number
      unitPrice?: number
    }>
    paymentCollected?: number
    deliveryInstructions?: string
    signatureRequired?: boolean
    customerPresent?: boolean
  }
}

export default function VisitHistoryPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const clientId = searchParams.get('clientId')
  const poolId = searchParams.get('poolId')
  const visitType =
    (searchParams.get('type') as VisitLog['serviceType']) ||
    'maintenance-routine'

  const [loading, setLoading] = useState(true)
  const [client, setClient] = useState<Client | null>(null)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [availablePools, setAvailablePools] = useState<Pool[]>([])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [showCalculator, setShowCalculator] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [visit, setVisit] = useState<VisitLog>({
    clientId: clientId || '',
    poolId: poolId || undefined,
    serviceType: visitType,
    priority: 'normal',
    duration: 0,
    notes: '',
    readings: {
      ph: undefined,
      totalChlorine: undefined,
      freeChlorine: undefined,
      totalAlkalinity: undefined,
      calciumHardness: undefined,
      cyanuricAcid: undefined,
      salt: undefined,
      phosphates: undefined,
      temperature: undefined,
    },
    chemicalsAdded: [],
    tasksCompleted: getDefaultTasks(visitType),
    poolCondition: {
      waterClarity: 'clear',
      debris: 'none',
      equipmentStatus: 'normal',
    },
    serviceDetails: visitType.startsWith('service')
      ? {
          issueDescription: '',
          diagnosisNotes: '',
          partsUsed: [],
          laborHours: 0,
          warrantyWork: false,
          followUpRequired: false,
          equipmentTested: false,
        }
      : undefined,
    retailDetails: visitType.startsWith('retail')
      ? {
          itemsDelivered: [],
          paymentCollected: 0,
          deliveryInstructions: '',
          signatureRequired: false,
          customerPresent: false,
        }
      : undefined,
  })

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000 / 60
        )
        setVisit((prev) => ({ ...prev, duration: elapsed }))
      }, 60000) // Update every minute
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, startTime])

  // Load client and pool data
  useEffect(() => {
    const loadData = async () => {
      if (!clientId) {
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('technicianToken')

        // Load client
        const clientResponse = await fetch(`/api/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (clientResponse.ok) {
          const clientData = await clientResponse.json()
          setClient(clientData.client)
        }

        // Load pools for maintenance/service clients
        if (
          visitType.startsWith('maintenance') ||
          visitType.startsWith('service')
        ) {
          const poolsResponse = await fetch(`/api/pools?clientId=${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (poolsResponse.ok) {
            const poolsData = await poolsResponse.json()
            setAvailablePools(poolsData.pools || [])

            if (poolId) {
              const pool = poolsData.pools?.find(
                (p: Pool) => p._id.toString() === poolId
              )
              setSelectedPool(pool || null)
            } else if (poolsData.pools?.length === 1) {
              setSelectedPool(poolsData.pools[0])
              setVisit((prev) => ({
                ...prev,
                poolId: poolsData.pools[0]._id.toString(),
              }))
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId, poolId, visitType])

  const startTimer = () => {
    setStartTime(new Date())
    setIsTimerRunning(true)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
    if (startTime) {
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000 / 60
      )
      setVisit((prev) => ({ ...prev, duration: elapsed }))
    }
  }

  const submitVisit = async () => {
    try {
      setSubmitting(true) // ADD THIS LINE

      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...visit,
          scheduledDate: new Date().toISOString(),
          actualDate: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('Visit logged successfully!')
          router.push('/dashboard')
        } else {
          alert('Error: ' + data.error)
        }
      } else {
        alert('Failed to log visit')
      }
    } catch (error) {
      console.error('Error submitting visit:', error)
      alert('Error submitting visit')
    } finally {
      setSubmitting(false) // ADD THIS LINE
    }
  }
  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-lg'>Loading...</div>
      </div>
    )
  }

  if (!clientId || !client) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <div className='text-xl text-red-600 mb-4'>Client not found</div>
        <button
          onClick={() => router.push('/dashboard')}
          className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'>
          Return to Dashboard
        </button>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['technician', 'supervisor', 'admin']}>
      <div className='p-6 max-w-6xl mx-auto'>
        {/* Header */}
        <VisitHeader
          client={client}
          selectedPool={selectedPool}
          visit={visit}
          isTimerRunning={isTimerRunning}
          onStartTimer={startTimer}
          onStopTimer={stopTimer}
        />

        {/* Pool Selection for maintenance/service visits */}
        {(visitType.startsWith('maintenance') ||
          visitType.startsWith('service')) && (
          <PoolSelector
            pools={availablePools}
            selectedPool={selectedPool}
            onPoolChange={(pool) => {
              setSelectedPool(pool)
              setVisit((prev) => ({ ...prev, poolId: pool?._id.toString() }))
            }}
          />
        )}

        {/* Visit Type Specific Forms */}
        <div className='grid gap-6'>
          {visitType.startsWith('maintenance') && (
            <MaintenanceVisitForm
              visit={visit}
              setVisit={setVisit}
              selectedPool={selectedPool}
              setShowCalculator={setShowCalculator}
            />
          )}

          {visitType.startsWith('service') && (
            <ServiceVisitForm
              visit={visit}
              setVisit={setVisit}
              client={client as ServiceClient}
            />
          )}

          {visitType.startsWith('retail') && (
            <RetailVisitForm
              visit={visit}
              setVisit={setVisit}
              client={client as RetailClient}
            />
          )}

          {/* Common Notes Section */}
          <NotesSection visit={visit} setVisit={setVisit} />

          {/* Submit Button */}
          <div className='flex justify-end gap-4'>
            <button
              onClick={() => router.push('/dashboard')}
              className='px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600'>
              Cancel
            </button>
            <button
              onClick={submitVisit}
              className='px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700'>
              Submit Visit Log
            </button>
          </div>
        </div>

        {/* Chemical Calculator Modal */}
        {showCalculator && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 max-w-2xl w-full mx-4'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-xl font-bold'>Pool Calculator</h3>
                <button
                  onClick={() => setShowCalculator(false)}
                  className='text-gray-500 hover:text-gray-700'>
                  ✕
                </button>
              </div>
              <PoolCalculator />

              {/* Add a button to apply calculator results to the visit */}
              <div className='mt-4 pt-4 border-t border-gray-200'>
                <button
                  onClick={() => setShowCalculator(false)}
                  className='w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600'>
                  Close Calculator
                </button>
                <p className='text-sm text-gray-600 mt-2'>
                  Note: Manually add calculated chemicals to the visit log using
                  the "Add Chemical" button
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

// Helper Components
function VisitHeader({
  client,
  selectedPool,
  visit,
  isTimerRunning,
  onStartTimer,
  onStopTimer,
}: {
  client: Client
  selectedPool: Pool | null
  visit: VisitLog
  isTimerRunning: boolean
  onStartTimer: () => void
  onStopTimer: () => void
}) {
  return (
    <div className='flex justify-between items-center mb-6 bg-white rounded-lg shadow p-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>
          {getVisitTypeTitle(visit.serviceType)}
        </h1>
        <p className='text-gray-600'>
          {client.name} - {client.address.street}, {client.address.city}
        </p>
        {selectedPool && (
          <p className='text-sm text-gray-500'>Pool: {selectedPool.name}</p>
        )}
        {visit.priority && visit.priority !== 'normal' && (
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${
              visit.priority === 'emergency'
                ? 'bg-red-100 text-red-800'
                : visit.priority === 'high'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
            {visit.priority.toUpperCase()}
          </span>
        )}
      </div>

      <div className='flex items-center gap-4'>
        <div className='text-right'>
          <div className='text-2xl font-bold text-blue-600'>
            {Math.floor(visit.duration / 60)}h {visit.duration % 60}m
          </div>
          <div className='text-sm text-gray-500'>Duration</div>
        </div>

        {!isTimerRunning ? (
          <button
            onClick={onStartTimer}
            className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700'>
            Start Timer
          </button>
        ) : (
          <button
            onClick={onStopTimer}
            className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700'>
            Stop Timer
          </button>
        )}
      </div>
    </div>
  )
}

function PoolSelector({
  pools,
  selectedPool,
  onPoolChange,
}: {
  pools: Pool[]
  selectedPool: Pool | null
  onPoolChange: (pool: Pool | null) => void
}) {
  if (pools.length <= 1) return null

  return (
    <div className='bg-white rounded-lg shadow p-6 mb-6'>
      <label className='block text-sm font-medium text-gray-700 mb-2'>
        Select Pool
      </label>
      <select
        value={selectedPool?._id.toString() || ''}
        onChange={(e) => {
          const pool = pools.find((p) => p._id.toString() === e.target.value)
          onPoolChange(pool || null)
        }}
        className='w-full px-3 py-2 border border-gray-300 rounded-md'>
        <option value=''>Select a pool...</option>
        {pools.map((pool) => (
          <option key={pool._id.toString()} value={pool._id.toString()}>
            {pool.name} ({pool.volume.gallons.toLocaleString()} gal)
          </option>
        ))}
      </select>
    </div>
  )
}

function NotesSection({
  visit,
  setVisit,
}: {
  visit: VisitLog
  setVisit: React.Dispatch<React.SetStateAction<VisitLog>>
}) {
  return (
    <div className='bg-white rounded-lg shadow p-6'>
      <h3 className='text-lg font-semibold mb-4'>
        📝 Visit Notes & Recommendations
      </h3>
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Visit Notes
          </label>
          <textarea
            value={visit.notes}
            onChange={(e) =>
              setVisit((prev) => ({ ...prev, notes: e.target.value }))
            }
            className='w-full px-3 py-2 border border-gray-300 rounded-md h-32'
            placeholder='Additional notes, observations, client requests, issues noted, etc.'
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Next Visit Recommendations
          </label>
          <textarea
            value={visit.nextVisitRecommendations || ''}
            onChange={(e) =>
              setVisit((prev) => ({
                ...prev,
                nextVisitRecommendations: e.target.value,
              }))
            }
            className='w-full px-3 py-2 border border-gray-300 rounded-md h-24'
            placeholder='Recommendations for next visit, items to monitor, follow-up needed...'
          />
        </div>
      </div>
    </div>
  )
}

// Helper Functions
function getVisitTypeTitle(serviceType: VisitLog['serviceType']): string {
  const titles = {
    'maintenance-routine': 'Routine Maintenance Visit',
    'maintenance-chemical': 'Chemical Balance Visit',
    'service-repair': 'Equipment Repair Service',
    'service-installation': 'Equipment Installation',
    'service-emergency': 'Emergency Service Call',
    'retail-delivery': 'Product Delivery',
    'retail-pickup': 'Product Pickup',
  }
  return titles[serviceType] || 'Service Visit'
}

function getDefaultTasks(
  serviceType: VisitLog['serviceType']
): Array<{ task: string; completed: boolean }> {
  const maintenanceTasks = [
    { task: 'Test water chemistry', completed: false },
    { task: 'Skim surface debris', completed: false },
    { task: 'Empty skimmer baskets', completed: false },
    { task: 'Brush pool walls and floor', completed: false },
    { task: 'Vacuum pool', completed: false },
    { task: 'Check equipment operation', completed: false },
    { task: 'Clean waterline', completed: false },
    { task: 'Backwash filter (if needed)', completed: false },
  ]

  const serviceTasks = [
    { task: 'Diagnose issue', completed: false },
    { task: 'Test equipment', completed: false },
    { task: 'Replace/repair components', completed: false },
    { task: 'Verify proper operation', completed: false },
    { task: 'Clean work area', completed: false },
  ]

  const retailTasks = [
    { task: 'Verify delivery items', completed: false },
    { task: 'Check product condition', completed: false },
    { task: 'Obtain customer signature', completed: false },
    { task: 'Process payment (if applicable)', completed: false },
  ]

  if (serviceType.startsWith('maintenance')) return maintenanceTasks
  if (serviceType.startsWith('service')) return serviceTasks
  if (serviceType.startsWith('retail')) return retailTasks

  return []
}

// Import the specialized form components (these would be separate files)
// For brevity, I'll include placeholder implementations

function MaintenanceVisitForm({
  visit,
  setVisit,
  selectedPool,
  setShowCalculator,
}: any) {
  return (
    <div className='space-y-6'>
      {/* Water Testing Section */}
      <div className='bg-white rounded-lg shadow p-6'>
        <div className='flex justify-between items-center mb-4'>
          <h3 className='text-lg font-semibold'>🧪 Water Testing</h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowCalculator(true)}
              className='text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded'>
              🧮 Calculator
            </button>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              pH
            </label>
            <input
              type='number'
              step='0.1'
              value={visit.readings?.ph || ''}
              onChange={(e) =>
                setVisit((prev: any) => ({
                  ...prev,
                  readings: {
                    ...prev.readings,
                    ph: e.target.value ? parseFloat(e.target.value) : undefined,
                  },
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              placeholder='7.4'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Free Chlorine
            </label>
            <input
              type='number'
              step='0.1'
              value={visit.readings?.freeChlorine || ''}
              onChange={(e) =>
                setVisit((prev: any) => ({
                  ...prev,
                  readings: {
                    ...prev.readings,
                    freeChlorine: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  },
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              placeholder='2.0'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Total Alkalinity
            </label>
            <input
              type='number'
              value={visit.readings?.totalAlkalinity || ''}
              onChange={(e) =>
                setVisit((prev: any) => ({
                  ...prev,
                  readings: {
                    ...prev.readings,
                    totalAlkalinity: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  },
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md'
              placeholder='100'
            />
          </div>
        </div>
      </div>

      {/* Tasks and Pool Condition sections would go here */}
    </div>
  )
}

function ServiceVisitForm({ visit, setVisit, client }: any) {
  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>🔧 Service Details</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Issue Description
            </label>
            <textarea
              value={visit.serviceDetails?.issueDescription || ''}
              onChange={(e) =>
                setVisit((prev: any) => ({
                  ...prev,
                  serviceDetails: {
                    ...prev.serviceDetails,
                    issueDescription: e.target.value,
                  },
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md h-24'
              placeholder='Describe the issue or service request...'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Labor Hours
              </label>
              <input
                type='number'
                step='0.25'
                value={visit.serviceDetails?.laborHours || ''}
                onChange={(e) =>
                  setVisit((prev: any) => ({
                    ...prev,
                    serviceDetails: {
                      ...prev.serviceDetails,
                      laborHours: e.target.value
                        ? parseFloat(e.target.value)
                        : 0,
                    },
                  }))
                }
                className='w-full px-3 py-2 border border-gray-300 rounded-md'
                placeholder='2.5'
              />
            </div>

            <div className='flex items-end'>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={visit.serviceDetails?.warrantyWork || false}
                  onChange={(e) =>
                    setVisit((prev: any) => ({
                      ...prev,
                      serviceDetails: {
                        ...prev.serviceDetails,
                        warrantyWork: e.target.checked,
                      },
                    }))
                  }
                  className='mr-2'
                />
                <span className='text-sm font-medium text-gray-700'>
                  Warranty Work
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RetailVisitForm({ visit, setVisit, client }: any) {
  return (
    <div className='space-y-6'>
      <div className='bg-white rounded-lg shadow p-6'>
        <h3 className='text-lg font-semibold mb-4'>📦 Delivery Details</h3>
        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Delivery Instructions
            </label>
            <textarea
              value={visit.retailDetails?.deliveryInstructions || ''}
              onChange={(e) =>
                setVisit((prev: any) => ({
                  ...prev,
                  retailDetails: {
                    ...prev.retailDetails,
                    deliveryInstructions: e.target.value,
                  },
                }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md h-20'
              placeholder='Special delivery instructions, placement location, etc.'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={visit.retailDetails?.customerPresent || false}
                  onChange={(e) =>
                    setVisit((prev: any) => ({
                      ...prev,
                      retailDetails: {
                        ...prev.retailDetails,
                        customerPresent: e.target.checked,
                      },
                    }))
                  }
                  className='mr-2'
                />
                <span className='text-sm font-medium text-gray-700'>
                  Customer Present
                </span>
              </label>
            </div>

            <div>
              <label className='flex items-center'>
                <input
                  type='checkbox'
                  checked={visit.retailDetails?.signatureRequired || false}
                  onChange={(e) =>
                    setVisit((prev: any) => ({
                      ...prev,
                      retailDetails: {
                        ...prev.retailDetails,
                        signatureRequired: e.target.checked,
                      },
                    }))
                  }
                  className='mr-2'
                />
                <span className='text-sm font-medium text-gray-700'>
                  Signature Required
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
