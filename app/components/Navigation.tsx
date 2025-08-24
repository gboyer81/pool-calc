'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LogOut,
  Calculator,
  LogIn,
  LayoutDashboard,
  Users,
  ClipboardList,
  Target,
  Settings,
} from 'lucide-react'
import Footer from '@/components/Footer'
import { AuroraText } from 'components/magicui/aurora-text'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/lib/badge-utils'
import { ModeToggle } from '@/components/ModeToggle'
//import { AnimatedThemeToggler } from 'components/magicui/animated-theme-toggler'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

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

// Same navigation items as header navigation
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
    href: '/visit/select',
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

// Map navigation item names to Lucide icons
const getNavigationIcon = (name: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    Calculator: Calculator,
    Login: LogIn,
    Dashboard: LayoutDashboard,
    Clients: Users,
    'Visit Log': ClipboardList,
    Assignments: Target,
    Admin: Settings,
  }

  return iconMap[name] || Calculator
}

export default function Navigation({
  children,
}: {
  children: React.ReactNode
}) {
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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

  // Filter navigation items based on authentication and role
  const visibleNavItems = useMemo(() => {
    return navigationItems.filter((item) => {
      // If item requires auth but user is not authenticated, hide it
      if (item.requiresAuth && !isAuthenticated) return false

      // If item doesn't require auth but user is authenticated and it's login page, hide it
      if (!item.requiresAuth && isAuthenticated && item.name === 'Login')
        return false

      // If item has role restrictions, check if user has required role
      if (item.roles && technician) {
        return item.roles.includes(technician.role)
      }

      return true
    })
  }, [isAuthenticated, technician])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-muted/50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    try {
      // Remove authentication data from localStorage
      localStorage.removeItem('technicianToken')
      localStorage.removeItem('technicianData')

      // Update state
      setTechnician(null)
      setIsAuthenticated(false)

      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <SidebarProvider>
      <div className='flex h-screen w-full'>
        <Sidebar collapsible='icon'>
          <SidebarHeader>
            <div className='flex items-center gap-2 px-2 pt-2.5'>
              <span className='text-2xl'>🏊‍♀️</span>
              <span className='font-semibold text-lg group-data-[collapsible=icon]:hidden'>
                <AuroraText>Pool Service Pro</AuroraText>
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleNavItems.map((item) => {
                    const IconComponent = getNavigationIcon(item.name)
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' && pathname.startsWith(item.href))

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.description}>
                          <Link href={item.href}>
                            <IconComponent className='h-4 w-4' />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            {isAuthenticated && technician && (
              <div className='px-2 py-2 space-y-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:py-1 group-data-[collapsible=icon]:space-y-1'>
                {/* User Info Section */}
                <div className='flex items-center gap-3 p-2 rounded-md bg-muted/50 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1'>
                  <Avatar className='h-8 w-8 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6 group-data-[collapsible=icon]:mb-10'>
                    <AvatarImage src='' />
                    <AvatarFallback className='text-xs bg-primary text-primary-foreground'>
                      {technician.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='min-w-0 flex-1 group-data-[collapsible=icon]:hidden'>
                    <div className='text-xs text-muted-foreground mb-1'>
                      Clients: {technician.assignedClients.length}
                    </div>
                    <div className='font-medium text-sm truncate mb-2'>
                      {technician.name}
                    </div>
                    <div className='flex items-center justify-between gap-2'>
                      <RoleBadge role={technician.role} />
                      <button
                        onClick={handleLogout}
                        className='flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors'
                        title='Logout'>
                        <LogOut className='h-3 w-3' />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className='flex flex-col h-screen min-h-screen overflow-hidden'>
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
              <SidebarTrigger />
              <div className='flex-1' />
              {/* Additional header content can be added here */}
              {/* For collapsed sidebar state, show theme toggle in header */}
              <div className='mr-3'>
                <ModeToggle />
              </div>
            </header>

            {/* Main content area - now scrollable with custom scrollbar */}
            <main className='flex-1 bg-background overflow-y-auto scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-gray-600'>
              <div className='max-w-screen-2xl mx-auto p-4 pb-6'>
                {children}
              </div>
            </main>

            {/* Footer moved outside of main content - now sticky */}
            <Footer />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
