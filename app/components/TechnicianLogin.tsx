'use client'

import React, { useState, useEffect } from 'react'

interface LoginCredentials {
  email: string
  password: string
}

export default function TechnicianLogin() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('technicianToken')
      if (token) {
        window.location.href = '/dashboard'
      }
    }
  }, [])

  const handleInputChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  const handleSubmit = async () => {
    if (!credentials.email || !credentials.password) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success) {
        // Store token and user data
        localStorage.setItem('technicianToken', data.token)
        localStorage.setItem('technicianData', JSON.stringify(data.technician))

        // Redirect to dashboard
        window.location.href = '/dashboard'
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error - please check your connection')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!mounted) {
    return <div className='flex justify-center mt-14 h-screen'>Loading...</div>
  }

  return (
    <div className='flex justify-center bg-gradient-to-br from-blue-50 to-blue-200 rounded-2xl p-8'>
      <div className='max-w-4xl w-full mx-4'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='text-6xl my-4'>🏊‍♀️</div>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Pool Service Pro
          </h1>
          <p className='text-gray-600'>Technician Login</p>
        </div>

        {/* Login Form */}
        <div className='bg-white rounded-lg shadow-2xl p-8'>
          <div className='space-y-6'>
            {/* Error Message */}
            {error && (
              <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
                <div className='flex items-center'>
                  <span className='text-red-500 mr-2'>❌</span>
                  {error}
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Email Address
              </label>
              <input
                type='email'
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onKeyPress={handleKeyPress}
                className='w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='technician@poolservice.com'
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Password
              </label>
              <input
                type='password'
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onKeyPress={handleKeyPress}
                className='w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='••••••••'
                disabled={loading}
              />
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !credentials.email || !credentials.password}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                loading || !credentials.email || !credentials.password
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:-translate-y-0.5 hover:shadow-lg'
              }`}>
              {loading ? (
                <div className='flex items-center justify-center'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Demo Credentials */}
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6'>
              <div className='text-sm text-blue-800'>
                <div className='font-medium mb-2'>Demo Credentials:</div>
                <div className='space-y-1'>
                  <div>
                    <strong>Technician:</strong> tech@poolservice.com /
                    password123
                  </div>
                  <div>
                    <strong>Supervisor:</strong> supervisor@poolservice.com /
                    password123
                  </div>
                  <div>
                    <strong>Admin:</strong> admin@poolservice.com / password123
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Login Buttons */}
            <div className='space-y-2'>
              <button
                onClick={() => {
                  setCredentials({
                    email: 'tech@poolservice.com',
                    password: 'password123',
                  })
                }}
                className='w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm'>
                Demo Technician Login
              </button>
              <button
                onClick={() => {
                  setCredentials({
                    email: 'supervisor@poolservice.com',
                    password: 'password123',
                  })
                }}
                className='w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm'>
                Demo Supervisor Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center mt-8 text-sm text-gray-600'>
          <p>Need help? Contact your supervisor</p>
          <p className='mt-2'>
            <button
              onClick={() => (window.location.href = '/')}
              className='text-blue-600 hover:text-blue-800 underline'>
              Back to Calculator
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
