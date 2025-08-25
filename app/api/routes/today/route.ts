import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface Client {
  _id: any
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  serviceFrequency: string
  serviceDay?: string
  preferredTimeSlot?: string
  specialInstructions?: string
  isActive: boolean
  clientType: string
  maintenance?: {
    serviceDay?: string
  }
}

interface TodaysVisit {
  client: Client
  estimatedTime: string
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
  pools: number
  estimatedDuration: number
}

interface TodaysRouteResponse {
  success: boolean
  visits?: TodaysVisit[]
  error?: string
  technicianName?: string
  date?: string
}

// GET /api/routes/today - Get today's route for a technician
export async function GET(
  request: NextRequest
): Promise<NextResponse<TodaysRouteResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technicianId')

    if (!technicianId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician ID is required',
        },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(technicianId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid technician ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Get technician info
    const technician = await db
      .collection('technicians')
      .findOne({ _id: new ObjectId(technicianId) })

    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found',
        },
        { status: 404 }
      )
    }

    // Get today's day name
    const today = new Date()
    const dayName = today
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase()

    console.log('🗓️ Today is:', dayName)

    // Find clients assigned to this technician with today's service day
    const assignedClients = await db
      .collection<Client>('clients')
      .find({
        _id: {
          $in:
            technician.assignedClients?.map((id: any) => new ObjectId(id)) ||
            [],
        },
        isActive: true,
        $or: [{ serviceDay: dayName }, { 'maintenance.serviceDay': dayName }],
      })
      .toArray()

    console.log('👥 Found assigned clients for today:', assignedClients.length)

    // Generate today's route
    const todaysVisits: TodaysVisit[] = []
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    for (const [index, client] of assignedClients.entries()) {
      // Get pool count for this client
      const poolCount = await db
        .collection('pools')
        .countDocuments({ clientId: client._id })

      // Generate estimated time slot
      const estimatedTime = generateTimeSlot(
        client.preferredTimeSlot || client.maintenance?.serviceDay,
        index
      )

      // Check route status first (from update-status API calls)
      const routeStatus = await db.collection('route_status').findOne({
        clientId: client._id,
        date: startOfDay,
      })

      // Check if there's already a visit logged for today
      const existingVisit = await db.collection('service_visits').findOne({
        clientId: client._id,
        scheduledDate: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
      })

      // Determine status priority: route_status > service_visits > default
      let status: 'pending' | 'in-progress' | 'completed' | 'skipped' =
        'pending'

      if (routeStatus) {
        status = routeStatus.status
      } else if (existingVisit) {
        status = existingVisit.status || 'completed'
      }

      const visit: TodaysVisit = {
        client: client,
        estimatedTime,
        status,
        pools: Math.max(poolCount, 1), // At least 1 pool
        estimatedDuration: calculateEstimatedDuration(
          client.serviceFrequency,
          poolCount
        ),
      }

      todaysVisits.push(visit)
    }

    // Sort visits by estimated time
    todaysVisits.sort((a, b) => a.estimatedTime.localeCompare(b.estimatedTime))

    return NextResponse.json({
      success: true,
      visits: todaysVisits,
      technicianName: technician.name,
      date: today.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Error in GET /api/routes/today:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

// Helper function to generate time slots
function generateTimeSlot(
  preferredSlot: string | undefined,
  index: number
): string {
  let baseHour: number

  switch (preferredSlot?.toLowerCase()) {
    case 'morning':
      baseHour = 8
      break
    case 'afternoon':
      baseHour = 13
      break
    case 'evening':
      baseHour = 16
      break
    default:
      baseHour = 9 // Default start time
  }

  // Spread visits throughout the day with ~1-1.5 hour intervals
  const hour = baseHour + Math.floor(index * 1.5)
  const minutes = (index % 2) * 30 // Alternate between :00 and :30

  // Ensure hour doesn't exceed reasonable work hours (6 PM = 18)
  const finalHour = Math.min(hour, 18)

  return `${finalHour.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

// Helper function to calculate estimated duration
function calculateEstimatedDuration(
  frequency: string,
  poolCount: number
): number {
  const baseTime = poolCount * 30 // 30 minutes per pool

  switch (frequency?.toLowerCase()) {
    case 'weekly':
      return baseTime + 15 // Extra time for weekly service
    case 'bi-weekly':
      return baseTime + 30 // More time for bi-weekly
    case 'monthly':
      return baseTime + 45 // Most time for monthly
    default:
      return baseTime
  }
}
