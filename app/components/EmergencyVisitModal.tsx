// components/EmergencyVisitModal.tsx - Quick emergency visit logging
'use client'

import React, { useState, useEffect } from 'react'
import { Client, Pool } from '@/types/pool-service'
import { showToast } from '@/lib/toast'

interface EmergencyVisitModalProps {
  isOpen: boolean
  onClose: () => void
  preselectedClientId?: string
  onSubmit?: (visitId: string) => void
}

interface EmergencyVisit {
  clientId: string
  poolId?: string
  issueDescription: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  issueType:
    | 'equipment-failure'
    | 'water-quality'
    | 'safety-hazard'
    | 'leak'
    | 'electrical'
    | 'other'
  actionTaken: string
  partsUsed: Array<{
    partName: string
    quantity: number
    notes?: string
  }>
  followUpRequired: boolean
  followUpDate?: string
  laborHours: number
  clientNotified: boolean
  photos: string[]
  notes: string
}

const emergencyTypes = [
  { value: 'equipment-failure', label: 'Equipment Failure', icon: '⚙️' },
  { value: 'water-quality', label: 'Water Quality Issue', icon: '🧪' },
  { value: 'safety-hazard', label: 'Safety Hazard', icon: '⚠️' },
  { value: 'leak', label: 'Pool/Spa Leak', icon: '💧' },
  { value: 'electrical', label: 'Electrical Issue', icon: '⚡' },
  { value: 'other', label: 'Other Emergency', icon: '🚨' },
]

const severityLevels = [
  {
    value: 'low',
    label: 'Low',
    color: 'text-yellow-600 bg-yellow-100',
    description: 'Minor issue, can wait',
  },
  {
    value: 'medium',
    label: 'Medium',
    color: 'text-orange-600 bg-orange-100',
    description: 'Needs attention today',
  },
  {
    value: 'high',
    label: 'High',
    color: 'text-red-600 bg-red-100',
    description: 'Urgent, safety concern',
  },
  {
    value: 'critical',
    label: 'Critical',
    color: 'text-red-800 bg-red-200',
    description: 'Immediate danger',
  },
]

export default function EmergencyVisitModal({
  isOpen,
  onClose,
  preselectedClientId,
  onSubmit,
}: EmergencyVisitModalProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [visit, setVisit] = useState<EmergencyVisit>({
    clientId: preselectedClientId || '',
    poolId: '',
    issueDescription: '',
    severity: 'medium',
    issueType: 'equipment-failure',
    actionTaken: '',
    partsUsed: [],
    followUpRequired: false,
    followUpDate: '',
    laborHours: 0,
    clientNotified: false,
    photos: [],
    notes: '',
  })

  const [currentStep, setCurrentStep] = useState(1)
  const [startTime] = useState(new Date())

  useEffect(() => {
    if (isOpen) {
      loadClients()
      if (preselectedClientId) {
        loadPools(preselectedClientId)
        setVisit((prev) => ({ ...prev, clientId: preselectedClientId }))
      }
    }
  }, [isOpen, preselectedClientId])

  useEffect(() => {
    if (visit.clientId) {
      loadPools(visit.clientId)
    }
  }, [visit.clientId])

  const loadClients = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPools = async (clientId: string) => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/pools?clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setPools(data.pools || [])

        // Auto-select if only one pool
        if (data.pools?.length === 1) {
          setVisit((prev) => ({
            ...prev,
            poolId: data.pools[0]._id.toString(),
          }))
        }
      }
    } catch (error) {
      console.error('Error loading pools:', error)
    }
  }

  const addPart = () => {
    setVisit((prev) => ({
      ...prev,
      partsUsed: [...prev.partsUsed, { partName: '', quantity: 1, notes: '' }],
    }))
  }

  const updatePart = (index: number, field: string, value: string | number) => {
    setVisit((prev) => ({
      ...prev,
      partsUsed: prev.partsUsed.map((part, i) =>
        i === index ? { ...part, [field]: value } : part
      ),
    }))
  }

  const removePart = (index: number) => {
    setVisit((prev) => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      const token = localStorage.getItem('technicianToken')
      const endTime = new Date()
      const duration = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000 / 60
      )

      const submitData = {
        clientId: visit.clientId,
        poolId: visit.poolId || undefined,
        serviceType: 'service-emergency',
        priority:
          visit.severity === 'critical' || visit.severity === 'high'
            ? 'emergency'
            : 'high',
        scheduledDate: startTime.toISOString(),
        actualDate: endTime.toISOString(),
        duration,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        serviceDetails: {
          issueDescription: visit.issueDescription,
          diagnosisNotes: visit.notes,
          partsUsed: visit.partsUsed.filter((part) => part.partName.trim()),
          laborHours: visit.laborHours,
          followUpRequired: visit.followUpRequired,
          followUpDate: visit.followUpDate
            ? new Date(visit.followUpDate)
            : undefined,
          equipmentTested: true,
          customerSignoff: visit.clientNotified,
        },
        notes: `Emergency Service - ${
          emergencyTypes.find((t) => t.value === visit.issueType)?.label
        }
        
Severity: ${visit.severity.toUpperCase()}
Action Taken: ${visit.actionTaken}
Client Notified: ${visit.clientNotified ? 'Yes' : 'No'}

${visit.notes}`,
        photos: visit.photos.map((url) => ({
          url,
          type: 'issue',
          caption: 'Emergency service documentation',
          uploadedAt: new Date(),
        })),
      }

      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          showToast.success('Emergency visit logged', 'The emergency visit has been logged successfully.')
          onSubmit?.(data.visitId)
          onClose()
          resetForm()
        } else {
          showToast.error('Logging failed', data.error)
        }
      } else {
        showToast.error('Logging failed', 'Failed to log emergency visit.')
      }
    } catch (error) {
      console.error('Error submitting emergency visit:', error)
      showToast.error('Logging failed', 'An error occurred while logging the emergency visit.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setVisit({
      clientId: preselectedClientId || '',
      poolId: '',
      issueDescription: '',
      severity: 'medium',
      issueType: 'equipment-failure',
      actionTaken: '',
      partsUsed: [],
      followUpRequired: false,
      followUpDate: '',
      laborHours: 0,
      clientNotified: false,
      photos: [],
      notes: '',
    })
    setCurrentStep(1)
  }

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  if (!isOpen) return null

  const selectedClient = clients.find(
    (c) => c._id.toString() === visit.clientId
  )
  const selectedPool = pools.find((p) => p._id.toString() === visit.poolId)

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='sticky top-0 bg-red-600 text-white p-6 rounded-t-lg'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center'>
              <span className='text-2xl mr-3'>🚨</span>
              <div>
                <h2 className='text-2xl font-bold'>Emergency Service Log</h2>
                <p className='text-red-100'>
                  Quick logging for urgent service calls
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='text-right text-sm'>
                <div className='text-red-100'>
                  Started: {startTime.toLocaleTimeString()}
                </div>
                <div className='font-semibold'>Step {currentStep} of 3</div>
              </div>
              <button
                onClick={onClose}
                className='text-white hover:text-red-200 text-2xl'
                disabled={submitting}>
                ×
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className='mt-4 w-full bg-red-700 rounded-full h-2'>
            <div
              className='bg-white h-2 rounded-full transition-all duration-300'
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className='p-6'>
          {/* Step 1: Client & Issue */}
          {currentStep === 1 && (
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-gray-900'>
                Emergency Details
              </h3>

              {/* Client Selection */}
              {!preselectedClientId && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Client *
                  </label>
                  <select
                    value={visit.clientId}
                    onChange={(e) =>
                      setVisit((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                        poolId: '',
                      }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'
                    required>
                    <option value=''>Select client...</option>
                    {clients.map((client) => (
                      <option
                        key={client._id.toString()}
                        value={client._id.toString()}>
                        {client.name} - {client.address.street}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Pool Selection */}
              {selectedClient && pools.length > 1 && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Pool/Spa
                  </label>
                  <select
                    value={visit.poolId}
                    onChange={(e) =>
                      setVisit((prev) => ({ ...prev, poolId: e.target.value }))
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md'>
                    <option value=''>Select pool...</option>
                    {pools.map((pool) => (
                      <option
                        key={pool._id.toString()}
                        value={pool._id.toString()}>
                        {pool.name} ({pool.volume.gallons.toLocaleString()} gal)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Issue Type */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Issue Type *
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  {emergencyTypes.map((type) => (
                    <button
                      key={type.value}
                      type='button'
                      onClick={() =>
                        setVisit((prev) => ({
                          ...prev,
                          issueType: type.value as any,
                        }))
                      }
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        visit.issueType === type.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className='flex items-center'>
                        <span className='text-lg mr-2'>{type.icon}</span>
                        <span className='font-medium'>{type.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Severity Level *
                </label>
                <div className='grid grid-cols-2 gap-3'>
                  {severityLevels.map((level) => (
                    <button
                      key={level.value}
                      type='button'
                      onClick={() =>
                        setVisit((prev) => ({
                          ...prev,
                          severity: level.value as any,
                        }))
                      }
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        visit.severity === level.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div
                        className={`inline-block px-2 py-1 rounded text-sm font-medium mb-1 ${level.color}`}>
                        {level.label}
                      </div>
                      <div className='text-xs text-gray-600'>
                        {level.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Issue Description */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Issue Description *
                </label>
                <textarea
                  value={visit.issueDescription}
                  onChange={(e) =>
                    setVisit((prev) => ({
                      ...prev,
                      issueDescription: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md h-32'
                  placeholder='Describe the emergency situation, symptoms observed, and immediate concerns...'
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Action & Parts */}
          {currentStep === 2 && (
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-gray-900'>
                Service Action
              </h3>

              {/* Action Taken */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Action Taken *
                </label>
                <textarea
                  value={visit.actionTaken}
                  onChange={(e) =>
                    setVisit((prev) => ({
                      ...prev,
                      actionTaken: e.target.value,
                    }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md h-32'
                  placeholder='Describe the steps taken to address the emergency, repairs made, temporary solutions implemented...'
                  required
                />
              </div>

              {/* Labor Hours */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Labor Hours
                </label>
                <input
                  type='number'
                  step='0.25'
                  value={visit.laborHours}
                  onChange={(e) =>
                    setVisit((prev) => ({
                      ...prev,
                      laborHours: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className='w-32 px-3 py-2 border border-gray-300 rounded-md'
                  placeholder='2.5'
                />
              </div>

              {/* Parts Used */}
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <label className='block text-sm font-medium text-gray-700'>
                    Parts Used
                  </label>
                  <button
                    type='button'
                    onClick={addPart}
                    className='bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700'>
                    Add Part
                  </button>
                </div>

                {visit.partsUsed.map((part, index) => (
                  <div key={index} className='grid grid-cols-12 gap-2 mb-2'>
                    <input
                      type='text'
                      value={part.partName}
                      onChange={(e) =>
                        updatePart(index, 'partName', e.target.value)
                      }
                      className='col-span-6 px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='Part name/description'
                    />
                    <input
                      type='number'
                      value={part.quantity}
                      onChange={(e) =>
                        updatePart(
                          index,
                          'quantity',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className='col-span-2 px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='Qty'
                      min='1'
                    />
                    <input
                      type='text'
                      value={part.notes || ''}
                      onChange={(e) =>
                        updatePart(index, 'notes', e.target.value)
                      }
                      className='col-span-3 px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='Notes'
                    />
                    <button
                      type='button'
                      onClick={() => removePart(index)}
                      className='col-span-1 bg-red-500 text-white px-2 py-2 rounded hover:bg-red-600'>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Follow-up Required */}
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='followUp'
                  checked={visit.followUpRequired}
                  onChange={(e) =>
                    setVisit((prev) => ({
                      ...prev,
                      followUpRequired: e.target.checked,
                    }))
                  }
                  className='mr-2'
                />
                <label
                  htmlFor='followUp'
                  className='text-sm font-medium text-gray-700'>
                  Follow-up service required
                </label>
              </div>

              {visit.followUpRequired && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Follow-up Date
                  </label>
                  <input
                    type='date'
                    value={visit.followUpDate}
                    onChange={(e) =>
                      setVisit((prev) => ({
                        ...prev,
                        followUpDate: e.target.value,
                      }))
                    }
                    className='px-3 py-2 border border-gray-300 rounded-md'
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Final Details */}
          {currentStep === 3 && (
            <div className='space-y-6'>
              <h3 className='text-xl font-semibold text-gray-900'>
                Final Details
              </h3>

              {/* Client Notification */}
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='clientNotified'
                  checked={visit.clientNotified}
                  onChange={(e) =>
                    setVisit((prev) => ({
                      ...prev,
                      clientNotified: e.target.checked,
                    }))
                  }
                  className='mr-2'
                />
                <label
                  htmlFor='clientNotified'
                  className='text-sm font-medium text-gray-700'>
                  Client has been notified of the emergency service
                </label>
              </div>

              {/* Additional Notes */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Additional Notes
                </label>
                <textarea
                  value={visit.notes}
                  onChange={(e) =>
                    setVisit((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-md h-32'
                  placeholder='Any additional observations, recommendations, or special instructions...'
                />
              </div>

              {/* Summary */}
              <div className='bg-gray-50 rounded-lg p-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>
                  Service Summary
                </h4>
                <div className='text-sm text-gray-600 space-y-1'>
                  <p>
                    <strong>Client:</strong> {selectedClient?.name}
                  </p>
                  {selectedPool && (
                    <p>
                      <strong>Pool:</strong> {selectedPool.name}
                    </p>
                  )}
                  <p>
                    <strong>Issue:</strong>{' '}
                    {
                      emergencyTypes.find((t) => t.value === visit.issueType)
                        ?.label
                    }
                  </p>
                  <p>
                    <strong>Severity:</strong>{' '}
                    {
                      severityLevels.find((s) => s.value === visit.severity)
                        ?.label
                    }
                  </p>
                  <p>
                    <strong>Labor Hours:</strong> {visit.laborHours}
                  </p>
                  <p>
                    <strong>Parts Used:</strong> {visit.partsUsed.length}
                  </p>
                  <p>
                    <strong>Follow-up Required:</strong>{' '}
                    {visit.followUpRequired ? 'Yes' : 'No'}
                  </p>
                  <p>
                    <strong>Client Notified:</strong>{' '}
                    {visit.clientNotified ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className='flex justify-between pt-6 border-t border-gray-200 mt-6'>
            <div>
              {currentStep > 1 && (
                <button
                  type='button'
                  onClick={prevStep}
                  className='bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400'
                  disabled={submitting}>
                  Previous
                </button>
              )}
            </div>

            <div className='flex gap-4'>
              <button
                type='button'
                onClick={onClose}
                className='bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600'
                disabled={submitting}>
                Cancel
              </button>

              {currentStep < 3 ? (
                <button
                  type='button'
                  onClick={nextStep}
                  className='bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700'
                  disabled={
                    (currentStep === 1 &&
                      (!visit.clientId ||
                        !visit.issueDescription ||
                        !visit.issueType)) ||
                    (currentStep === 2 && !visit.actionTaken)
                  }>
                  Next
                </button>
              ) : (
                <button
                  type='button'
                  onClick={handleSubmit}
                  className='bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50'
                  disabled={
                    submitting ||
                    !visit.clientId ||
                    !visit.issueDescription ||
                    !visit.actionTaken
                  }>
                  {submitting ? 'Logging...' : 'Log Emergency Visit'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
