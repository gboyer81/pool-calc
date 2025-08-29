'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { NeonGradientCard } from 'components/magicui/neon-gradient-card'
import { ShinyButton } from 'components/magicui/shiny-button'
import { MagicCard } from 'components/magicui/magic-card'
import { showToast } from '@/lib/toast'

interface LoginCredentials {
  email: string
  password: string
}

export default function TechnicianLogin() {
  const router = useRouter()
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
        router.push('/')
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

      // Check if response is ok and content-type is JSON
      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText)
      }

      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)

      if (!contentType || !contentType.includes('application/json')) {
        const htmlText = await response.text()
        console.error(
          'Expected JSON but received HTML:',
          htmlText.substring(0, 200)
        )
        setError('Server error - please try again later')
        return
      }

      const data = await response.json()
      console.log('Login response data:', data)

      if (data.success) {
        // Store token and user data
        localStorage.setItem('technicianToken', data.token)
        localStorage.setItem('technicianData', JSON.stringify(data.technician))

        // Dispatch custom event to notify other components of auth change
        window.dispatchEvent(new CustomEvent('authStateChanged'))

        showToast.success('Login successful!', `Welcome back, ${data.technician.name}`)
        
        // Redirect to dashboard
        router.push('/')
      } else {
        showToast.error('Login failed', data.error || 'Invalid credentials')
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      console.error('Login error details:', err)
      if (err instanceof SyntaxError) {
        showToast.error('Server Error', 'Please try again later')
        setError('Server response error - please try again')
      } else {
        showToast.error('Network Error', 'Please check your connection')
        setError('Network error - please check your connection')
      }
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
    return (
      <div className='flex justify-center items-center h-screen'>
        Loading...
      </div>
    )
  }

  return (
    <div className='min-h-1/2 flex justify-center items-center'>
      <div className='max-w-2xl w-full mx-4'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='text-6xl mb-4'>🏊‍♀️</div>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Pool Service Pro
          </h1>
          <p className='text-muted-foreground'>Technician Login</p>
        </div>

        {/* Login Form */}
        <NeonGradientCard className='max-h-[364px]'>
          <div className='bg-background rounded-lg shadow-xl p-8'>
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
                  className='w-full px-3 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
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
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  onKeyPress={handleKeyPress}
                  className='w-full px-3 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='••••••••'
                  disabled={loading}
                />
              </div>

              {/* Login Button */}
              <button
                onClick={handleSubmit}
                disabled={
                  loading || !credentials.email || !credentials.password
                }
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
            </div>
          </div>
        </NeonGradientCard>
        {/* Footer */}
        <div className='text-center mt-8 text-sm text-muted-foreground'>
          <p>Need help? Contact your supervisor</p>
          <p className='mt-2'>
            <button
              onClick={() => router.push('/calculator')}
              className='text-blue-600 hover:text-blue-800 underline'>
              Back to Calculator
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
