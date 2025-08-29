'use client'

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { Calculator, Users, ClipboardList, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface PoolServiceCardsProps {
  totalClients: number
  todaysVisits: number
  completedVisits: number
  totalPools: number
}

export function PoolServiceCards({ 
  totalClients, 
  todaysVisits, 
  completedVisits, 
  totalPools 
}: PoolServiceCardsProps) {
  const completionRate = todaysVisits > 0 ? Math.round((completedVisits / todaysVisits) * 100) : 0
  const pendingVisits = todaysVisits - completedVisits

  return (
    <div className="*:data-[slot=card]:from-blue-500/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Total Clients
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-blue-900 dark:text-blue-100 @[250px]/card:text-3xl">
            {totalClients}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              <IconTrendingUp className="h-3 w-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-blue-700 dark:text-blue-300">
            Assigned clients <Users className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total clients under your service
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            Today's Visits
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-blue-900 dark:text-blue-100 @[250px]/card:text-3xl">
            {todaysVisits}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-300">
              <ClipboardList className="h-3 w-3" />
              Scheduled
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-amber-700 dark:text-amber-300">
            {pendingVisits} pending visits <ClipboardList className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Service visits scheduled for today
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            Completed Visits
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-blue-900 dark:text-blue-100 @[250px]/card:text-3xl">
            {completedVisits}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={`${
              completionRate >= 75 
                ? "border-green-200 text-green-700 dark:border-green-700 dark:text-green-300" 
                : "border-orange-200 text-orange-700 dark:border-orange-700 dark:text-orange-300"
            }`}>
              {completionRate >= 75 ? <IconTrendingUp className="h-3 w-3" /> : <IconTrendingDown className="h-3 w-3" />}
              {completionRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className={`line-clamp-1 flex gap-2 font-medium ${
            completionRate >= 75 
              ? "text-green-700 dark:text-green-300" 
              : "text-orange-700 dark:text-orange-300"
          }`}>
            {completionRate >= 75 ? "Great progress" : "Keep going"} <CheckCircle className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Completion rate for today's schedule
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="flex items-center gap-2">
            <span className="text-blue-600">🏊‍♀️</span>
            Total Pools
          </CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums text-blue-900 dark:text-blue-100 @[250px]/card:text-3xl">
            {totalPools}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              <Calculator className="h-3 w-3" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-blue-700 dark:text-blue-300">
            Servicing pools today <span className="text-sm">🏊‍♀️</span>
          </div>
          <div className="text-muted-foreground">
            Total pools scheduled for service
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}