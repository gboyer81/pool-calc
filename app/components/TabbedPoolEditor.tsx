'use client'

import React, { useState, useEffect } from 'react'
import { Pool } from '@/types/pool-service'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

interface TabbedPoolEditorProps {
  pool: Pool | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPool: Partial<Pool>) => void
  onDelete?: (poolId: string) => void
  saving?: boolean
}

type TabType = 'volume' | 'equipment' | 'targets' | 'notes'

export default function TabbedPoolEditor({
  pool,
  isOpen,
  onClose,
  onSave,
  onDelete,
  saving = false,
}: TabbedPoolEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('volume')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    type: 'residential' as 'residential' | 'commercial',
    shape: 'rectangular' as
      | 'rectangular'
      | 'circular'
      | 'oval'
      | 'kidney'
      | 'freeform',

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
        saltMin: pool.targetLevels?.salt?.min?.toString() || '2700',
        saltMax: pool.targetLevels?.salt?.max?.toString() || '3400',

        notes: pool.notes || '',
      })
    }
  }, [pool])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDelete = async () => {
    if (!pool || !onDelete) return

    setDeleting(true)
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/pools/${pool._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Pool deleted successfully', {
          description: `${pool.name || 'Pool'} has been permanently deleted.`,
        })
        onDelete(pool._id.toString())
        onClose()
      } else {
        // Handle the specific error case where pool has service history
        if (data.error && data.error.includes('service history')) {
          toast.error('Cannot delete pool', {
            description:
              'This pool has service history. Consider deactivating instead.',
            duration: 5000,
          })
        } else {
          toast.error('Failed to delete pool', {
            description: data.error || 'An unexpected error occurred.',
          })
        }
      }
    } catch (error) {
      console.error('Error deleting pool:', error)
      toast.error('Failed to delete pool', {
        description: 'A network error occurred. Please try again.',
      })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSave = () => {
    const updatedPool: Partial<Pool> = {
      name: formData.name.trim(),
      type: formData.type,
      shape: formData.shape,

      volume: {
        gallons: Number(formData.gallons) || 0,
        calculatedAt: pool?.volume?.calculatedAt
          ? new Date(pool.volume.calculatedAt)
          : new Date(),
      },

      dimensions: {
        avgDepth: Number(formData.avgDepth) || 0,
        ...(formData.shape === 'rectangular' && {
          length: Number(formData.length) || 0,
          width: Number(formData.width) || 0,
        }),
        ...(formData.shape === 'circular' && {
          diameter: Number(formData.diameter) || 0,
        }),
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
            targetSalt: Number(formData.saltSystemTarget) || 3000,
          },
        }),
      },

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
    <div className='fixed inset-0 bg-black/10 backdrop-blur-lg flex items-center justify-center z-50'>
      <div className='bg-background rounded-lg w-full max-w-4xl h-full max-h-[90vh] flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b'>
          <h2 className='text-xl font-semibold'>
            {pool ? `Edit ${pool.name}` : 'Add Pool'}
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-muted-foreground text-2xl'
          >
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-input'
                }`}
              >
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
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pool Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  >
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
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='rectangular'>Rectangular</option>
                    <option value='circular'>Circular</option>
                    <option value='oval'>Oval</option>
                    <option value='kidney'>Kidney</option>
                    <option value='freeform'>Freeform</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Volume (Gallons) *
                  </label>
                  <input
                    type='number'
                    value={formData.gallons}
                    onChange={(e) =>
                      handleInputChange('gallons', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>

              {/* Dimension fields based on shape - simplified version */}
              <div className='grid grid-cols-2 gap-6'>
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
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
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
                        className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
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
                        className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
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
                      className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Equipment Tab - simplified version */}
          {activeTab === 'equipment' && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium text-foreground'>
                Pool Equipment
              </h3>

              <div className='grid grid-cols-2 gap-6'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Filter Type
                  </label>
                  <select
                    value={formData.filterType}
                    onChange={(e) =>
                      handleInputChange('filterType', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  >
                    <option value='sand'>Sand</option>
                    <option value='de'>DE</option>
                    <option value='cartridge'>Cartridge</option>
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
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='e.g., Pentair Clean & Clear 150'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-6'>
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
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='e.g., Pentair SuperFlo VS'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pump Horsepower
                  </label>
                  <input
                    type='number'
                    step='0.25'
                    value={formData.pumpHorsepower}
                    onChange={(e) =>
                      handleInputChange('pumpHorsepower', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                    placeholder='1.5'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chemical Targets Tab - simplified version */}
          {activeTab === 'targets' && (
            <div className='space-y-6'>
              <h3 className='text-lg font-medium text-foreground'>
                Chemical Target Levels
              </h3>

              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    pH Target
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={formData.phTarget}
                    onChange={(e) =>
                      handleInputChange('phTarget', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    pH Minimum
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={formData.phMin}
                    onChange={(e) => handleInputChange('phMin', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    pH Maximum
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={formData.phMax}
                    onChange={(e) => handleInputChange('phMax', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Free Chlorine Target
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={formData.freeChlorineTarget}
                    onChange={(e) =>
                      handleInputChange('freeChlorineTarget', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Free Chlorine Min
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={formData.freeChlorineMin}
                    onChange={(e) =>
                      handleInputChange('freeChlorineMin', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Free Chlorine Max
                  </label>
                  <input
                    type='number'
                    step='0.1'
                    value={formData.freeChlorineMax}
                    onChange={(e) =>
                      handleInputChange('freeChlorineMax', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div className='space-y-4'>
              <h3 className='text-lg font-medium text-foreground'>
                Pool Notes
              </h3>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Additional Information
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={10}
                  className='w-full px-3 py-2 border border-input rounded-md focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Add any additional notes about this pool...'
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-between items-center p-6 border-t'>
          {/* Delete button - only show for existing pools */}
          <div>
            {pool && onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleting}
                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2'
              >
                <Trash2 className='w-4 h-4' />
                {deleting ? 'Deleting...' : 'Delete Pool'}
              </button>
            )}
          </div>

          {/* Save/Cancel buttons */}
          <div className='flex space-x-4'>
            <button
              onClick={onClose}
              className='px-6 py-2 text-muted-foreground border border-input rounded-md hover:bg-muted/50'
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
            >
              {saving ? 'Saving...' : 'Save Pool'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60'>
          <div className='bg-background rounded-lg p-6 w-full max-w-md mx-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
                <Trash2 className='w-5 h-5 text-red-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-foreground'>
                  Delete Pool
                </h3>
                <p className='text-sm text-muted-foreground'>
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p className='text-sm text-muted-foreground mb-6'>
              Are you sure you want to permanently delete{' '}
              <strong>{pool?.name || 'this pool'}</strong>? All pool data will
              be lost. If this pool has service history, deletion will be
              blocked.
            </p>

            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='px-4 py-2 text-muted-foreground border border-input rounded-md hover:bg-muted/50'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50'
              >
                {deleting ? 'Deleting...' : 'Delete Pool'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
