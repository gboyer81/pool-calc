'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { useBreadcrumb } from '@/components/Navigation'
import { showToast } from '@/lib/toast'

interface Technician {
  _id: string
  name: string
  email: string
  phone: string
  employeeId: string
  role: 'technician' | 'supervisor' | 'admin'
  assignedClients: string[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

interface TechnicianFormData {
  name: string
  email: string
  phone: string
  employeeId: string
  password: string
  role: 'technician' | 'supervisor' | 'admin'
  serviceAreas: string[]
}

export default function AdminPanel() {
  const { setBreadcrumbs } = useBreadcrumb()
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(
    null
  )
  const [formData, setFormData] = useState<TechnicianFormData>({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    password: '',
    role: 'technician',
    serviceAreas: [],
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/' },
      { label: 'Admin Panel' }
    ])
    fetchTechnicians()
  }, [setBreadcrumbs])

  const fetchTechnicians = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('technicianToken')

      const response = await fetch('/api/technicians', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTechnicians(data.technicians || [])
          setError(null)
        } else {
          setError(data.error || 'Failed to fetch technicians')
        }
      } else {
        setError('Failed to fetch technicians')
      }
    } catch (err) {
      setError('Network error')
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    field: keyof TechnicianFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      employeeId: '',
      password: '',
      role: 'technician',
      serviceAreas: [],
    })
    setEditingTechnician(null)
    setShowAddForm(false)
  }

  const validateForm = () => {
    const errors = []
    if (!formData.name) errors.push('Name')
    if (!formData.email) errors.push('Email')
    if (!formData.phone) errors.push('Phone')
    if (!formData.employeeId) errors.push('Employee ID')
    if (!formData.password) errors.push('Password')

    if (errors.length > 0) {
      showToast.error('Missing required fields', `Please fill in: ${errors.join(', ')}`)
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setFormLoading(true)

    try {
      const token = localStorage.getItem('technicianToken')
      const url = editingTechnician
        ? `/api/technicians/${editingTechnician._id}`
        : '/api/technicians'
      const method = editingTechnician ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchTechnicians()
          resetForm()
          showToast.success(
            `Technician ${editingTechnician ? 'updated' : 'created'}`,
            `Successfully ${editingTechnician ? 'updated' : 'created'} the technician.`
          )
        } else {
          showToast.error('Operation failed', data.error)
        }
      } else {
        const responseText = await response.text()
        try {
          const errorData = JSON.parse(responseText)
          showToast.error('Save failed', errorData.error || responseText)
        } catch {
          showToast.error('Save failed', responseText)
        }
      }
    } catch (error: any) {
      console.error('Error saving technician:', error)
      showToast.error('Save failed', 'An error occurred while saving the technician.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = (technician: Technician) => {
    setFormData({
      name: technician.name,
      email: technician.email,
      phone: technician.phone,
      employeeId: technician.employeeId,
      password: '', // Don't pre-fill password
      role: technician.role,
      serviceAreas: [], // You'd load this from the technician data
    })
    setEditingTechnician(technician)
    setShowAddForm(true)
  }

  const toggleTechnicianStatus = async (
    technicianId: string,
    isActive: boolean
  ) => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch(`/api/technicians/${technicianId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        await fetchTechnicians()
        showToast.success(
          'Status updated',
          `Technician has been ${!isActive ? 'activated' : 'deactivated'} successfully.`
        )
      } else {
        showToast.error('Update failed', 'Failed to update technician status.')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      showToast.error('Update failed', 'An error occurred while updating technician status.')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:bg-red-900/30 dark:text-red-300'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'technician':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-muted text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64 bg-background'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'supervisor']}>
      <div className='p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>
              Technician Management
            </h1>
            <p className='text-muted-foreground mt-1'>
              {technicians.length} technicians
            </p>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={() => setShowAddForm(true)}
              className='bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors'>
              + Add Technician
            </button>
            <button
              onClick={() => (window.location.href = '/assignments')}
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors'>
              👥 Manage Assignments
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className='bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors'>
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className='bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded mb-6'>
            {error}
          </div>
        )}

        {/* Technicians Table */}
        <div className='bg-card rounded-lg shadow border border-border overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-muted/50 border-b border-border'>
                <tr>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Name
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Email
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Phone
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Employee ID
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Role
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Status
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Clients
                  </th>
                  <th className='text-left py-3 px-4 font-medium text-foreground'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {technicians.map((technician) => (
                  <tr
                    key={technician._id}
                    className='hover:bg-muted/50 transition-colors'>
                    <td className='py-3 px-4 text-foreground'>
                      {technician.name}
                    </td>
                    <td className='py-3 px-4 text-muted-foreground'>
                      {technician.email}
                    </td>
                    <td className='py-3 px-4 text-muted-foreground'>
                      {technician.phone}
                    </td>
                    <td className='py-3 px-4 text-muted-foreground'>
                      {technician.employeeId}
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          technician.role
                        )}`}>
                        {technician.role.charAt(0).toUpperCase() +
                          technician.role.slice(1)}
                      </span>
                    </td>
                    <td className='py-3 px-4'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          technician.isActive
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
                            : 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
                        }`}>
                        {technician.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='py-3 px-4 text-muted-foreground'>
                      {technician.assignedClients.length}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => handleEdit(technician)}
                          className='text-primary hover:text-primary/80 text-sm'>
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            toggleTechnicianStatus(
                              technician._id,
                              technician.isActive
                            )
                          }
                          className={`text-sm ${
                            technician.isActive
                              ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                          }`}>
                          {technician.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
            <div className='bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border'>
              <h2 className='text-xl font-bold mb-4 text-foreground'>
                {editingTechnician ? 'Edit Technician' : 'Add New Technician'}
              </h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-foreground mb-1'>
                    Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                    placeholder='Full Name'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-1'>
                    Email *
                  </label>
                  <input
                    type='email'
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                    placeholder='email@example.com'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-1'>
                    Phone *
                  </label>
                  <input
                    type='tel'
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                    placeholder='555-123-4567'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-1'>
                    Employee ID *
                  </label>
                  <input
                    type='text'
                    value={formData.employeeId}
                    onChange={(e) =>
                      handleInputChange('employeeId', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                    placeholder='TECH001'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-1'>
                    Password *
                  </label>
                  <input
                    type='password'
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
                    placeholder='Enter password'
                    required
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-foreground mb-1'>
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      handleInputChange('role', e.target.value as any)
                    }
                    className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring'>
                    <option value='technician'>Technician</option>
                    <option value='supervisor'>Supervisor</option>
                    <option value='admin'>Admin</option>
                  </select>
                </div>
              </div>

              <div className='mt-6 flex justify-end gap-3'>
                <button
                  onClick={resetForm}
                  className='bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-secondary/80 transition-colors'>
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={formLoading}
                  className='bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors'>
                  {formLoading
                    ? 'Saving...'
                    : editingTechnician
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
