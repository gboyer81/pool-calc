'use client'

import React from 'react'
import {
  Target,
  UserCheck,
  UserX,
} from 'lucide-react'
import {
  Client,
  Pool,
  MaintenanceClient,
} from '@/types/pool-service'

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

interface PoolManagementModalProps {
  isOpen: boolean
  client: MaintenanceClient | null
  pools: Pool[]
  poolsLoading: boolean
  technicians: Technician[]
  currentAssignment: Technician | null
  showAssignmentSection: boolean
  selectedTechnician: string
  assignmentLoading: boolean
  onClose: () => void
  onShowAssignmentSection: (show: boolean) => void
  onSelectedTechnicianChange: (technicianId: string) => void
  onAssignTechnician: (technicianId: string, clientId: string) => void
  onRemoveAssignment: (technicianId: string, clientId: string) => void
  onEditPool: (pool: Pool) => void
}

const PoolManagementModal: React.FC<PoolManagementModalProps> = ({
  isOpen,
  client,
  pools,
  poolsLoading,
  technicians,
  currentAssignment,
  showAssignmentSection,
  selectedTechnician,
  assignmentLoading,
  onClose,
  onShowAssignmentSection,
  onSelectedTechnicianChange,
  onAssignTechnician,
  onRemoveAssignment,
  onEditPool,
}) => {
  if (!isOpen || !client) return null

  return (
    <div className='fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50'>
      <div className='bg-background rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-lg font-semibold'>
            Pools & Assignment for {client.name}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-500 hover:text-gray-700'>
            ✕
          </button>
        </div>

        {/* Assignment Section */}
        <div className='bg-muted/50 rounded-lg p-4 mb-6'>
          <div className='flex items-center justify-between mb-4'>
            <h4 className='font-medium flex items-center gap-2'>
              <Target className='h-4 w-4' />
              Technician Assignment
            </h4>
            {!showAssignmentSection && (
              <button
                onClick={() => onShowAssignmentSection(true)}
                className='text-blue-600 hover:text-blue-800 text-sm'>
                {currentAssignment
                  ? 'Change Assignment'
                  : 'Assign Technician'}
              </button>
            )}
          </div>

          {currentAssignment ? (
            <div className='flex items-center justify-between bg-background rounded p-3'>
              <div className='flex items-center gap-3'>
                <UserCheck className='h-5 w-5 text-green-600' />
                <div>
                  <div className='font-medium'>
                    {currentAssignment.name}
                  </div>
                  <div className='text-sm text-muted-foreground'>
                    {currentAssignment.role} •{' '}
                    {currentAssignment.employeeId}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  onRemoveAssignment(
                    currentAssignment._id,
                    client._id.toString()
                  )
                }
                disabled={assignmentLoading}
                className='text-red-600 hover:text-red-800 text-sm px-3 py-1 rounded border border-red-200 hover:bg-red-50 disabled:opacity-50'>
                {assignmentLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          ) : (
            <div className='flex items-center gap-3 bg-background rounded p-3'>
              <UserX className='h-5 w-5 text-gray-400' />
              <div className='text-muted-foreground'>
                No technician assigned to this client
              </div>
            </div>
          )}

          {showAssignmentSection && (
            <div className='mt-4 bg-background rounded p-4'>
              <div className='flex gap-3'>
                <select
                  value={selectedTechnician}
                  onChange={(e) => onSelectedTechnicianChange(e.target.value)}
                  className='flex-1 px-3 py-2 border border-input rounded-lg focus:ring-2 focus:ring-blue-500'
                  disabled={assignmentLoading}>
                  <option value=''>Select a technician...</option>
                  {technicians
                    .filter((tech) => tech.isActive)
                    .map((tech) => (
                      <option key={tech._id} value={tech._id}>
                        {tech.name} ({tech.role}) -{' '}
                        {tech.assignedClients.length} clients
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => {
                    if (selectedTechnician) {
                      onAssignTechnician(
                        selectedTechnician,
                        client._id.toString()
                      )
                    }
                  }}
                  disabled={!selectedTechnician || assignmentLoading}
                  className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'>
                  {assignmentLoading ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    onShowAssignmentSection(false)
                    onSelectedTechnicianChange('')
                  }}
                  disabled={assignmentLoading}
                  className='px-4 py-2 border border-input rounded-lg hover:bg-muted/50 disabled:opacity-50'>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pools Section */}
        <div className='bg-muted/50 rounded-lg p-4'>
          <h4 className='font-medium mb-4'>Pool Information</h4>
          {poolsLoading ? (
            <div className='text-center py-8'>
              <div className='text-muted-foreground'>
                Loading pools...
              </div>
            </div>
          ) : pools.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <div className='text-lg mb-2'>No pools found</div>
              <div className='text-sm'>
                Add pools for this client to get started
              </div>
            </div>
          ) : (
            <div className='space-y-3'>
              {pools.map((pool) => (
                <div
                  key={pool._id.toString()}
                  className='bg-background rounded p-3'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='font-medium'>
                        {pool.name || 'Unnamed Pool'}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {pool.shape} • {Math.round(pool.volume.gallons)}{' '}
                        gallons
                      </div>
                    </div>
                    <button
                      onClick={() => onEditPool(pool)}
                      className='text-blue-600 hover:text-blue-800 text-sm px-3 py-1 rounded border border-blue-200 hover:bg-blue-50'>
                      Edit Pool
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PoolManagementModal