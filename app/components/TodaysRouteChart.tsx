'use client'

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { useIsMobile } from '../hooks/use-mobile'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface TodaysRoute {
  client: {
    _id: string
    name: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  estimatedTime: string
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
  pools: number
}

interface TodaysRouteChartProps {
  route: TodaysRoute[]
}

export function TodaysRouteChart({ route }: TodaysRouteChartProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState('today')

  // Transform route data into chart format
  const chartData = React.useMemo(() => {
    const hourlyData: { [key: string]: { hour: string, planned: number, completed: number } } = {}
    
    // Initialize hours from 8 AM to 6 PM
    for (let hour = 8; hour <= 18; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`
      hourlyData[hourStr] = { hour: hourStr, planned: 0, completed: 0 }
    }

    // Populate with actual data
    route.forEach(visit => {
      const hour = visit.estimatedTime.split(':')[0] + ':00'
      if (hourlyData[hour]) {
        hourlyData[hour].planned += 1
        if (visit.status === 'completed') {
          hourlyData[hour].completed += 1
        }
      }
    })

    return Object.values(hourlyData)
  }, [route])

  const chartConfig = {
    planned: {
      label: 'Planned',
      color: 'hsl(var(--chart-1))',
    },
    completed: {
      label: 'Completed',
      color: 'hsl(221, 83%, 53%)', // Blue theme
    },
  } satisfies ChartConfig

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('today')
    }
  }, [isMobile])

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle className="text-blue-900 dark:text-blue-100">Service Schedule Progress</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Today's visit schedule and completion status
          </span>
          <span className='@[540px]/card:hidden'>Today's progress</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type='single'
            value={timeRange}
            onValueChange={setTimeRange}
            variant='outline'
            className='hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex'>
            <ToggleGroupItem value='today' className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900">Today</ToggleGroupItem>
            <ToggleGroupItem value='week' className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900">This Week</ToggleGroupItem>
            <ToggleGroupItem value='month' className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-900">This Month</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className='flex w-32 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
              size='sm'
              aria-label='Select a time range'>
              <SelectValue placeholder='Today' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              <SelectItem value='today' className='rounded-lg'>
                Today
              </SelectItem>
              <SelectItem value='week' className='rounded-lg'>
                This Week
              </SelectItem>
              <SelectItem value='month' className='rounded-lg'>
                This Month
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id='fillPlanned' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-planned)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-planned)'
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id='fillCompleted' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-completed)'
                  stopOpacity={1.0}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-completed)'
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='hour'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => value}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[0, 'dataMax + 1']}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `${value}`}
                  indicator='dot'
                />
              }
            />
            <Area
              dataKey='planned'
              type='monotone'
              fill='url(#fillPlanned)'
              stroke='var(--color-planned)'
              stackId='a'
            />
            <Area
              dataKey='completed'
              type='monotone'
              fill='url(#fillCompleted)'
              stroke='var(--color-completed)'
              stackId='a'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}