'use client'

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { ClientUser, UserInput } from '@/types/user'

interface FormData {
  name: string
  email: string
}

export default function UserManagement(): React.ReactElement {
  const [users, setUsers] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [mounted, setMounted] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' })
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null)
  const [message, setMessage] = useState<string>('')
  const [formLoading, setFormLoading] = useState<boolean>(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch all users
  async function fetchUsers(): Promise<void> {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (data.success) {
        // Convert dates and ObjectIds to strings for client-side
        const clientUsers: ClientUser[] = data.users.map((user: any) => ({
          ...user,
          _id: user._id.toString(),
          createdAt: new Date(user.createdAt).toISOString(),
          updatedAt: new Date(user.updatedAt).toISOString(),
        }))
        setUsers(clientUsers)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setMessage('Error: Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Load users on component mount
  useEffect(() => {
    fetchUsers()
  }, [])

  // Handle form input changes
  function handleInputChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle form submission (create or update)
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault()

    setFormLoading(true)

    try {
      const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(
          editingUser
            ? 'User updated successfully!'
            : 'User created successfully!'
        )
        setFormData({ name: '', email: '' })
        setEditingUser(null)
        await fetchUsers() // Refresh the list
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error: Network error occurred')
    } finally {
      setFormLoading(false)
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(''), 5000)
  }

  // Handle delete user
  async function handleDelete(userId: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setMessage('User deleted successfully!')
        await fetchUsers() // Refresh the list
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Error: Network error occurred')
    }

    setTimeout(() => setMessage(''), 5000)
  }

  // Handle edit user
  function handleEdit(user: ClientUser): void {
    setEditingUser(user)
    setFormData({ name: user.name, email: user.email })
  }

  // Cancel editing
  function cancelEdit(): void {
    setEditingUser(null)
    setFormData({ name: '', email: '' })
  }

  // Format date for display (hydration-safe)
  function formatDate(dateString: string): string {
    const date = new Date(dateString)

    // Use a consistent format that won't vary between server/client
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]

    return `${monthNames[month - 1]} ${day}, ${year} ${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className='p-5 text-center text-lg font-sans'>Loading users...</div>
    )
  }

  return (
    <div className='p-5 max-w-4xl mx-auto font-sans'>
      <h1 className='text-gray-800 mb-8 text-2xl font-bold'>
        👤 User Management
      </h1>

      {/* Message */}
      {message && (
        <div
          className={`px-4 py-3 mb-5 border rounded-md font-bold ${
            message.includes('Error')
              ? 'bg-red-100 border-red-300 text-red-800'
              : 'bg-green-100 border-green-300 text-green-800'
          }`}>
          {message}
        </div>
      )}

      {/* Add/Edit User Form */}
      <div className='bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200'>
        <h2 className='m-0 mb-5 text-gray-700 text-xl font-semibold'>
          {editingUser ? 'Edit User' : 'Add New User'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className='mb-5'>
            <label className='block mb-2 font-bold text-gray-700'>
              Name: <span className='text-red-600'>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder='Enter full name'
              className='w-full p-3 border border-gray-300 rounded-md text-base box-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
          <div className='mb-6'>
            <label className='block mb-2 font-bold text-gray-700'>
              Email: <span className='text-red-600'>*</span>
            </label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder='Enter email address'
              className='w-full p-3 border border-gray-300 rounded-md text-base box-border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>
          <div>
            <button
              type='submit'
              disabled={formLoading}
              className={`px-6 py-3 border-none rounded-md mr-3 text-base font-bold transition-colors ${
                formLoading
                  ? 'bg-gray-500 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
              }`}>
              {formLoading
                ? editingUser
                  ? 'Updating...'
                  : 'Adding...'
                : editingUser
                ? 'Update User'
                : 'Add User'}
            </button>
            {editingUser && (
              <button
                type='button'
                onClick={cancelEdit}
                className='bg-gray-500 text-white px-6 py-3 border-none rounded-md cursor-pointer text-base font-bold hover:bg-gray-600 transition-colors'>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Users List Header */}
      <div className='flex justify-between items-center mb-5 gap-8'>
        <div className='flex-1'>
          <h2 className='m-0 text-gray-800 text-xl font-semibold'>
            Registered Users: ({users.length})
          </h2>
        </div>
        <div className='flex-1 flex justify-end'>
          {users.length > 0 && (
            <button
              onClick={fetchUsers}
              className='px-4 py-2 bg-cyan-600 text-white border-none rounded cursor-pointer text-sm hover:bg-cyan-700 transition-colors'>
              Refresh
            </button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div className='text-center p-10 bg-gray-50 rounded-lg border border-gray-200 text-gray-500'>
          <h3 className='m-0 mb-3 text-lg font-semibold'>No users found</h3>
          <p className='m-0'>Add your first user using the form above!</p>
        </div>
      ) : (
        <div className='grid gap-4'>
          {users.map((user: ClientUser) => (
            <div
              key={user._id}
              className='border border-gray-300 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow'>
              <h3 className='m-0 mb-2 text-gray-800 text-lg font-semibold'>
                {user.name}
              </h3>
              <p className='m-0 mb-2 text-gray-600 text-base'>
                📧 {user.email}
              </p>
              <p className='m-0 mb-4 text-xs text-gray-500'>
                Created: {formatDate(user.createdAt)}
                {user.updatedAt !== user.createdAt && (
                  <span> • Updated: {formatDate(user.updatedAt)}</span>
                )}
              </p>
              <div>
                <button
                  onClick={() => handleEdit(user)}
                  className='bg-green-600 text-white px-4 py-2 border-none rounded cursor-pointer mr-3 text-sm font-bold hover:bg-green-700 transition-colors'>
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className='bg-red-600 text-white px-4 py-2 border-none rounded cursor-pointer text-sm font-bold hover:bg-red-700 transition-colors'>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
