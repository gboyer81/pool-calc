'use client'

import React, { useState, useEffect } from 'react'
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
import { ModeToggle } from '@/components/ModeToggle'

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

  return iconMap[name] || Calculator // Default fallback
}

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const [technician, setTechnician] = useState<TechnicianData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
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
    window.location.href = '/login'
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:bg-red-900/30 dark:text-red-300'
      case 'supervisor':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'technician':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-muted text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  const visibleNavItems = getVisibleNavItems()

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full bg-background'>
        <Sidebar variant='inset' collapsible='icon'>
          <SidebarHeader>
            <div className='flex items-center group-data-[collapsible=icon]:justify-center gap-2 px-4 py-2'>
              <span className='text-2xl group-data-[collapsible=icon]:text-3xl'>
                🏊‍♀️
              </span>
              <span className='text-xl font-bold bg-clip-text text-transparent group-data-[collapsible=icon]:hidden'>
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
              <div className='px-2 py-2 space-y-3 group-data-[collapsible=icon]:space-y-2'>
                {/* User Info Row */}
                <div className='flex items-center gap-3 p-2 rounded-md bg-muted/50 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-2 group-data-[collapsible=icon]:items-center'>
                  <Avatar className='h-8 w-8 border'>
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${technician.email}`}
                      alt={technician.name}
                    />
                    <AvatarFallback className='text-xs bg-primary/10'>
                      {technician.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0 group-data-[collapsible=icon]:hidden'>
                    <p className='text-sm font-medium truncate'>
                      {technician.name}
                    </p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {technician.employeeId}
                    </p>
                  </div>
                </div>

                {/* Role, Theme Toggle and Logout Row */}
                <div className='flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:items-center'>
                  <span className='group-data-[collapsible=icon]:hidden'>
                    {technician.role.charAt(0).toUpperCase() +
                      technician.role.slice(1)}
                  </span>
                  <span className='hidden group-data-[collapsible=icon]:inline'>
                    {technician.role.charAt(0).toUpperCase()}
                  </span>

                  <div className='flex items-center gap-1'>
                    {/* Theme Toggle */}
                    <div className='group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center '>
                      <ModeToggle />
                    </div>

                    {/* Logout Button */}
                    <button
                      onClick={handleLogout}
                      className='flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors'
                      title='Logout'>
                      <LogOut className='h-3 w-3' />
                      <span className='group-data-[collapsible=icon]:hidden'>
                        Logout
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Theme toggle for non-authenticated users */}
            {!isAuthenticated && (
              <div className='px-2 py-4'>
                <div className='flex justify-center group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center'>
                  <ModeToggle />
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className='flex flex-col h-screen'>
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
              <SidebarTrigger />
              <div className='flex-1' />
              {/* Additional header content can be added here */}
              {/* For collapsed sidebar state, show theme toggle in header */}
              <div className='group-data-[collapsible=icon]:block hidden'>
                <ModeToggle />
              </div>
            </header>
            <main className='flex-1 overflow-auto bg-background'>
              <div className='max-w-screen-2xl mx-auto p-4 min-h-full flex flex-col'>
                <div className='flex-1'>{children}</div>
                <Footer />
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
