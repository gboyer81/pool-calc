'use client'

import React, { useState, useEffect } from 'react'
import { Pool } from '@/types/pool-service'

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
    filterType: 'de' as 'de' | 'cartridge' | 'sand',
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
    totalChlorineTarget: '',
    totalChlorineMin: '',
    totalChlorineMax: '',
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

        filterType: pool.equipment?.filter?.type || 'sand',
        filterModel: pool.equipment?.filter?.model || '',
        pumpModel: pool.equipment?.pump?.model || '',
        pumpHorsepower: pool.equipment?.pump?.horsepower?.toString() || '',
        heaterType: pool.equipment?.heater?.type || '',
        heaterModel: pool.equipment?.heater?.model || '',
        saltSystemModel: pool.equipment?.saltSystem?.model || '',
        saltSystemTarget:
          pool.equipment?.saltSystem?.targetSalt?.toString() || '',

        // Use the enhanced targetLevels structure directly
        phTarget: pool.targetLevels?.ph?.target?.toString() || '7.4',
        phMin: pool.targetLevels?.ph?.min?.toString() || '7.2',
        phMax: pool.targetLevels?.ph?.max?.toString() || '7.6',

        freeChlorineTarget:
          pool.targetLevels?.freeChlorine?.target?.toString() || '2.0',
        freeChlorineMin:
          pool.targetLevels?.freeChlorine?.min?.toString() || '1.0',
        freeChlorineMax:
          pool.targetLevels?.freeChlorine?.max?.toString() || '3.0',

        totalChlorineTarget:
          pool.targetLevels?.totalChlorine?.target?.toString() || '3.0',
        totalChlorineMin:
          pool.targetLevels?.totalChlorine?.min?.toString() || '2.0',
        totalChlorineMax:
          pool.targetLevels?.totalChlorine?.max?.toString() || '5.0',

        totalAlkalinityTarget:
          pool.targetLevels?.totalAlkalinity?.target?.toString() || '100',
        totalAlkalinityMin:
          pool.targetLevels?.totalAlkalinity?.min?.toString() || '80',
        totalAlkalinityMax:
          pool.targetLevels?.totalAlkalinity?.max?.toString() || '120',

        calciumHardnessTarget:
          pool.targetLevels?.calciumHardness?.target?.toString() || '250',
        calciumHardnessMin:
          pool.targetLevels?.calciumHardness?.min?.toString() || '200',
        calciumHardnessMax:
          pool.targetLevels?.calciumHardness?.max?.toString() || '400',

        cyanuricAcidTarget:
          pool.targetLevels?.cyanuricAcid?.target?.toString() || '50',
        cyanuricAcidMin:
          pool.targetLevels?.cyanuricAcid?.min?.toString() || '30',
        cyanuricAcidMax:
          pool.targetLevels?.cyanuricAcid?.max?.toString() || '80',

        saltTarget: pool.targetLevels?.salt?.target?.toString() || '',
        saltMin: pool.targetLevels?.salt?.min?.toString() || '',
        saltMax: pool.targetLevels?.salt?.max?.toString() || '',

        notes: pool?.notes || '',
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
      shape: formData.shape as
        | 'rectangular'
        | 'circular'
        | 'oval'
        | 'kidney'
        | 'freeform',

      volume: {
        gallons: Number(formData.gallons) || 0,
        calculatedAt: new Date(),
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

      // Use the enhanced targetLevels structure
      targetLevels: {
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
        totalChlorine: {
          target: Number(formData.totalChlorineTarget) || 3.0,
          min: Number(formData.totalChlorineMin) || 2.0,
          max: Number(formData.totalChlorineMax) || 5.0,
        },
        totalAlkalinity: {
          target: Number(formData.totalAlkalinityTarget) || 100,
          min: Number(formData.totalAlkalinityMin) || 80,
          max: Number(formData.totalAlkalinityMax) || 120,
        },
        calciumHardness: {
          target: Number(formData.calciumHardnessTarget) || 250,
          min: Number(formData.calciumHardnessMin) || 200,
          max: Number(formData.calciumHardnessMax) || 400,
        },
        cyanuricAcid: {
          target: Number(formData.cyanuricAcidTarget) || 50,
          min: Number(formData.cyanuricAcidMin) || 30,
          max: Number(formData.cyanuricAcidMax) || 80,
        },
        ...(formData.saltTarget && {
          salt: {
            target: Number(formData.saltTarget),
            min: Number(formData.saltMin) || 2700,
            max: Number(formData.saltMax) || 3400,
          },
        }),
      },

      readings: {
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      notes: formData.notes.trim(),
    }

    onSave(updatedPool)
  }

  if (!isOpen) return null

  const tabs = [
    { id: 'volume', label: 'Volume & Shape', icon: '📏' },
    { id: 'equipment', label: 'Equipment', icon: '⚙️' },
    { id: 'targets', label: 'Chemical Targets', icon: '🧪' },
    { id: 'notes', label: 'Notes', icon: '📝' },
  ]

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <h2 className='text-xl font-semibold'>
            {pool ? `Edit ${pool.name}` : 'Add Pool'}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 text-2xl'>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className='border-b'>
          <nav className='flex'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
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

              {/* Shape-specific dimensions */}
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

                  {(formData.shape === 'rectangular' ||
                    formData.shape === 'oval') && (
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
              {/* Filter */}
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
                      <option value='sand'>Sand</option>
                      <option value='cartridge'>Cartridge</option>
                      <option value='de'>DE (Diatomaceous Earth)</option>
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

              {/* Pump */}
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

              {/* Heater */}
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
                      <option value='gas'>Gas</option>
                      <option value='electric'>Electric</option>
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

              {/* Salt System */}
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
              {/* pH */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>pH Levels</h3>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Target pH
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
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Minimum pH
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
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Maximum pH
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
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Free Chlorine (ppm)
                </h3>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Target
                    </label>
                    <input
                      type='number'
                      step='0.1'
                      value={formData.freeChlorineTarget}
                      onChange={(e) =>
                        handleInputChange('freeChlorineTarget', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Minimum
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
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Maximum
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
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Total Alkalinity (ppm)
                </h3>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Minimum
                    </label>
                    <input
                      type='number'
                      value={formData.totalAlkalinityMin}
                      onChange={(e) =>
                        handleInputChange('totalAlkalinityMin', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Maximum
                    </label>
                    <input
                      type='number'
                      value={formData.totalAlkalinityMax}
                      onChange={(e) =>
                        handleInputChange('totalAlkalinityMax', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              {/* Calcium Hardness */}
              <div className='space-y-4'>
                <h3 className='text-lg font-medium text-gray-900'>
                  Calcium Hardness (ppm)
                </h3>
                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Minimum
                    </label>
                    <input
                      type='number'
                      value={formData.calciumHardnessMin}
                      onChange={(e) =>
                        handleInputChange('calciumHardnessMin', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Maximum
                    </label>
                    <input
                      type='number'
                      value={formData.calciumHardnessMax}
                      onChange={(e) =>
                        handleInputChange('calciumHardnessMax', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                </div>
              </div>

              {/* Salt Levels (if salt system) */}
              {formData.saltSystemModel && (
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium text-gray-900'>
                    Salt Levels (ppm)
                  </h3>
                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
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
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Minimum
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
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Maximum
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
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-gray-900'>Pool Notes</h3>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Additional Information
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={10}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Add any additional notes about this pool...'
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end space-x-4 p-6 border-t'>
          <button
            onClick={onClose}
            className='px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50'>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'>
            {saving ? 'Saving...' : 'Save Pool'}
          </button>
        </div>
      </div>
    </div>
  )
}
