'use client'

import React, { useState, useEffect } from 'react'
import {
  PhCalculatorForm,
  ChlorineCalculatorForm,
  AlkalinityCalculatorForm,
} from '../../components/VisitCalculators'
import ProtectedRoute from '../../components/ProtectedRoute'

interface Client {
  _id: string
  name: string
  address: { street: string; city: string; state: string }
}

interface Pool {
  _id: string
  name: string
  volume: { gallons: number }
  targetLevels: {
    ph: { target: number }
    freeChlorine: { target: number }
    totalAlkalinity: { target: number }
    calciumHardness: { target: number }
  }
}

interface ServiceVisit {
  clientId: string
  poolId: string
  readings: {
    ph?: number
    totalChlorine?: number
    freeChlorine?: number
    totalAlkalinity?: number
    calciumHardness?: number
    cyanuricAcid?: number
    salt?: number
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
  poolCondition: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }
  duration: number
  notes: string
}

const standardTasks = [
  'Skimmed surface',
  'Emptied skimmer baskets',
  'Emptied pump basket',
  'Brushed walls and floor',
  'Vacuumed pool',
  'Tested water chemistry',
  'Added chemicals',
  'Checked equipment operation',
  'Backwashed filter',
  'Cleaned tile line',
]

export default function EnhancedVisitLogging() {
  const [client, setClient] = useState<Client | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [visit, setVisit] = useState<ServiceVisit>({
    clientId: '',
    poolId: '',
    readings: {},
    chemicalsAdded: [],
    tasksCompleted: standardTasks.map((task) => ({ task, completed: false })),
    poolCondition: {
      waterClarity: 'clear',
      debris: 'none',
      equipmentStatus: 'normal',
    },
    duration: 0,
    notes: '',
  })
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorType, setCalculatorType] = useState<
    'ph' | 'chlorine' | 'alkalinity'
  >('ph')
  const [loading, setLoading] = useState(true)

  // Get client and pool from URL params or load from API
  useEffect(() => {
    const loadClientAndPools = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const clientId = urlParams.get('clientId')
        const poolId = urlParams.get('poolId')

        if (!clientId) {
          // Redirect to dashboard if no client specified
          window.location.href = '/dashboard'
          return
        }

        const token = localStorage.getItem('technicianToken')

        // Fetch client details
        const clientResponse = await fetch(`/api/clients/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (clientResponse.ok) {
          const clientData = await clientResponse.json()
          if (clientData.success) {
            setClient(clientData.client)
            setVisit((prev) => ({ ...prev, clientId }))
          }
        }

        // Fetch pools for this client
        const poolsResponse = await fetch(`/api/pools?clientId=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (poolsResponse.ok) {
          const poolsData = await poolsResponse.json()
          if (poolsData.success) {
            setPools(poolsData.pools || [])

            // Auto-select pool if specified in URL
            if (poolId && poolsData.pools) {
              const pool = poolsData.pools.find((p: Pool) => p._id === poolId)
              if (pool) {
                setSelectedPool(pool)
                setVisit((prev) => ({ ...prev, poolId }))
              }
            } else if (poolsData.pools?.length === 1) {
              // Auto-select if only one pool
              setSelectedPool(poolsData.pools[0])
              setVisit((prev) => ({ ...prev, poolId: poolsData.pools[0]._id }))
            }
          }
        }
      } catch (error) {
        console.error('Error loading client and pools:', error)
      } finally {
        setLoading(false)
      }
    }

    loadClientAndPools()
  }, [])

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const duration = Math.floor(
          (now.getTime() - startTime.getTime()) / 1000 / 60
        )
        setVisit((prev) => ({ ...prev, duration }))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, startTime])

  const startTimer = () => {
    setStartTime(new Date())
    setIsTimerRunning(true)
  }

  const stopTimer = () => {
    setIsTimerRunning(false)
  }

  const updateReading = (field: keyof typeof visit.readings, value: string) => {
    setVisit((prev) => ({
      ...prev,
      readings: {
        ...prev.readings,
        [field]: value === '' ? undefined : parseFloat(value),
      },
    }))
  }

  const getReadingStatus = (
    field: keyof typeof visit.readings,
    value: number | undefined
  ) => {
    if (value === undefined || !selectedPool) return 'border-input'

    const target =
      selectedPool.targetLevels[field as keyof typeof selectedPool.targetLevels]
    if (!target) return 'border-input'

    // Simple range check (you can make this more sophisticated)
    const tolerance = target.target * 0.1 // 10% tolerance
    if (Math.abs(value - target.target) <= tolerance) {
      return 'border-green-500 bg-green-50'
    } else {
      return 'border-red-500 bg-red-50'
    }
  }

  const openCalculator = (type: 'ph' | 'chlorine' | 'alkalinity') => {
    setCalculatorType(type)
    setShowCalculator(true)
  }

  const addChemicalFromCalculator = (
    chemical: string,
    amount: number,
    unit: string,
    reason: string
  ) => {
    setVisit((prev) => ({
      ...prev,
      chemicalsAdded: [
        ...prev.chemicalsAdded,
        {
          chemical,
          amount,
          unit,
          reason,
          calculatedRecommendation: `Calculated using ${calculatorType} calculator`,
        },
      ],
    }))
    setShowCalculator(false)
  }

  const submitVisit = async () => {
    try {
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
          serviceType: 'routine',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert('Visit logged successfully!')
          window.location.href = '/dashboard'
        } else {
          alert('Error: ' + data.error)
        }
      } else {
        alert('Failed to log visit')
      }
    } catch (error) {
      console.error('Error submitting visit:', error)
      alert('Error submitting visit')
    }
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        Loading...
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['technician', 'supervisor', 'admin']}>
      <div className='p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>
              Service Visit Log
            </h1>
            <p className='text-muted-foreground'>
              {client?.name} - {client?.address.street}, {client?.address.city}
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <div className='text-right'>
              <div className='text-2xl font-bold text-blue-600'>
                {Math.floor(visit.duration / 60)}h {visit.duration % 60}m
              </div>
              <div className='text-sm text-muted-foreground'>Duration</div>
            </div>
            {!isTimerRunning ? (
              <button
                onClick={startTimer}
                className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'>
                ▶️ Start Visit
              </button>
            ) : (
              <button
                onClick={stopTimer}
                className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors'>
                ⏸️ End Visit
              </button>
            )}
          </div>
        </div>

        {/* Pool Selection */}
        {pools.length > 1 && (
          <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Pool:
            </label>
            <select
              value={selectedPool?._id || ''}
              onChange={(e) => {
                const pool = pools.find((p) => p._id === e.target.value)
                setSelectedPool(pool || null)
                setVisit((prev) => ({ ...prev, poolId: e.target.value }))
              }}
              className='w-full px-3 py-2 border border-input rounded-md'>
              <option value=''>Select a pool...</option>
              {pools.map((pool) => (
                <option key={pool._id} value={pool._id}>
                  {pool.name} ({pool.volume.gallons.toLocaleString()} gallons)
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedPool && (
          <>
            {/* Water Testing with Calculator Integration */}
            <div className='bg-background border border-border rounded-lg p-6 max-w-screen-2xl mx-auto'>
              <h2 className='text-xl font-semibold mb-4 flex items-center'>
                🧪 Water Testing Results
                <button
                  onClick={() => setShowCalculator(true)}
                  className='ml-auto text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700'>
                  Use Calculator
                </button>
              </h2>

              {/* Updated grid with better responsive behavior and spacing, constrained to page width */}
              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full'>
                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    pH
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={visit.readings.ph || ''}
                    onChange={(e) => updateReading('ph', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getReadingStatus(
                      'ph',
                      visit.readings.ph
                    )}`}
                    placeholder='7.4'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Free Chlorine (ppm)
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={visit.readings.freeChlorine || ''}
                    onChange={(e) =>
                      updateReading('freeChlorine', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getReadingStatus(
                      'freeChlorine',
                      visit.readings.freeChlorine
                    )}`}
                    placeholder='2.0'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Total Chlorine (ppm)
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={visit.readings.totalChlorine || ''}
                    onChange={(e) =>
                      updateReading('totalChlorine', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='2.2'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Total Alkalinity (ppm)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.totalAlkalinity || ''}
                    onChange={(e) =>
                      updateReading('totalAlkalinity', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getReadingStatus(
                      'totalAlkalinity',
                      visit.readings.totalAlkalinity
                    )}`}
                    placeholder='100'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Calcium Hardness (ppm)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.calciumHardness || ''}
                    onChange={(e) =>
                      updateReading('calciumHardness', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getReadingStatus(
                      'calciumHardness',
                      visit.readings.calciumHardness
                    )}`}
                    placeholder='250'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Cyanuric Acid (ppm)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.cyanuricAcid || ''}
                    onChange={(e) =>
                      updateReading('cyanuricAcid', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='50'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Salt (ppm)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.salt || ''}
                    onChange={(e) => updateReading('salt', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='3200'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Temperature (°F)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.temperature || ''}
                    onChange={(e) =>
                      updateReading('temperature', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='82'
                  />
                </div>
              </div>
            </div>

            {/* Chemicals Added */}
            <div className='bg-background border border-border rounded-lg p-6 mb-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>⚗️ Chemicals Added</h2>
                <button
                  onClick={() =>
                    setVisit((prev) => ({
                      ...prev,
                      chemicalsAdded: [
                        ...prev.chemicalsAdded,
                        { chemical: '', amount: 0, unit: '', reason: '' },
                      ],
                    }))
                  }
                  className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
                  + Add Chemical
                </button>
              </div>

              <div className='space-y-3'>
                {visit.chemicalsAdded.map((chemical, index) => (
                  <div
                    key={index}
                    className='grid grid-cols-5 gap-3 items-end p-3 bg-muted/50 rounded'>
                    <div>
                      <label className='block text-xs text-muted-foreground mb-1'>
                        Chemical
                      </label>
                      <input
                        type='text'
                        value={chemical.chemical}
                        onChange={(e) =>
                          setVisit((prev) => ({
                            ...prev,
                            chemicalsAdded: prev.chemicalsAdded.map((c, i) =>
                              i === index
                                ? { ...c, chemical: e.target.value }
                                : c
                            ),
                          }))
                        }
                        className='w-full px-2 py-1 border border-input rounded text-sm'
                        placeholder='Liquid Chlorine'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-muted-foreground mb-1'>
                        Amount
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={chemical.amount}
                        onChange={(e) =>
                          setVisit((prev) => ({
                            ...prev,
                            chemicalsAdded: prev.chemicalsAdded.map((c, i) =>
                              i === index
                                ? {
                                    ...c,
                                    amount: parseFloat(e.target.value) || 0,
                                  }
                                : c
                            ),
                          }))
                        }
                        className='w-full px-2 py-1 border border-input rounded text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-muted-foreground mb-1'>
                        Unit
                      </label>
                      <select
                        value={chemical.unit}
                        onChange={(e) =>
                          setVisit((prev) => ({
                            ...prev,
                            chemicalsAdded: prev.chemicalsAdded.map((c, i) =>
                              i === index ? { ...c, unit: e.target.value } : c
                            ),
                          }))
                        }
                        className='w-full px-2 py-1 border border-input rounded text-sm'>
                        <option value=''>Unit...</option>
                        <option value='gallons'>Gallons</option>
                        <option value='fluid ounces'>Fluid Ounces</option>
                        <option value='pounds'>Pounds</option>
                        <option value='ounces'>Ounces</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-xs text-muted-foreground mb-1'>
                        Reason
                      </label>
                      <input
                        type='text'
                        value={chemical.reason}
                        onChange={(e) =>
                          setVisit((prev) => ({
                            ...prev,
                            chemicalsAdded: prev.chemicalsAdded.map((c, i) =>
                              i === index ? { ...c, reason: e.target.value } : c
                            ),
                          }))
                        }
                        className='w-full px-2 py-1 border border-input rounded text-sm'
                        placeholder='Adjust pH'
                      />
                    </div>
                    <button
                      onClick={() =>
                        setVisit((prev) => ({
                          ...prev,
                          chemicalsAdded: prev.chemicalsAdded.filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
                      className='bg-red-600 text-white px-2 py-1 rounded text-sm hover:bg-red-700'>
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className='flex justify-start gap-6 mb-6'>
              <div className='basis-[40%]'>
                <button
                  onClick={submitVisit}
                  disabled={!visit.poolId}
                  className='flex-1 bg-green-600 text-white w-full py-3 px-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed'>
                  💾 Complete Visit
                </button>
              </div>

              <div className='basis-[35%] border border-border rounded-lg'>
                <h2 className='text-2xl font-semibold font-stretch-semi-condensed leading-relaxed text-center align-middle'>
                  TODO: Add Note button
                </h2>
              </div>
              <div className='basis-1/4'>
                <button
                  onClick={() => (window.location.href = '/dashboard')}
                  className='bg-muted/500 text-white py-3 mr-6 w-full rounded-lg hover:bg-gray-600 transition-colors'>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* Mini Calculator Modal */}
        {showCalculator && selectedPool && (
          <div className='fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50'>
            <div className='bg-background rounded-lg max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-semibold'>
                  {calculatorType.charAt(0).toUpperCase() +
                    calculatorType.slice(1)}{' '}
                  Calculator
                </h3>
                <button
                  onClick={() => setShowCalculator(false)}
                  className='text-gray-500 hover:text-gray-700 text-xl'>
                  ✕
                </button>
              </div>

              <div className='space-y-4'>
                {/* Pool Info */}
                <div className='bg-blue-50 p-3 rounded-lg text-sm'>
                  <p>
                    <strong>Pool:</strong> {selectedPool.name}
                  </p>
                  <p>
                    <strong>Volume:</strong>{' '}
                    {selectedPool.volume.gallons.toLocaleString()} gallons
                  </p>
                </div>

                {/* Calculator Type Specific Forms */}
                {calculatorType === 'ph' && (
                  <PhCalculatorForm
                    poolVolume={selectedPool.volume.gallons}
                    currentPh={visit.readings.ph}
                    onAddChemical={addChemicalFromCalculator}
                  />
                )}

                {calculatorType === 'chlorine' && (
                  <ChlorineCalculatorForm
                    poolVolume={selectedPool.volume.gallons}
                    currentCl={visit.readings.freeChlorine}
                    targetCl={selectedPool.targetLevels.freeChlorine.target}
                    onAddChemical={addChemicalFromCalculator}
                  />
                )}

                {calculatorType === 'alkalinity' && (
                  <AlkalinityCalculatorForm
                    poolVolume={selectedPool.volume.gallons}
                    currentAlk={visit.readings.totalAlkalinity}
                    targetAlk={selectedPool.targetLevels.totalAlkalinity.target}
                    onAddChemical={addChemicalFromCalculator}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
