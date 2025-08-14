import React, { useState, useEffect } from 'react'
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
    if (value === undefined || !selectedPool) return 'border-gray-300'

    const target =
      selectedPool.targetLevels[field as keyof typeof selectedPool.targetLevels]
    if (!target) return 'border-gray-300'

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
      <div className='max-w-4xl mx-auto p-6 bg-white'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Service Visit Log
            </h1>
            <p className='text-gray-600'>
              {client?.name} - {client?.address.street}, {client?.address.city}
            </p>
          </div>
          <div className='flex items-center gap-4'>
            <div className='text-right'>
              <div className='text-2xl font-bold text-blue-600'>
                {Math.floor(visit.duration / 60)}h {visit.duration % 60}m
              </div>
              <div className='text-sm text-gray-600'>Duration</div>
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
              className='w-full px-3 py-2 border border-gray-300 rounded-md'>
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
            <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-xl font-semibold'>
                  🧪 Water Testing Results
                </h2>
                <div className='text-sm text-gray-600'>
                  Pool: {selectedPool.volume.gallons.toLocaleString()} gallons
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    pH (Target: {selectedPool.targetLevels.ph.target})
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='number'
                      step='0.1'
                      value={visit.readings.ph || ''}
                      onChange={(e) => updateReading('ph', e.target.value)}
                      className={`flex-1 px-3 py-2 border rounded-md ${getReadingStatus(
                        'ph',
                        visit.readings.ph
                      )}`}
                      placeholder='7.4'
                    />
                    <button
                      onClick={() => openCalculator('ph')}
                      className='bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700'>
                      📊
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Free Chlorine (Target:{' '}
                    {selectedPool.targetLevels.freeChlorine.target})
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='number'
                      step='0.1'
                      value={visit.readings.freeChlorine || ''}
                      onChange={(e) =>
                        updateReading('freeChlorine', e.target.value)
                      }
                      className={`flex-1 px-3 py-2 border rounded-md ${getReadingStatus(
                        'freeChlorine',
                        visit.readings.freeChlorine
                      )}`}
                      placeholder='2.0'
                    />
                    <button
                      onClick={() => openCalculator('chlorine')}
                      className='bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700'>
                      📊
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Total Alkalinity (Target:{' '}
                    {selectedPool.targetLevels.totalAlkalinity.target})
                  </label>
                  <div className='flex gap-2'>
                    <input
                      type='number'
                      value={visit.readings.totalAlkalinity || ''}
                      onChange={(e) =>
                        updateReading('totalAlkalinity', e.target.value)
                      }
                      className={`flex-1 px-3 py-2 border rounded-md ${getReadingStatus(
                        'totalAlkalinity',
                        visit.readings.totalAlkalinity
                      )}`}
                      placeholder='100'
                    />
                    <button
                      onClick={() => openCalculator('alkalinity')}
                      className='bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700'>
                      📊
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Temperature (°F)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.temperature || ''}
                    onChange={(e) =>
                      updateReading('temperature', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    placeholder='82'
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Calcium Hardness
                  </label>
                  <input
                    type='number'
                    value={visit.readings.calciumHardness || ''}
                    onChange={(e) =>
                      updateReading('calciumHardness', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    placeholder='250'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Cyanuric Acid
                  </label>
                  <input
                    type='number'
                    value={visit.readings.cyanuricAcid || ''}
                    onChange={(e) =>
                      updateReading('cyanuricAcid', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    placeholder='50'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Salt (ppm)
                  </label>
                  <input
                    type='number'
                    value={visit.readings.salt || ''}
                    onChange={(e) => updateReading('salt', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    placeholder='3200'
                  />
                </div>
              </div>
            </div>

            {/* Chemicals Added */}
            <div className='bg-white border border-gray-200 rounded-lg p-6 mb-6'>
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
                    className='grid grid-cols-5 gap-3 items-end p-3 bg-gray-50 rounded'>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>
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
                        className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
                        placeholder='Liquid Chlorine'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>
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
                        className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
                      />
                    </div>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>
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
                        className='w-full px-2 py-1 border border-gray-300 rounded text-sm'>
                        <option value=''>Unit...</option>
                        <option value='gallons'>Gallons</option>
                        <option value='fluid ounces'>Fluid Ounces</option>
                        <option value='pounds'>Pounds</option>
                        <option value='ounces'>Ounces</option>
                      </select>
                    </div>
                    <div>
                      <label className='block text-xs text-gray-600 mb-1'>
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
                        className='w-full px-2 py-1 border border-gray-300 rounded text-sm'
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
            <div className='flex gap-4 mb-6'>
              <button
                onClick={submitVisit}
                disabled={!visit.poolId}
                className='flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed'>
                💾 Complete Visit
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className='bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors'>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Mini Calculator Modal */}
        {showCalculator && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg max-w-md w-full mx-4 p-6'>
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

              <div className='text-center text-gray-600 mb-4'>
                <p>
                  Pool Volume: {selectedPool?.volume.gallons.toLocaleString()}{' '}
                  gallons
                </p>
                <p>
                  This would integrate with your existing calculator component
                </p>
              </div>

              <div className='flex gap-3'>
                <button
                  onClick={() => setShowCalculator(false)}
                  className='flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400'>
                  Cancel
                </button>
                <button
                  onClick={() => window.open('/', '_blank')}
                  className='flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700'>
                  Open Full Calculator
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
