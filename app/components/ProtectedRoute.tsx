import React, { useState, useEffect, ReactNode } from 'react'

interface TechnicianData {
  _id: string
  name: string
  email: string
  employeeId: string
  role: string
  assignedClients: string[]
}

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean>(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('technicianToken')
        const technicianData = localStorage.getItem('technicianData')

        if (!token || !technicianData) {
          setIsAuthenticated(false)
          return
        }

        const parsedTechnician = JSON.parse(technicianData)

        // Verify token is still valid by making a test API call
        const response = await fetch('/api/clients', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          setTechnician(parsedTechnician)
          setIsAuthenticated(true)

          // Check role permissions
          if (
            requiredRoles.length > 0 &&
            !requiredRoles.includes(parsedTechnician.role)
          ) {
            setHasPermission(false)
          }
        } else if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('technicianToken')
          localStorage.removeItem('technicianData')
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [requiredRoles])

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = redirectTo
    }
  }, [isAuthenticated, redirectTo])

  // Show loading state
  if (isAuthenticated === null) {
    return (
      <div className='flex justify-center items-center h-screen bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Verifying authentication...</p>
        </div>
      </div>
    )
  }

  // Show permission denied if user doesn't have required role
  if (!hasPermission) {
    return (
      <div className='flex justify-center items-center h-screen bg-gray-50'>
        <div className='max-w-md w-full mx-4'>
          <div className='bg-white rounded-lg shadow-lg p-8 text-center'>
            <div className='text-6xl mb-4'>🚫</div>
            <h1 className='text-2xl font-bold text-gray-900 mb-4'>
              Access Denied
            </h1>
            <p className='text-gray-600 mb-6'>
              You don't have permission to access this page.
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Required roles: {requiredRoles.join(', ')}
              <br />
              Your role: {technician?.role}
            </p>
            <div className='flex gap-3 justify-center'>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors'>
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('technicianToken')
                  localStorage.removeItem('technicianData')
                  window.location.href = '/login'
                }}
                className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors'>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render protected content
  return <>{children}</>
}
