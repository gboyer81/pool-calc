'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface TechnicianData {
  _id: string
  name: string
  email: string
  employeeId: string
  role: 'technician' | 'supervisor' | 'admin'
  assignedClients: string[]
}

interface NavigationItem {
  name: string
  href: string
  icon: string
  description: string
  roles?: string[] // If specified, only show for these roles
  requiresAuth?: boolean // If true, only show when logged in
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Calculator',
    href: '/',
    icon: '🧮',
    description: 'Pool chemical calculator',
    requiresAuth: false,
  },
  {
    name: 'Login',
    href: '/login',
    icon: '🔐',
    description: 'Technician login',
    requiresAuth: false,
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    description: 'Technician dashboard',
    requiresAuth: true,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: '👥',
    description: 'Client management',
    requiresAuth: true,
  },
  {
    name: 'Visit Log',
    href: '/visit/log',
    icon: '📋',
    description: 'Log service visits',
    requiresAuth: true,
    roles: ['technician', 'supervisor', 'admin'],
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: '🎯',
    description: 'Manage client assignments',
    requiresAuth: true,
    roles: ['supervisor', 'admin'],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: '👑',
    description: 'System administration',
    requiresAuth: true,
    roles: ['admin', 'supervisor'],
  },
]

export default function Navigation() {
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const pathname = usePathname()

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('technicianToken')
        const technicianData = localStorage.getItem('technicianData')

        if (token && technicianData) {
          const parsedTechnician = JSON.parse(technicianData)
          setTechnician(parsedTechnician)
          setIsAuthenticated(true)
        } else {
          setTechnician(null)
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setTechnician(null)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for storage changes (logout in another tab)
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Filter navigation items based on authentication and role
  const getVisibleNavItems = () => {
    return navigationItems.filter((item) => {
      // If item requires auth but user is not authenticated, hide it
      if (item.requiresAuth && !isAuthenticated) {
        return false
      }

      // If item has role restrictions, check user role
      if (item.roles && technician) {
        return item.roles.includes(technician.role)
      }

      // Hide login if already authenticated
      if (item.href === '/login' && isAuthenticated) {
        return false
      }

      return true
    })
  }

  const handleLogout = () => {
    localStorage.removeItem('technicianToken')
    localStorage.removeItem('technicianData')
    setTechnician(null)
    setIsAuthenticated(false)
    setMobileMenuOpen(false)
    window.location.href = '/login'
  }

  const isActivePage = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const visibleNavItems = getVisibleNavItems()

  return (
    <>
      {/* Navigation Header */}
      <nav className='supports-backdrop-blur:bg-background/90 sticky top-0 z-40 w-full border-b border-border bg-background/40 backdrop-blur-lg'>
        <div className='max-w-screen-2xl mx-auto px-4'>
          <div className='flex justify-between h-16'>
            {/* Logo */}
            <div className='flex items-center'>
              <Link href='/' className='flex-shrink-0 flex items-center group'>
                <span className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-cyan-700 transition-all duration-200'>
                  🏊‍♀️ Pool Service Pro
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className='hidden lg:flex items-center space-x-1'>
              {visibleNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group ${
                    isActivePage(item.href)
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  title={item.description}>
                  <span className='group-hover:scale-110 transition-transform duration-200'>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              ))}

              {/* User Info & Logout */}
              {isAuthenticated && technician && (
                <div className='hidden xl:flex xl:items-center xl:space-x-3 ml-4 pl-4 border-l border-gray-200'>
                  <div className='text-right'>
                    <div className='text-sm font-medium text-gray-900'>
                      {technician.name}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {technician.role} • {technician.employeeId}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className='bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600 transition-colors duration-200'
                    title='Logout'>
                    🚪
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className='lg:hidden flex items-center'>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className='text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors duration-200'>
                <svg
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'>
                  {mobileMenuOpen ? (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  ) : (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M4 6h16M4 12h16M4 18h16'
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`lg:hidden fixed inset-x-0 top-16 z-50 transition-all duration-300 ease-in-out ${
            mobileMenuOpen
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : '-translate-y-full opacity-0 pointer-events-none'
          }`}>
          <div className='bg-white border-t border-gray-200 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto'>
            <div className='px-3 pt-2 pb-3 space-y-1'>
              {/* User Info (Mobile) - IMPROVED */}
              {isAuthenticated && technician && (
                <div className='px-3 py-3 bg-blue-50 rounded-lg mb-3'>
                  <div className='text-sm font-medium text-gray-900 truncate'>
                    👤 {technician.name}
                  </div>
                  <div className='text-xs text-gray-600 truncate'>
                    {technician.role} • {technician.employeeId}
                  </div>
                </div>
              )}

              {/* Navigation Items - IMPROVED */}
              {visibleNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActivePage(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}>
                  <span className='text-xl flex-shrink-0'>{item.icon}</span>
                  <div className='min-w-0 flex-1'>
                    <div className='truncate'>{item.name}</div>
                    <div className='text-xs text-gray-500 truncate'>
                      {item.description}
                    </div>
                  </div>
                </Link>
              ))}

              {/* Logout (Mobile) - IMPROVED */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className='w-full flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors duration-200'>
                  <span className='text-xl flex-shrink-0'>🚪</span>
                  <span className='truncate'>Logout</span>
                </button>
              )}

              {/* Quick Stats (Mobile) - IMPROVED */}
              {isAuthenticated && technician && (
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='px-3 py-2 text-xs text-gray-600 space-y-1'>
                    <div className='truncate'>
                      Assigned Clients: {technician.assignedClients.length}
                    </div>
                    <div className='truncate'>
                      Current Time: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Loading Indicator */}
      {isLoading && (
        <div className='fixed top-16 left-0 right-0 bg-blue-600 text-white text-center py-1 text-sm z-40'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
            <span>Loading...</span>
          </div>
        </div>
      )}
    </>
  )
}
