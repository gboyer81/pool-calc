'use client'

import React, { useState, useEffect } from 'react'

// Use the same Pool interface as your parent component
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
  // Extended properties for full editing capability
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
  // Extended target levels for editing
  extendedTargetLevels?: {
    ph?: { min?: number; max?: number; target: number }
    freeChlorine?: { min?: number; max?: number; target: number }
    totalAlkalinity?: { min?: number; max?: number; target: number }
    calciumHardness?: { min?: number; max?: number; target?: number }
    cyanuricAcid?: { min?: number; max?: number; target?: number }
    salt?: { min?: number; max?: number; target?: number }
  }
}

interface TabbedPoolEditorProps {
  pool: Pool | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPool: Partial<Pool>) => void
  saving?: boolean
}

type TabType = 'volume' | 'equipment' | 'targets' | 'notes'

export default function TabbedPoolEditor({
  pool,
  isOpen,
  onClose,
  onSave,
  saving = false,
}: TabbedPoolEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('volume')
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    type: 'residential' as 'residential' | 'commercial',
    shape: 'rectangular' as string,

    // Volume & Dimensions
    gallons: '',
    avgDepth: '',
    length: '',
    width: '',
    diameter: '',

    // Equipment
    filterType: 'sand' as 'sand' | 'cartridge' | 'de',
    filterModel: '',
    pumpModel: '',
    pumpHorsepower: '',
    heaterType: '' as '' | 'gas' | 'electric' | 'heat-pump',
    heaterModel: '',
    saltSystemModel: '',
    saltSystemTarget: '',

    // Chemical Targets
    phTarget: '',
    phMin: '',
    phMax: '',
    freeChlorineTarget: '',
    freeChlorineMin: '',
    freeChlorineMax: '',
    totalAlkalinityTarget: '',
    totalAlkalinityMin: '',
    totalAlkalinityMax: '',
    calciumHardnessTarget: '',
    calciumHardnessMin: '',
    calciumHardnessMax: '',
    cyanuricAcidTarget: '',
    cyanuricAcidMin: '',
    cyanuricAcidMax: '',
    saltTarget: '',
    saltMin: '',
    saltMax: '',

    // Notes
    notes: '',
  })

  // Populate form when pool changes
  useEffect(() => {
    if (pool) {
      setFormData({
        name: pool.name || '',
        type: pool.type || 'residential',
        shape: pool.shape || 'rectangular',

        gallons: pool.volume?.gallons?.toString() || '',
        avgDepth: pool.dimensions?.avgDepth?.toString() || '',
        length: pool.dimensions?.length?.toString() || '',
        width: pool.dimensions?.width?.toString() || '',
        diameter: pool.dimensions?.diameter?.toString() || '',

        filterType:
          (pool.equipment?.filter?.type as 'sand' | 'cartridge' | 'de') ||
          'sand',
        filterModel: pool.equipment?.filter?.model || '',
        pumpModel: pool.equipment?.pump?.model || '',
        pumpHorsepower: pool.equipment?.pump?.horsepower?.toString() || '',
        heaterType:
          (pool.equipment?.heater?.type as
            | ''
            | 'gas'
            | 'electric'
            | 'heat-pump') || '',
        heaterModel: pool.equipment?.heater?.model || '',
        saltSystemModel: pool.equipment?.saltSystem?.model || '',
        saltSystemTarget:
          pool.equipment?.saltSystem?.targetSalt?.toString() || '',

        // Use existing targetLevels structure, fallback to extended if available
        phTarget:
          pool.targetLevels?.ph?.target?.toString() ||
          pool.extendedTargetLevels?.ph?.target?.toString() ||
          '7.4',
        phMin: (pool.extendedTargetLevels?.ph?.min || 7.2).toString(),
        phMax: (pool.extendedTargetLevels?.ph?.max || 7.6).toString(),

        freeChlorineTarget:
          pool.targetLevels?.freeChlorine?.target?.toString() ||
          pool.extendedTargetLevels?.freeChlorine?.target?.toString() ||
          '2.0',
        freeChlorineMin: (
          pool.extendedTargetLevels?.freeChlorine?.min || 1.0
        ).toString(),
        freeChlorineMax: (
          pool.extendedTargetLevels?.freeChlorine?.max || 3.0
        ).toString(),

        totalAlkalinityTarget:
          pool.targetLevels?.totalAlkalinity?.target?.toString() ||
          pool.extendedTargetLevels?.totalAlkalinity?.target?.toString() ||
          '100',
        totalAlkalinityMin: (
          pool.extendedTargetLevels?.totalAlkalinity?.min || 80
        ).toString(),
        totalAlkalinityMax: (
          pool.extendedTargetLevels?.totalAlkalinity?.max || 120
        ).toString(),

        calciumHardnessTarget:
          pool.extendedTargetLevels?.calciumHardness?.target?.toString() ||
          '250',
        calciumHardnessMin: (
          pool.extendedTargetLevels?.calciumHardness?.min || 200
        ).toString(),
        calciumHardnessMax: (
          pool.extendedTargetLevels?.calciumHardness?.max || 400
        ).toString(),

        cyanuricAcidTarget:
          pool.extendedTargetLevels?.cyanuricAcid?.target?.toString() || '50',
        cyanuricAcidMin: (
          pool.extendedTargetLevels?.cyanuricAcid?.min || 30
        ).toString(),
        cyanuricAcidMax: (
          pool.extendedTargetLevels?.cyanuricAcid?.max || 80
        ).toString(),

        saltTarget: pool.extendedTargetLevels?.salt?.target?.toString() || '',
        saltMin: pool.extendedTargetLevels?.salt?.min?.toString() || '',
        saltMax: pool.extendedTargetLevels?.salt?.max?.toString() || '',

        notes: pool.notes || '',
      })
    }
  }, [pool])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!pool) return

    const updatedPool: Partial<Pool> = {
      name: formData.name.trim(),
      type: formData.type,
      shape: formData.shape,

      volume: {
        gallons: Number(formData.gallons) || 0,
      },

      dimensions: {
        avgDepth: Number(formData.avgDepth) || 0,
        ...(formData.length && { length: Number(formData.length) }),
        ...(formData.width && { width: Number(formData.width) }),
        ...(formData.diameter && { diameter: Number(formData.diameter) }),
      },

      equipment: {
        filter: {
          type: formData.filterType,
          model: formData.filterModel.trim(),
        },
        pump: {
          model: formData.pumpModel.trim(),
          horsepower: Number(formData.pumpHorsepower) || undefined,
        },
        ...(formData.heaterType && {
          heater: {
            type: formData.heaterType,
            model: formData.heaterModel.trim(),
          },
        }),
        ...(formData.saltSystemModel && {
          saltSystem: {
            model: formData.saltSystemModel.trim(),
            targetSalt: Number(formData.saltSystemTarget) || 3200,
          },
        }),
      },

      targetLevels: {
        ph: {
          target: Number(formData.phTarget) || 7.4,
        },
        freeChlorine: {
          target: Number(formData.freeChlorineTarget) || 2.0,
        },
        totalAlkalinity: {
          target: Number(formData.totalAlkalinityTarget) || 100,
        },
      },

      // Store extended target levels separately to preserve min/max values
      extendedTargetLevels: {
        ph: {
          target: Number(formData.phTarget) || 7.4,
          min: Number(formData.phMin) || 7.2,
          max: Number(formData.phMax) || 7.6,
        },
        freeChlorine: {
          target: Number(formData.freeChlorineTarget) || 2.0,
          min: Number(formData.freeChlorineMin) || 1.0,
          max: Number(formData.freeChlorineMax) || 3.0,
        },
        totalAlkalinity: {
          target: Number(formData.totalAlkalinityTarget) || 100,
          min: Number(formData.totalAlkalinityMin) || 80,
          max: Number(formData.totalAlkalinityMax) || 120,
        },
        ...(formData.calciumHardnessTarget && {
          calciumHardness: {
            target: Number(formData.calciumHardnessTarget),
            min: Number(formData.calciumHardnessMin) || 200,
            max: Number(formData.calciumHardnessMax) || 400,
          },
        }),
        ...(formData.cyanuricAcidTarget && {
          cyanuricAcid: {
            target: Number(formData.cyanuricAcidTarget),
            min: Number(formData.cyanuricAcidMin) || 30,
            max: Number(formData.cyanuricAcidMax) || 80,
          },
        }),
        ...(formData.saltTarget && {
          salt: {
            target: Number(formData.saltTarget),
            min: Number(formData.saltMin) || Number(formData.saltTarget) - 400,
            max: Number(formData.saltMax) || Number(formData.saltTarget) + 400,
          },
        }),
      },

      notes: formData.notes.trim(),
    }

    onSave(updatedPool)
  }

  if (!isOpen || !pool) return null

  const tabs = [
    { id: 'volume', label: '📏 Volume', icon: '📊' },
    { id: 'equipment', label: '⚙️ Equipment', icon: '🔧' },
    { id: 'targets', label: '🎯 Chemical Targets', icon: '⚗️' },
    { id: 'notes', label: '📝 Notes', icon: '💭' },
  ] as const

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg max-w-4xl w-full mx-4 max-h-screen overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex justify-between items-center'>
            <h2 className='text-2xl font-bold text-gray-900'>
              Edit Pool: {pool?.name || 'Loading...'}
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 text-2xl'>
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8 px-6'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}>
                <span className='mr-2'>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className='flex-1 overflow-y-auto p-6'>
          {/* Volume Tab */}
          {activeTab === 'volume' && (
            <div className='space-y-6'>
              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pool Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pool Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'>
                    <option value='residential'>Residential</option>
                    <option value='commercial'>Commercial</option>
                  </select>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Shape *
                  </label>
                  <select
                    value={formData.shape}
                    onChange={(e) => handleInputChange('shape', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'>
                    <option value='rectangular'>Rectangular</option>
                    <option value='circular'>Circular</option>
                    <option value='oval'>Oval</option>
                    <option value='kidney'>Kidney</option>
                    <option value='freeform'>Freeform</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Volume (gallons) *
                  </label>
                  <input
                    type='number'
                    value={formData.gallons}
                    onChange={(e) =>
                      handleInputChange('gallons', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Dimensions
                </h3>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Average Depth (ft) *
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      value={formData.avgDepth}
                      onChange={(e) =>
                        handleInputChange('avgDepth', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  {formData.shape === 'rectangular' && (
                    <>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Length (ft)
                        </label>
                        <input
                          type='number'
                          step='0.1'
                          value={formData.length}
                          onChange={(e) =>
                            handleInputChange('length', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                          Width (ft)
                        </label>
                        <input
                          type='number'
                          step='0.1'
                          value={formData.width}
                          onChange={(e) =>
                            handleInputChange('width', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>
                    </>
                  )}
                  {formData.shape === 'circular' && (
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Diameter (ft)
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.diameter}
                        onChange={(e) =>
                          handleInputChange('diameter', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className='space-y-6'>
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Filter System
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Filter Type
                    </label>
                    <select
                      value={formData.filterType}
                      onChange={(e) =>
                        handleInputChange('filterType', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'>
                      <option value='sand'>Sand Filter</option>
                      <option value='cartridge'>Cartridge Filter</option>
                      <option value='de'>DE Filter</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Filter Model
                    </label>
                    <input
                      type='text'
                      value={formData.filterModel}
                      onChange={(e) =>
                        handleInputChange('filterModel', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>Pump</h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Pump Model
                    </label>
                    <input
                      type='text'
                      value={formData.pumpModel}
                      onChange={(e) =>
                        handleInputChange('pumpModel', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Horsepower
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      value={formData.pumpHorsepower}
                      onChange={(e) =>
                        handleInputChange('pumpHorsepower', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Heater (Optional)
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Heater Type
                    </label>
                    <select
                      value={formData.heaterType}
                      onChange={(e) =>
                        handleInputChange('heaterType', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'>
                      <option value=''>No Heater</option>
                      <option value='gas'>Gas Heater</option>
                      <option value='electric'>Electric Heater</option>
                      <option value='heat-pump'>Heat Pump</option>
                    </select>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Heater Model
                    </label>
                    <input
                      type='text'
                      value={formData.heaterModel}
                      onChange={(e) =>
                        handleInputChange('heaterModel', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Salt System (Optional)
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Salt System Model
                    </label>
                    <input
                      type='text'
                      value={formData.saltSystemModel}
                      onChange={(e) =>
                        handleInputChange('saltSystemModel', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Target Salt Level (ppm)
                    </label>
                    <input
                      type='number'
                      value={formData.saltSystemTarget}
                      onChange={(e) =>
                        handleInputChange('saltSystemTarget', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      placeholder='3200'
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chemical Targets Tab */}
          {activeTab === 'targets' && (
            <div className='space-y-6'>
              <div className='grid gap-6'>
                {/* pH */}
                <div className='border border-gray-200 rounded-lg p-4'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    pH Levels
                  </h4>
                  <div className='grid grid-cols-3 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Target
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.phTarget}
                        onChange={(e) =>
                          handleInputChange('phTarget', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Min
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.phMin}
                        onChange={(e) =>
                          handleInputChange('phMin', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Max
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.phMax}
                        onChange={(e) =>
                          handleInputChange('phMax', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Free Chlorine */}
                <div className='border border-gray-200 rounded-lg p-4'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    Free Chlorine (ppm)
                  </h4>
                  <div className='grid grid-cols-3 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Target
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.freeChlorineTarget}
                        onChange={(e) =>
                          handleInputChange(
                            'freeChlorineTarget',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Min
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.freeChlorineMin}
                        onChange={(e) =>
                          handleInputChange('freeChlorineMin', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Max
                      </label>
                      <input
                        type='number'
                        step='0.1'
                        value={formData.freeChlorineMax}
                        onChange={(e) =>
                          handleInputChange('freeChlorineMax', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Total Alkalinity */}
                <div className='border border-gray-200 rounded-lg p-4'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    Total Alkalinity (ppm)
                  </h4>
                  <div className='grid grid-cols-3 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Target
                      </label>
                      <input
                        type='number'
                        value={formData.totalAlkalinityTarget}
                        onChange={(e) =>
                          handleInputChange(
                            'totalAlkalinityTarget',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Min
                      </label>
                      <input
                        type='number'
                        value={formData.totalAlkalinityMin}
                        onChange={(e) =>
                          handleInputChange(
                            'totalAlkalinityMin',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Max
                      </label>
                      <input
                        type='number'
                        value={formData.totalAlkalinityMax}
                        onChange={(e) =>
                          handleInputChange(
                            'totalAlkalinityMax',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Calcium Hardness */}
                <div className='border border-gray-200 rounded-lg p-4'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    Calcium Hardness (ppm)
                  </h4>
                  <div className='grid grid-cols-3 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Target
                      </label>
                      <input
                        type='number'
                        value={formData.calciumHardnessTarget}
                        onChange={(e) =>
                          handleInputChange(
                            'calciumHardnessTarget',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Min
                      </label>
                      <input
                        type='number'
                        value={formData.calciumHardnessMin}
                        onChange={(e) =>
                          handleInputChange(
                            'calciumHardnessMin',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Max
                      </label>
                      <input
                        type='number'
                        value={formData.calciumHardnessMax}
                        onChange={(e) =>
                          handleInputChange(
                            'calciumHardnessMax',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Cyanuric Acid */}
                <div className='border border-gray-200 rounded-lg p-4'>
                  <h4 className='text-md font-medium text-gray-900 mb-3'>
                    Cyanuric Acid (ppm)
                  </h4>
                  <div className='grid grid-cols-3 gap-3'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Target
                      </label>
                      <input
                        type='number'
                        value={formData.cyanuricAcidTarget}
                        onChange={(e) =>
                          handleInputChange(
                            'cyanuricAcidTarget',
                            e.target.value
                          )
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Min
                      </label>
                      <input
                        type='number'
                        value={formData.cyanuricAcidMin}
                        onChange={(e) =>
                          handleInputChange('cyanuricAcidMin', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-1'>
                        Max
                      </label>
                      <input
                        type='number'
                        value={formData.cyanuricAcidMax}
                        onChange={(e) =>
                          handleInputChange('cyanuricAcidMax', e.target.value)
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                      />
                    </div>
                  </div>
                </div>

                {/* Salt (if salt system) */}
                {formData.saltSystemModel && (
                  <div className='border border-gray-200 rounded-lg p-4'>
                    <h4 className='text-md font-medium text-gray-900 mb-3'>
                      Salt Level (ppm)
                    </h4>
                    <div className='grid grid-cols-3 gap-3'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Target
                        </label>
                        <input
                          type='number'
                          value={formData.saltTarget}
                          onChange={(e) =>
                            handleInputChange('saltTarget', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Min
                        </label>
                        <input
                          type='number'
                          value={formData.saltMin}
                          onChange={(e) =>
                            handleInputChange('saltMin', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Max
                        </label>
                        <input
                          type='number'
                          value={formData.saltMax}
                          onChange={(e) =>
                            handleInputChange('saltMax', e.target.value)
                          }
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Pool Notes & Special Instructions
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={12}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Enter any special instructions, maintenance notes, or important information about this pool...'
                />
              </div>
              <div className='text-sm text-gray-500'>
                <p>Use this section for:</p>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  <li>Special chemical requirements or sensitivities</li>
                  <li>Equipment maintenance schedules and history</li>
                  <li>Client preferences or special requests</li>
                  <li>Safety considerations or hazards</li>
                  <li>Seasonal maintenance requirements</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='border-t border-gray-200 px-6 py-4 flex justify-between items-center'>
          <div className='text-sm text-gray-500'>
            Tab {tabs.findIndex((t) => t.id === activeTab) + 1} of {tabs.length}
          </div>
          <div className='flex gap-3'>
            <button
              onClick={onClose}
              className='bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors'>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded text-white transition-colors ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}>
              {saving ? 'Saving...' : 'Save Pool'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
