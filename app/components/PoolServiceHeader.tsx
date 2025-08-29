'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Calculator, Users, ClipboardList } from "lucide-react"

interface TechnicianData {
  _id: string
  name: string
  email: string
  employeeId: string
  role: string
  assignedClients: string[]
}

interface PoolServiceHeaderProps {
  technician: TechnicianData | null
  currentTime: Date
  onLogout: () => void
}

export function PoolServiceHeader({ technician, currentTime, onLogout }: PoolServiceHeaderProps) {
  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b border-blue-100 dark:border-blue-800 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex-1">
          <h1 className="text-base font-medium text-blue-900 dark:text-blue-100">
            {getGreeting()}, {technician?.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-xs text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} • {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">
            <a href="/clients" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden lg:inline">Clients</span>
            </a>
          </Button>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">
            <a href="/calculator" className="flex items-center gap-1">
              <Calculator className="h-4 w-4" />
              <span className="hidden lg:inline">Calculator</span>
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30">
            <span className="hidden lg:inline">Logout</span>
            <span className="lg:hidden">🚪</span>
          </Button>
        </div>
      </div>
    </header>
  )
}