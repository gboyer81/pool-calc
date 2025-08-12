'use client'

import { useState, useEffect } from 'react'
import { ClientUser, UserInput, UseUsersReturn } from '../../types/user'

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<ClientUser[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all users
  async function fetchUsers(): Promise<void> {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/users')
      const data = await response.json()

      if (data.success) {
        // Convert ObjectId to string and Date to string for client-side
        const clientUsers: ClientUser[] = data.users.map((user: any) => ({
          ...user,
          _id: user._id.toString(),
          createdAt: new Date(user.createdAt).toISOString(),
          updatedAt: new Date(user.updatedAt).toISOString(),
        }))
        setUsers(clientUsers)
      } else {
        setError(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add a new user
  async function addUser(
    userData: UserInput
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchUsers() // Refresh the list
        return { success: true, message: 'User created successfully!' }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Update a user
  async function updateUser(
    userId: string,
    userData: UserInput
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchUsers() // Refresh the list
        return { success: true, message: 'User updated successfully!' }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Delete a user
  async function deleteUser(
    userId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        await fetchUsers() // Refresh the list
        return { success: true, message: 'User deleted successfully!' }
      } else {
        return { success: false, error: data.error }
      }
    } catch (err) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  // Load users on hook initialization
  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  }
}
