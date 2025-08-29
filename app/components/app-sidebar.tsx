"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Calculator, 
  LogIn, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Target, 
  Settings, 
  History,
  LogOut,
  Command 
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { AuroraText } from "components/magicui/aurora-text"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RoleBadge } from "@/lib/badge-utils"
import { WeatherWidget } from "./WeatherWidget"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

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
  icon: React.ComponentType<{ className?: string }>
  description: string
  roles?: string[]
  requiresAuth?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Technician dashboard',
    requiresAuth: true,
  },
  {
    name: 'Calculator',
    href: '/calculator',
    icon: Calculator,
    description: 'Pool chemical calculator',
    requiresAuth: false,
  },
  {
    name: 'Login',
    href: '/login',
    icon: LogIn,
    description: 'Technician login',
    requiresAuth: false,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Users,
    description: 'Client management',
    requiresAuth: true,
  },
  {
    name: 'Visit Log',
    href: '/visit/select',
    icon: ClipboardList,
    description: 'Log service visits',
    requiresAuth: true,
    roles: ['technician', 'supervisor', 'admin'],
  },
  {
    name: 'Recent Visits',
    href: '/visit/recent',
    icon: History,
    description: 'View recent service visits',
    requiresAuth: true,
    roles: ['technician', 'supervisor', 'admin'],
  },
  {
    name: 'Assignments',
    href: '/assignments',
    icon: Target,
    description: 'Manage client assignments',
    requiresAuth: true,
    roles: ['supervisor', 'admin'],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Settings,
    description: 'System administration',
    requiresAuth: true,
    roles: ['admin', 'supervisor'],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [technician, setTechnician] = React.useState<TechnicianData | null>(null)
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [activeItem, setActiveItem] = React.useState<NavigationItem | null>(null)
  const [recentVisits, setRecentVisits] = React.useState<any[]>([])
  const [clients, setClients] = React.useState<any[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>('')
  const { setOpen } = useSidebar()
  const pathname = usePathname()

  // Check if we're on the visit select page
  const isVisitSelectPage = pathname === '/visit/select'
  
  // Check if we're on the home page
  const isHomePage = pathname === '/'

  // Check authentication status
  React.useEffect(() => {
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
      }
    }

    checkAuth()

    // Listen for storage changes and auth state changes
    const handleStorageChange = () => {
      checkAuth()
    }

    const handleAuthStateChange = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authStateChanged', handleAuthStateChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChanged', handleAuthStateChange)
    }
  }, [])

  // Load clients when authenticated and on visit/select page
  React.useEffect(() => {
    if (isAuthenticated && isVisitSelectPage) {
      loadClients()
    }
  }, [isAuthenticated, isVisitSelectPage])

  const loadClients = async () => {
    try {
      const token = localStorage.getItem('technicianToken')
      const response = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    }
  }

  // Filter navigation items based on authentication and role
  const visibleNavItems = React.useMemo(() => {
    return navigationItems.filter((item) => {
      if (item.requiresAuth && !isAuthenticated) return false
      if (!item.requiresAuth && isAuthenticated && item.name === 'Login') return false
      if (item.roles && technician) {
        return item.roles.includes(technician.role)
      }
      return true
    })
  }, [isAuthenticated, technician])

  const handleLogout = () => {
    try {
      localStorage.removeItem('technicianToken')
      localStorage.removeItem('technicianData')
      setTechnician(null)
      setIsAuthenticated(false)
      
      // Dispatch custom event to notify other components of auth change
      window.dispatchEvent(new CustomEvent('authStateChanged'))
      
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Service types for visit/select page (Emergency Service first)
  const serviceTypes = [
    {
      type: 'service-emergency',
      title: 'Emergency Service',
      description: 'Urgent equipment failure or safety issue',
      icon: '🚨',
      color: 'bg-red-500',
      priority: 'emergency',
      estimatedDuration: 120,
    },
    {
      type: 'maintenance-routine',
      title: 'Routine Maintenance',
      description: 'Regular pool cleaning, chemical testing, and equipment check',
      icon: '💧',
      color: 'bg-blue-500',
      estimatedDuration: 45,
    },
    {
      type: 'maintenance-chemical',
      title: 'Chemical Balance Only',
      description: 'Water testing and chemical adjustment without cleaning',
      icon: '🧪',
      color: 'bg-green-500',
      estimatedDuration: 15,
    },
    {
      type: 'service-repair',
      title: 'Equipment Repair',
      description: 'Scheduled repair of pumps, heaters, or other equipment',
      icon: '🔧',
      color: 'bg-orange-500',
      estimatedDuration: 90,
    },
    {
      type: 'service-installation',
      title: 'Equipment Installation',
      description: 'Installing new equipment or system upgrades',
      icon: '⚙️',
      color: 'bg-purple-500',
      estimatedDuration: 180,
    },
    {
      type: 'retail-delivery',
      title: 'Product Delivery',
      description: 'Delivering chemicals, equipment, or supplies to customer',
      icon: '📦',
      color: 'bg-yellow-500',
      estimatedDuration: 20,
    },
    {
      type: 'retail-pickup',
      title: 'Product Pickup',
      description: 'Collecting returns, warranty items, or trade-ins',
      icon: '📤',
      color: 'bg-indigo-500',
      estimatedDuration: 15,
    },
  ]

  // Function to handle service type selection
  const handleServiceTypeClick = (serviceType: string) => {
    // Create a custom event to communicate with the main page
    const event = new CustomEvent('sidebarServiceTypeSelected', {
      detail: { serviceType }
    })
    window.dispatchEvent(event)
  }

  // Function to handle client selection
  const handleClientClick = (client: any) => {
    // Create a custom event to communicate with the main page
    const event = new CustomEvent('sidebarClientSelected', {
      detail: { client }
    })
    window.dispatchEvent(event)
  }

  // Filter service types and clients based on search query
  const filteredServiceTypes = React.useMemo(() => {
    if (!searchQuery.trim()) return serviceTypes
    return serviceTypes.filter(service =>
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  const filteredClients = React.useMemo(() => {
    if (!searchQuery.trim()) return []
    return clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address?.street?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.address?.city?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [clients, searchQuery])

  // Mock recent visits data for the second sidebar
  const mockVisits = React.useMemo(() => {
    if (!isAuthenticated) return []
    return [
      {
        id: '1',
        clientName: 'Johnson Pool',
        address: '123 Main St',
        date: 'Today',
        status: 'Completed',
        notes: 'Chlorine levels adjusted, skimmer cleaned'
      },
      {
        id: '2',
        clientName: 'Smith Residence',
        address: '456 Oak Ave',
        date: 'Yesterday',
        status: 'In Progress',
        notes: 'pH levels high, added muriatic acid'
      },
      {
        id: '3',
        clientName: 'Davis Family Pool',
        address: '789 Pine Rd',
        date: '2 days ago',
        status: 'Scheduled',
        notes: 'Weekly maintenance check'
      }
    ]
  }, [isAuthenticated])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden [&>[data-sidebar=sidebar]]:flex-row"
      style={{ '--sidebar-width': '21.5rem' } as React.CSSProperties}
      {...props}
    >
      {/* First sidebar - Navigation */}
      <Sidebar
        collapsible="none"
        className="!w-[calc(var(--sidebar-width-icon)+1px)] border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0 cursor-pointer hover:bg-sidebar-accent">
                <Link href="/" className="cursor-pointer">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <span className="text-lg">🏊‍♀️</span>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      <AuroraText>Pool Service</AuroraText>
                    </span>
                    <span className="truncate text-xs">Pro</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {visibleNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        tooltip={{
                          children: item.description,
                          hidden: false,
                        }}
                        onClick={() => {
                          setActiveItem(item)
                          setOpen(true)
                        }}
                        isActive={isActive}
                        className="px-2.5 md:px-2 cursor-pointer hover:bg-sidebar-accent transition-colors"
                        asChild
                      >
                        <Link href={item.href} className="cursor-pointer">
                          <item.icon className="h-4 w-4" />
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
            <div className="p-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {technician.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <div className="font-medium text-sm truncate">
                    {technician.name}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <RoleBadge role={technician.role} />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                      title="Logout"
                    >
                      <LogOut className="h-3 w-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Second sidebar - Content details */}
      <Sidebar collapsible="none" className="hidden md:flex w-[var(--sidebar-width)]">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {isVisitSelectPage ? 'Service Types' : (isHomePage ? 'Dashboard' : (activeItem?.name || 'Recent Activity'))}
            </div>
          </div>
          {isAuthenticated && !isHomePage && (
            <SidebarInput 
              placeholder={isVisitSelectPage ? "Search services & clients..." : "Search visits, clients..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          )}
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {isAuthenticated ? (
                isVisitSelectPage ? (
                  <>
                    {/* Show filtered clients first when searching */}
                    {searchQuery.trim() && filteredClients.length > 0 && (
                      <>
                        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b text-sm text-blue-700 dark:text-blue-400 font-medium">
                          Clients ({filteredClients.length})
                        </div>
                        {filteredClients.map((client) => (
                          <div
                            key={client._id}
                            onClick={() => handleClientClick(client)}
                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight cursor-pointer transition-colors"
                          >
                            <div className="flex w-full items-center gap-2">
                              <span className="text-lg">👤</span>
                              <span className="font-medium">{client.name}</span>
                            </div>
                            <div className="text-xs text-muted-foreground w-full">
                              {client.address?.street}, {client.address?.city}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {client.clientType?.charAt(0).toUpperCase()}{client.clientType?.slice(1)} Client
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* Show service types section */}
                    {(!searchQuery.trim() || filteredServiceTypes.length > 0) && (
                      <>
                        {searchQuery.trim() && filteredClients.length > 0 && (
                          <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border-b text-sm text-green-700 dark:text-green-400 font-medium">
                            Service Types ({filteredServiceTypes.length})
                          </div>
                        )}
                        {filteredServiceTypes.map((service) => (
                          <div
                            key={service.type}
                            onClick={() => handleServiceTypeClick(service.type)}
                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0 cursor-pointer transition-colors"
                          >
                            <div className="flex w-full items-center gap-2">
                              <span className="text-lg">{service.icon}</span>
                              <span className="font-medium">{service.title}</span>
                              {service.estimatedDuration && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {service.estimatedDuration}min
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground w-full">
                              {service.description}
                            </div>
                            {service.priority && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  service.priority === 'emergency' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                                  'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                }`}>
                                  {service.priority.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    
                    {/* No results message */}
                    {searchQuery.trim() && filteredClients.length === 0 && filteredServiceTypes.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        <div className="mb-2">🔍</div>
                        <div className="text-sm">No results found</div>
                        <div className="text-xs mt-1">Try searching for client names or service types</div>
                      </div>
                    )}
                  </>
                ) : isHomePage ? (
                  // Show weather widget on home page
                  <div className="p-4">
                    <WeatherWidget />
                  </div>
                ) : (
                  // Show recent visits on other pages
                  mockVisits.map((visit) => (
                    <div
                      key={visit.id}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight last:border-b-0"
                    >
                      <div className="flex w-full items-center gap-2">
                        <span className="font-medium">{visit.clientName}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{visit.date}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{visit.address}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          visit.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                          visit.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {visit.status}
                        </span>
                      </div>
                      <span className="line-clamp-2 w-full text-xs text-muted-foreground mt-1">
                        {visit.notes}
                      </span>
                    </div>
                  ))
                )
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="mb-2">👋</div>
                  <div className="text-sm">Welcome to Pool Service Pro</div>
                  <div className="text-xs mt-1">Sign in to view your recent activities</div>
                </div>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}