'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from './ui/sidebar'
import {
  Home,
  Calculator,
  Users,
  ClipboardList,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  User,
} from 'lucide-react'

interface Technician {
  id: string
  name: string
  email: string
  role: 'admin' | 'supervisor' | 'technician'
  employeeId: string
  phone?: string
  emergencyContact?: string
}

interface NavigationProps {
  children: React.ReactNode
}

export default function Navigation({ children }: NavigationProps) {
  const pathname = usePathname()
  const [technician, setTechnician] = useState<Technician | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('technicianToken')
    const userData = localStorage.getItem('technicianData')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setTechnician(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('technicianToken')
        localStorage.removeItem('technicianData')
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('technicianToken')
    localStorage.removeItem('technicianData')
    setTechnician(null)
    setIsAuthenticated(false)
    window.location.href = '/login'
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Pool Calculator',
        href: '/',
        icon: Calculator,
        description: 'Chemical calculations',
      },
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'Overview & Quick Access',
      },
    ]

    if (!isAuthenticated) {
      return baseItems
    }

    const authenticatedItems = [
      {
        name: 'Clients',
        href: '/clients',
        icon: Users,
        description: 'Customer management',
      },
      {
        name: 'Work Orders',
        href: '/work-orders',
        icon: ClipboardList,
        description: 'Service requests',
      },
      {
        name: 'Schedule',
        href: '/schedule',
        icon: Calendar,
        description: 'Appointments & Routes',
      },
    ]

    if (technician?.role === 'admin' || technician?.role === 'supervisor') {
      authenticatedItems.push(
        {
          name: 'Reports',
          href: '/reports',
          icon: BarChart3,
          description: 'Analytics & Reports',
        },
        {
          name: 'Settings',
          href: '/settings',
          icon: Settings,
          description: 'System configuration',
        }
      )
    }

    return [...baseItems, ...authenticatedItems]
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'supervisor':
        return 'bg-yellow-100 text-yellow-800'
      case 'technician':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <Sidebar variant='inset'>
          <SidebarHeader>
            <div className='flex items-center gap-2 px-4 py-2'>
              <span className='text-2xl'>🏊‍♀️</span>
              <span className='text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                Pool Service Pro
              </span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === item.href}>
                        <Link href={item.href}>
                          <item.icon className='h-4 w-4' />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            {isAuthenticated && technician && (
              <div className='px-2 py-2 space-y-3'>
                {/* User Info Section */}
                <div className='flex items-center gap-3 p-2 rounded-md bg-muted/50'>
                  <div className='w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold'>
                    {technician.name.charAt(0).toUpperCase()}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>
                      {technician.name}
                    </p>
                    <p className='text-xs text-muted-foreground truncate'>
                      {technician.employeeId}
                    </p>
                  </div>
                </div>

                {/* Role and Logout Row */}
                <div className='flex items-center justify-between gap-2 px-2'>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      technician.role
                    )}`}>
                    {technician.role.charAt(0).toUpperCase() +
                      technician.role.slice(1)}
                  </span>

                  <button
                    onClick={handleLogout}
                    className='flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors'
                    title='Logout'>
                    <LogOut className='h-3 w-3' />
                    <span className='group-data-[collapsible=icon]:hidden'>
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <div className='flex flex-col h-screen'>
            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
              <SidebarTrigger />
              <div className='flex-1' />
              {/* You can add additional header content here */}
            </header>
            <main className='flex-1 overflow-auto p-4'>{children}</main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
