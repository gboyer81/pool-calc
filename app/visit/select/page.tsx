// app/visit/select/page.tsx - Visit Type Selection Page
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import {
  Client,
  MaintenanceClient,
  ServiceClient,
  RetailClient,
} from '@/types/pool-service'

interface VisitOption {
  type: string
  title: string
  description: string
  icon: string
  color: string
  clientTypes: string[]
  priority?: 'low' | 'normal' | 'high' | 'emergency'
  estimatedDuration?: number
}

const visitOptions: VisitOption[] = [
  {
    type: 'maintenance-routine',
    title: 'Routine Maintenance',
    description: 'Regular pool cleaning, chemical testing, and equipment check',
    icon: '💧',
    color: 'bg-blue-500',
    clientTypes: ['maintenance'],
    estimatedDuration: 45,
  },
  {
    type: 'maintenance-chemical',
    title: 'Chemical Balance Only',
    description: 'Water testing and chemical adjustment without cleaning',
    icon: '🧪',
    color: 'bg-green-500',
    clientTypes: ['maintenance'],
    estimatedDuration: 15,
  },
  {
    type: 'service-emergency',
    title: 'Emergency Service',
    description: 'Urgent equipment failure or safety issue',
    icon: '🚨',
    color: 'bg-red-500',
    clientTypes: ['service', 'maintenance'],
    priority: 'emergency',
    estimatedDuration: 120,
  },
  {
    type: 'service-repair',
    title: 'Equipment Repair',
    description: 'Scheduled repair of pumps, heaters, or other equipment',
    icon: '🔧',
    color: 'bg-orange-500',
    clientTypes: ['service', 'maintenance'],
    estimatedDuration: 90,
  },
  {
    type: 'service-installation',
    title: 'Equipment Installation',
    description: 'Installing new equipment or system upgrades',
    icon: '⚙️',
    color: 'bg-purple-500',
    clientTypes: ['service'],
    estimatedDuration: 180,
  },
  {
    type: 'retail-delivery',
    title: 'Product Delivery',
    description: 'Delivering chemicals, equipment, or supplies to customer',
    icon: '📦',
    color: 'bg-yellow-500',
    clientTypes: ['retail', 'service', 'maintenance'],
    estimatedDuration: 20,
  },
  {
    type: 'retail-pickup',
    title: 'Product Pickup',
    description: 'Collecting returns, warranty items, or trade-ins',
    icon: '📤',
    color: 'bg-indigo-500',
    clientTypes: ['retail', 'service'],
    estimatedDuration: 15,
  },
]

export default function VisitSelectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('clientId')

  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVisit, setSelectedVisit] = useState<VisitOption | null>(null)

  useEffect(() => {
    if (clientId) {
      loadClient()
    } else {
      setLoading(false)
    }
  }, [clientId])

  const loadClient = async () => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else {
        console.error('Failed to load client')
      }
    } catch (error) {
      console.error('Error loading client:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAvailableVisits = (): VisitOption[] => {
    if (!client) return visitOptions

    return visitOptions.filter((option) =>
      option.clientTypes.includes(client.clientType)
    )
  }

  const startVisit = (visitOption: VisitOption) => {
    const queryParams = new URLSearchParams()
    queryParams.set('clientId', clientId || '')
    queryParams.set('type', visitOption.type)

    if (visitOption.priority) {
      queryParams.set('priority', visitOption.priority)
    }

    router.push(`/visit/log?${queryParams.toString()}`)
  }

  const getClientTypeLabel = (clientType: string): string => {
    const labels = {
      maintenance: 'Maintenance Client',
      service: 'Service Client',
      retail: 'Retail Client',
    }
    return labels[clientType as keyof typeof labels] || clientType
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='text-lg'>Loading client information...</div>
      </div>
    )
  }

  if (clientId && !client) {
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
        <div className='mb-8'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Select Visit Type
              </h1>
              {client ? (
                <div className='mt-2'>
                  <p className='text-lg text-gray-600'>{client.name}</p>
                  <p className='text-sm text-gray-500'>
                    {client.address.street}, {client.address.city} •{' '}
                    {getClientTypeLabel(client.clientType)}
                  </p>
                </div>
              ) : (
                <p className='text-gray-600 mt-2'>
                  Choose the type of visit you want to log
                </p>
              )}
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600'>
              Cancel
            </button>
          </div>
        </div>

        {/* Visit Options Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {getAvailableVisits().map((option) => (
            <div
              key={option.type}
              className={`relative bg-white rounded-xl shadow-lg border-2 border-transparent hover:border-blue-300 transition-all duration-200 cursor-pointer transform hover:scale-105 ${
                selectedVisit?.type === option.type
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : ''
              }`}
              onClick={() => setSelectedVisit(option)}>
              <div className='p-6'>
                {/* Visit Type Header */}
                <div className='flex items-center mb-4'>
                  <div
                    className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-white text-2xl mr-4`}>
                    {option.icon}
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {option.title}
                    </h3>
                    {option.priority && option.priority !== 'normal' && (
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                          option.priority === 'emergency'
                            ? 'bg-red-100 text-red-800'
                            : option.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                        {option.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className='text-gray-600 mb-4'>{option.description}</p>

                {/* Duration & Details */}
                <div className='flex items-center justify-between text-sm text-gray-500 mb-4'>
                  {option.estimatedDuration && (
                    <span>⏱️ ~{option.estimatedDuration} min</span>
                  )}
                  <span>
                    {option.clientTypes
                      .map(
                        (type) => type.charAt(0).toUpperCase() + type.slice(1)
                      )
                      .join(', ')}
                  </span>
                </div>

                {/* Start Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startVisit(option)
                  }}
                  className={`w-full ${option.color} hover:opacity-90 text-white py-3 px-4 rounded-lg font-medium transition-opacity`}>
                  Start {option.title}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Quick Actions */}
        <div className='mt-8 bg-red-50 border border-red-200 rounded-lg p-6'>
          <div className='flex items-center mb-4'>
            <div className='w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center text-white text-xl mr-3'>
              🚨
            </div>
            <div>
              <h3 className='text-lg font-semibold text-red-900'>
                Emergency Service
              </h3>
              <p className='text-sm text-red-700'>
                For urgent issues requiring immediate attention
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <button
              onClick={() =>
                startVisit(
                  visitOptions.find((v) => v.type === 'service-emergency')!
                )
              }
              className='bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors'>
              🚨 Log Emergency Visit
            </button>

            <button
              onClick={() => {
                // You can add functionality to call dispatch or supervisor
                alert('Emergency dispatch feature coming soon')
              }}
              className='bg-red-100 hover:bg-red-200 text-red-800 py-3 px-4 rounded-lg font-medium transition-colors border border-red-300'>
              📞 Call Dispatch
            </button>
          </div>
        </div>

        {/* Quick Start for Maintenance Clients */}
        {client && client.clientType === 'maintenance' && (
          <div className='mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6'>
            <div className='flex items-center justify-between mb-4'>
              <div>
                <h3 className='text-lg font-semibold text-blue-900'>
                  Quick Start
                </h3>
                <p className='text-sm text-blue-700'>
                  Start your regular maintenance visit
                </p>
              </div>

              <button
                onClick={() =>
                  startVisit(
                    visitOptions.find((v) => v.type === 'maintenance-routine')!
                  )
                }
                className='bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors'>
                💧 Start Routine Maintenance
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className='mt-8 bg-gray-50 rounded-lg p-6'>
          <h4 className='font-semibold text-gray-900 mb-2'>Need Help?</h4>
          <div className='text-sm text-gray-600 space-y-2'>
            <p>
              • <strong>Routine Maintenance:</strong> Regular scheduled pool
              cleaning and maintenance
            </p>
            <p>
              • <strong>Chemical Only:</strong> Quick visits focused on water
              testing and chemical balancing
            </p>
            <p>
              • <strong>Equipment Repair:</strong> Fixing broken or
              malfunctioning pool equipment
            </p>
            <p>
              • <strong>Emergency Service:</strong> Immediate response to urgent
              issues
            </p>
            <p>
              • <strong>Delivery/Pickup:</strong> Chemical or equipment delivery
              and pickup services
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
