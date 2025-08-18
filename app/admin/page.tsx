'use client'

import React, { useState, useEffect } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'

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
    fetchTechnicians()
  }, [])

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

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.employeeId) {
      alert('Please fill in all required fields')
      return
    }

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
          alert(
            `Technician ${
              editingTechnician ? 'updated' : 'created'
            } successfully!`
          )
        } else {
          alert('Error: ' + data.error)
        }
      } else {
        alert('Failed to save technician')
      }
    } catch (error) {
      console.error('Error saving technician:', error)
      alert('Error saving technician')
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
      } else {
        alert('Failed to update technician status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating technician status')
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'supervisor':
        return 'bg-blue-100 text-blue-800'
      case 'technician':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
      <div className='flex justify-center items-center h-64'>Loading...</div>
    )
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'supervisor']}>
      <div className='max-w-screen-2xl mx-auto p-6'>
        {/* Header */}
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              Technician Management
            </h1>
            <p className='text-gray-600 mt-1'>
              {technicians.length} technicians
            </p>
          </div>
          <div className='flex gap-3'>
            <button
              onClick={() => setShowAddForm(true)}
              className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors'>
              + Add Technician
            </button>
            <button
              onClick={() => (window.location.href = '/assignments')}
              className='bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors'>
              👥 Manage Assignments
            </button>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className='bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors'>
              ← Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div className='bg-red-100 text-red-800 p-4 rounded-lg mb-6'>
            <strong>Error:</strong> {error}
            <button
              onClick={fetchTechnicians}
              className='ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700'>
              Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <span className='text-2xl'>👥</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Total Technicians</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {technicians.length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <span className='text-2xl'>✅</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Active</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {technicians.filter((t) => t.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 rounded-lg'>
                <span className='text-2xl'>🔧</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Field Techs</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {technicians.filter((t) => t.role === 'technician').length}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <span className='text-2xl'>👨‍💼</span>
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Supervisors</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {technicians.filter((t) => t.role === 'supervisor').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technicians Table */}
        <div className='bg-white rounded-lg shadow-md overflow-hidden'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-xl font-semibold'>All Technicians</h2>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Technician
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Role
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Clients
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Last Login
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {technicians.map((technician) => (
                  <tr key={technician._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-gray-900'>
                          {technician.name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {technician.email}
                        </div>
                        <div className='text-xs text-gray-400'>
                          ID: {technician.employeeId}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          technician.role
                        )}`}>
                        {technician.role.toUpperCase()}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {technician.assignedClients.length} assigned
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {technician.lastLogin
                        ? formatDate(technician.lastLogin)
                        : 'Never'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          technician.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                        {technician.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                      <button
                        onClick={() => handleEdit(technician)}
                        className='text-blue-600 hover:text-blue-800'>
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          toggleTechnicianStatus(
                            technician._id,
                            technician.isActive
                          )
                        }
                        className={
                          technician.isActive
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        }>
                        {technician.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Technician Modal */}
        {showAddForm && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto'>
              <div className='p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-bold'>
                    {editingTechnician
                      ? 'Edit Technician'
                      : 'Add New Technician'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className='text-gray-500 hover:text-gray-700 text-xl'>
                    ✕
                  </button>
                </div>

                <div className='space-y-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Full Name *
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange('name', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='John Doe'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Email *
                    </label>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='john@poolservice.com'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Phone
                    </label>
                    <input
                      type='tel'
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange('phone', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='(555) 123-4567'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Employee ID *
                    </label>
                    <input
                      type='text'
                      value={formData.employeeId}
                      onChange={(e) =>
                        handleInputChange('employeeId', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='TECH001'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Password{' '}
                      {editingTechnician
                        ? '(leave blank to keep current)'
                        : '*'}
                    </label>
                    <input
                      type='password'
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md'
                      placeholder='••••••••'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        handleInputChange('role', e.target.value as any)
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md'>
                      <option value='technician'>Technician</option>
                      <option value='supervisor'>Supervisor</option>
                      <option value='admin'>Admin</option>
                    </select>
                  </div>
                </div>

                <div className='mt-6 flex justify-end gap-3'>
                  <button
                    onClick={resetForm}
                    className='bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400'>
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={formLoading}
                    className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400'>
                    {formLoading
                      ? 'Saving...'
                      : editingTechnician
                      ? 'Update'
                      : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
