'use client'

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react'
import { ClientUser, UserInput } from '../../types/user'

interface FormData {
  name: string
  email: string
}

export default function UserManagement(): React.ReactElement {
  const [users, setUsers] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' })
  const [editingUser, setEditingUser] = useState<ClientUser | null>(null)
  const [message, setMessage] = useState<string>('')
  const [formLoading, setFormLoading] = useState<boolean>(false)

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

  // Format date for display
  function formatDate(dateString: string): string {
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
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          fontSize: '18px',
          fontFamily: 'Arial',
        }}>
        Loading users...
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'Arial',
      }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>User Management</h1>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
            border: `1px solid ${
              message.includes('Error') ? '#f5c6cb' : '#c3e6cb'
            }`,
            borderRadius: '6px',
            color: message.includes('Error') ? '#721c24' : '#155724',
            fontWeight: 'bold',
          }}>
          {message}
        </div>
      )}

      {/* Add/Edit User Form */}
      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '25px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #e9ecef',
        }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#495057' }}>
          {editingUser ? 'Edit User' : 'Add New User'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#495057',
              }}>
              Name: <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type='text'
              name='name'
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder='Enter full name'
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
                color: '#495057',
              }}>
              Email: <span style={{ color: '#dc3545' }}>*</span>
            </label>
            <input
              type='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder='Enter email address'
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <button
              type='submit'
              disabled={formLoading}
              style={{
                backgroundColor: formLoading ? '#6c757d' : '#007bff',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                cursor: formLoading ? 'not-allowed' : 'pointer',
                marginRight: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
              }}>
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
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Users List */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
        <h2 style={{ margin: 0, color: '#333' }}>Users ({users.length})</h2>
        {users.length > 0 && (
          <button
            onClick={fetchUsers}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}>
            Refresh
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef',
            color: '#6c757d',
          }}>
          <h3 style={{ margin: '0 0 10px 0' }}>No users found</h3>
          <p style={{ margin: 0 }}>Add your first user using the form above!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {users.map((user: ClientUser) => (
            <div
              key={user._id}
              style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>
                {user.name}
              </h3>
              <p
                style={{
                  margin: '0 0 8px 0',
                  color: '#666',
                  fontSize: '16px',
                }}>
                📧 {user.email}
              </p>
              <p
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  color: '#999',
                }}>
                Created: {formatDate(user.createdAt)}
                {user.updatedAt !== user.createdAt && (
                  <span> • Updated: {formatDate(user.updatedAt)}</span>
                )}
              </p>
              <div>
                <button
                  onClick={() => handleEdit(user)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}>
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}>
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
