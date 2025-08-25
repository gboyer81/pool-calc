'use client'

import React, { useState, useEffect } from 'react'

interface ServiceVisit {
  clientName: string
  poolName: string
  visitDate: string
  readings: {
    ph: number | null
    totalChlorine: number | null
    freeChlorine: number | null
    totalAlkalinity: number | null
    calciumHardness: number | null
    cyanuricAcid: number | null
    salt: number | null
    temperature: number | null
  }
  chemicalsAdded: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
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
  notes: string
  duration: number
}

interface LogServiceVisitProps {
  visit: ServiceVisit
  setVisit: React.Dispatch<React.SetStateAction<ServiceVisit>>
  client: any
  // Add these new props:
  onSave: () => void
  onCancel: () => void
  isSubmitting?: boolean
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

const commonChemicals = [
  { name: 'Liquid Chlorine', units: ['gallons', 'fluid ounces'] },
  { name: 'Cal-Hypo Powder', units: ['pounds', 'ounces'] },
  { name: 'Dichlor Granular', units: ['pounds', 'ounces'] },
  { name: 'Muriatic Acid', units: ['gallons', 'fluid ounces'] },
  { name: 'Soda Ash', units: ['pounds', 'ounces'] },
  { name: 'Sodium Bicarbonate', units: ['pounds', 'ounces'] },
  { name: 'Calcium Chloride', units: ['pounds', 'ounces'] },
  { name: 'Cyanuric Acid', units: ['pounds', 'ounces'] },
  { name: 'Salt', units: ['pounds', 'bags'] },
  { name: 'Algaecide', units: ['fluid ounces', 'gallons'] },
  { name: 'Clarifier', units: ['fluid ounces', 'gallons'] },
]

export default function LogServiceVisit({
  visit,
  setVisit,
  client,
  onSave, // NEW
  onCancel, // NEW
  isSubmitting = false, // NEW
}: LogServiceVisitProps) {
  // const [visit, setVisit] = useState<ServiceVisit>({
  //   clientName: 'Johnson Family',
  //   poolName: 'Main Pool',
  //   visitDate: new Date().toISOString().split('T')[0],
  //   readings: {
  //     ph: null,
  //     totalChlorine: null,
  //     freeChlorine: null,
  //     totalAlkalinity: null,
  //     calciumHardness: null,
  //     cyanuricAcid: null,
  //     salt: null,
  //     temperature: null,
  //   },
  //   chemicalsAdded: [],
  //   tasksCompleted: standardTasks.map((task) => ({ task, completed: false })),
  //   poolCondition: {
  //     waterClarity: 'clear',
  //     debris: 'none',
  //     equipmentStatus: 'normal',
  //   },
  //   notes: '',
  //   duration: 0,
  // })

  const [startTime, setStartTime] = useState<Date | null>(null)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [showChemicalCalculator, setShowChemicalCalculator] = useState(false)

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
        [field]: value === '' ? null : parseFloat(value),
      },
    }))
  }

  const toggleTask = (index: number) => {
    setVisit((prev) => ({
      ...prev,
      tasksCompleted: prev.tasksCompleted.map((task, i) =>
        i === index ? { ...task, completed: !task.completed } : task
      ),
    }))
  }

  const addChemical = () => {
    setVisit((prev) => ({
      ...prev,
      chemicalsAdded: [
        ...prev.chemicalsAdded,
        { chemical: '', amount: 0, unit: '', reason: '' },
      ],
    }))
  }

  const updateChemical = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setVisit((prev) => ({
      ...prev,
      chemicalsAdded: prev.chemicalsAdded.map((chemical, i) =>
        i === index ? { ...chemical, [field]: value } : chemical
      ),
    }))
  }

  const removeChemical = (index: number) => {
    setVisit((prev) => ({
      ...prev,
      chemicalsAdded: prev.chemicalsAdded.filter((_, i) => i !== index),
    }))
  }

  const getReadingStatus = (
    field: keyof typeof visit.readings,
    value: number | null
  ) => {
    if (value === null) return 'border-input'

    const ranges = {
      ph: { min: 7.2, max: 7.6, ideal: 7.4 },
      freeChlorine: { min: 1.0, max: 3.0, ideal: 2.0 },
      totalAlkalinity: { min: 80, max: 120, ideal: 100 },
      calciumHardness: { min: 200, max: 400, ideal: 300 },
    }

    const range = ranges[field as keyof typeof ranges]
    if (!range) return 'border-input'

    if (value >= range.min && value <= range.max) {
      return 'border-green-500 bg-green-50'
    } else {
      return 'border-red-500 bg-red-50'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className='max-w-4xl mx-auto p-6 bg-background'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>
            Service Visit Log
          </h1>
          <p className='text-muted-foreground'>
            {visit.clientName} - {visit.poolName}
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <div className='text-right'>
            <div className='text-2xl font-bold text-blue-600'>
              {formatDuration(visit.duration)}
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

      <div className='space-y-8'>
        {/* Water Testing Results */}
        <div className='bg-background border border-border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4 flex items-center'>
            🧪 Water Testing Results
            <button
              onClick={() => setShowChemicalCalculator(true)}
              className='ml-auto text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700'>
              Use Calculator
            </button>
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                pH
              </label>
              <input
                type='number'
                step='0.1'
                value={visit.readings.ph || ''}
                onChange={(e) => updateReading('ph', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${getReadingStatus(
                  'ph',
                  visit.readings.ph
                )}`}
                placeholder='7.4'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Free Chlorine (ppm)
              </label>
              <input
                type='number'
                step='0.1'
                value={visit.readings.freeChlorine || ''}
                onChange={(e) => updateReading('freeChlorine', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${getReadingStatus(
                  'freeChlorine',
                  visit.readings.freeChlorine
                )}`}
                placeholder='2.0'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Total Chlorine (ppm)
              </label>
              <input
                type='number'
                step='0.1'
                value={visit.readings.totalChlorine || ''}
                onChange={(e) => updateReading('totalChlorine', e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md'
                placeholder='2.2'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Total Alkalinity (ppm)
              </label>
              <input
                type='number'
                value={visit.readings.totalAlkalinity || ''}
                onChange={(e) =>
                  updateReading('totalAlkalinity', e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-md ${getReadingStatus(
                  'totalAlkalinity',
                  visit.readings.totalAlkalinity
                )}`}
                placeholder='100'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Calcium Hardness (ppm)
              </label>
              <input
                type='number'
                value={visit.readings.calciumHardness || ''}
                onChange={(e) =>
                  updateReading('calciumHardness', e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-md ${getReadingStatus(
                  'calciumHardness',
                  visit.readings.calciumHardness
                )}`}
                placeholder='250'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Cyanuric Acid (ppm)
              </label>
              <input
                type='number'
                value={visit.readings.cyanuricAcid || ''}
                onChange={(e) => updateReading('cyanuricAcid', e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md'
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
                className='w-full px-3 py-2 border border-input rounded-md'
                placeholder='3200'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Temperature (°F)
              </label>
              <input
                type='number'
                value={visit.readings.temperature || ''}
                onChange={(e) => updateReading('temperature', e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md'
                placeholder='82'
              />
            </div>
          </div>
        </div>

        {/* Chemicals Added */}
        <div className='bg-background border border-border rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>⚗️ Chemicals Added</h2>
            <button
              onClick={addChemical}
              className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
              + Add Chemical
            </button>
          </div>
          <div className='space-y-3'>
            {visit.chemicalsAdded.map((chemical, index) => (
              <div key={index} className='grid grid-cols-5 gap-3 items-end'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Chemical
                  </label>
                  <select
                    value={chemical.chemical}
                    onChange={(e) =>
                      updateChemical(index, 'chemical', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md'>
                    <option value=''>Select...</option>
                    {commonChemicals.map((chem) => (
                      <option key={chem.name} value={chem.name}>
                        {chem.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Amount
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={chemical.amount}
                    onChange={(e) =>
                      updateChemical(
                        index,
                        'amount',
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className='w-full px-3 py-2 border border-input rounded-md'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Unit
                  </label>
                  <select
                    value={chemical.unit}
                    onChange={(e) =>
                      updateChemical(index, 'unit', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md'>
                    <option value=''>Unit...</option>
                    <option value='pounds'>Pounds</option>
                    <option value='ounces'>Ounces</option>
                    <option value='gallons'>Gallons</option>
                    <option value='fluid ounces'>Fluid Ounces</option>
                    <option value='bags'>Bags</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>
                    Reason
                  </label>
                  <input
                    type='text'
                    value={chemical.reason}
                    onChange={(e) =>
                      updateChemical(index, 'reason', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md'
                    placeholder='Adjust pH, etc.'
                  />
                </div>
                <button
                  onClick={() => removeChemical(index)}
                  className='bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700'>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Service Tasks */}
        <div className='bg-background border border-border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>✅ Service Tasks</h2>
          <div className='grid grid-cols-2 gap-3'>
            {visit.tasksCompleted.map((task, index) => (
              <label key={index} className='flex items-center'>
                <input
                  type='checkbox'
                  checked={task.completed}
                  onChange={() => toggleTask(index)}
                  className='mr-3 h-4 w-4 text-blue-600'
                />
                <span
                  className={
                    task.completed ? 'line-through text-gray-500' : ''
                  }>
                  {task.task}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pool Condition */}
        <div className='bg-background border border-border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>🏊 Pool Condition</h2>
          <div className='grid grid-cols-3 gap-6'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Water Clarity
              </label>
              <select
                value={visit.poolCondition.waterClarity}
                onChange={(e) =>
                  setVisit((prev) => ({
                    ...prev,
                    poolCondition: {
                      ...prev.poolCondition,
                      waterClarity: e.target.value as any,
                    },
                  }))
                }
                className='w-full px-3 py-2 border border-input rounded-md'>
                <option value='clear'>Clear</option>
                <option value='cloudy'>Cloudy</option>
                <option value='green'>Green</option>
                <option value='black'>Black</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Debris Level
              </label>
              <select
                value={visit.poolCondition.debris}
                onChange={(e) =>
                  setVisit((prev) => ({
                    ...prev,
                    poolCondition: {
                      ...prev.poolCondition,
                      debris: e.target.value as any,
                    },
                  }))
                }
                className='w-full px-3 py-2 border border-input rounded-md'>
                <option value='none'>None</option>
                <option value='light'>Light</option>
                <option value='moderate'>Moderate</option>
                <option value='heavy'>Heavy</option>
              </select>
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Equipment Status
              </label>
              <select
                value={visit.poolCondition.equipmentStatus}
                onChange={(e) =>
                  setVisit((prev) => ({
                    ...prev,
                    poolCondition: {
                      ...prev.poolCondition,
                      equipmentStatus: e.target.value as any,
                    },
                  }))
                }
                className='w-full px-3 py-2 border border-input rounded-md'>
                <option value='normal'>Normal</option>
                <option value='issues'>Issues Noted</option>
                <option value='service-needed'>Service Needed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visit Notes */}
        <div className='bg-background border border-border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>📝 Visit Notes</h2>
          <textarea
            value={visit.notes}
            onChange={(e) =>
              setVisit((prev) => ({ ...prev, notes: e.target.value }))
            }
            className='w-full px-3 py-2 border border-input rounded-md h-32'
            placeholder='Additional notes, equipment issues, client requests, etc.'
          />
        </div>

        {/* Save Buttons */}
        <div className='flex gap-4 pt-6'>
          <button
            onClick={onSave}
            disabled={isSubmitting}
            className='flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium disabled:opacity-50'>
            {isSubmitting ? '💾 Saving...' : '💾 Save Visit'}
          </button>

          <button
            onClick={() => {
              onSave() // Save first
              // TODO: Add text functionality later if needed
              alert('Text functionality coming soon!')
            }}
            disabled={isSubmitting}
            className='flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium disabled:opacity-50'>
            {isSubmitting ? '📱 Saving...' : '📱 Save & Text Client'}
          </button>

          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className='bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50'>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
