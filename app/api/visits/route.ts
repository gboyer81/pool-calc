// app/api/visits/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'

// Service Visit interface
interface ServiceVisit {
  _id?: any
  clientId: any
  poolId: any
  technicianId?: any
  scheduledDate: Date
  actualDate?: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled'
  serviceType: 'routine' | 'chemical-only' | 'equipment-service' | 'emergency'

  // Water Testing Results
  readings?: {
    ph?: number
    totalChlorine?: number
    freeChlorine?: number
    totalAlkalinity?: number
    calciumHardness?: number
    cyanuricAcid?: number
    salt?: number
    phosphates?: number
    temperature?: number
    testedAt: Date
  }

  // Chemical Adjustments
  chemicalsAdded?: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
  }>

  // Service Tasks
  tasksCompleted?: Array<{
    task: string
    completed: boolean
    notes?: string
  }>

  // Pool Condition
  poolCondition?: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }

  // Photos
  photos?: Array<{
    url: string
    caption?: string
    type: 'before' | 'after' | 'issue' | 'equipment'
    uploadedAt: Date
  }>

  duration?: number // minutes
  notes?: string
  nextVisitRecommendations?: string
  createdAt: Date
  updatedAt: Date
}

interface VisitInput {
  clientId: string
  poolId: string
  scheduledDate: string
  serviceType: 'routine' | 'chemical-only' | 'equipment-service' | 'emergency'
  readings?: {
    ph?: number
    totalChlorine?: number
    freeChlorine?: number
    totalAlkalinity?: number
    calciumHardness?: number
    cyanuricAcid?: number
    salt?: number
    temperature?: number
  }
  chemicalsAdded?: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
  }>
  tasksCompleted?: Array<{
    task: string
    completed: boolean
    notes?: string
  }>
  poolCondition?: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }
  duration?: number
  notes?: string
  nextVisitRecommendations?: string
}

interface VisitsResponse extends ApiResponse {
  visits?: ServiceVisit[]
}

interface CreateVisitResponse extends ApiResponse {
  visitId?: any
}

// GET /api/visits - Get service visits with optional filters
export async function GET(
  request: NextRequest
): Promise<NextResponse<VisitsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const poolId = searchParams.get('poolId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db('PoolCalc')

    // Build query filters
    let query: any = {}

    if (clientId) {
      if (!ObjectId.isValid(clientId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid client ID format',
          },
          { status: 400 }
        )
      }
      query.clientId = new ObjectId(clientId)
    }

    if (poolId) {
      if (!ObjectId.isValid(poolId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid pool ID format',
          },
          { status: 400 }
        )
      }
      query.poolId = new ObjectId(poolId)
    }

    if (status) {
      query.status = status
    }

    if (startDate || endDate) {
      query.scheduledDate = {}
      if (startDate) {
        query.scheduledDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.scheduledDate.$lte = new Date(endDate)
      }
    }

    const visits = await db
      .collection<ServiceVisit>('service_visits')
      .find(query)
      .sort({ scheduledDate: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      visits: visits,
    })
  } catch (error) {
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

// POST /api/visits - Create a new service visit
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateVisitResponse>> {
  try {
    const body: VisitInput = await request.json()
    const {
      clientId,
      poolId,
      scheduledDate,
      serviceType,
      readings,
      chemicalsAdded,
      tasksCompleted,
      poolCondition,
      duration,
      notes,
      nextVisitRecommendations,
    } = body

    // Basic validation
    if (!clientId || !poolId || !scheduledDate || !serviceType) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Client ID, Pool ID, scheduled date, and service type are required',
        },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID format',
        },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(poolId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pool ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('PoolCalc')

    // Verify client and pool exist
    const clientExists = await db
      .collection('clients')
      .findOne({ _id: new ObjectId(clientId) })
    if (!clientExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    const poolExists = await db.collection('pools').findOne({
      _id: new ObjectId(poolId),
      clientId: new ObjectId(clientId),
    })
    if (!poolExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool not found for this client',
        },
        { status: 404 }
      )
    }

    // Insert new visit
    const now = new Date()
    const visitData: any = {
      clientId: new ObjectId(clientId),
      poolId: new ObjectId(poolId),
      scheduledDate: new Date(scheduledDate),
      actualDate: now,
      status: 'completed',
      serviceType,
      createdAt: now,
      updatedAt: now,
    }

    // Add optional fields if provided
    if (readings) {
      visitData.readings = {
        ...readings,
        testedAt: now,
      }
    }

    if (chemicalsAdded && chemicalsAdded.length > 0) {
      visitData.chemicalsAdded = chemicalsAdded
    }

    if (tasksCompleted && tasksCompleted.length > 0) {
      visitData.tasksCompleted = tasksCompleted
    }

    if (poolCondition) {
      visitData.poolCondition = poolCondition
    }

    if (duration) {
      visitData.duration = duration
    }

    if (notes) {
      visitData.notes = notes.trim()
    }

    if (nextVisitRecommendations) {
      visitData.nextVisitRecommendations = nextVisitRecommendations.trim()
    }

    const result = await db.collection('service_visits').insertOne(visitData)

    return NextResponse.json(
      {
        success: true,
        message: 'Service visit logged successfully',
        visitId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
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
