// app/api/visits/route.ts - Enhanced API with support for all visit types
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'

interface ServiceVisit {
  _id?: any
  clientId: any
  poolId?: any
  technicianId?: any
  scheduledDate: Date
  actualDate?: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled'
  serviceType:
    | 'maintenance-routine'
    | 'maintenance-chemical'
    | 'service-repair'
    | 'service-installation'
    | 'service-emergency'
    | 'retail-delivery'
    | 'retail-pickup'
    // Legacy support
    | 'routine'
    | 'chemical-only'
    | 'equipment-service'
    | 'emergency'

  priority?: 'low' | 'normal' | 'high' | 'emergency'

  // Water Testing Results (for maintenance visits)
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

  // Chemical Adjustments (for maintenance visits)
  chemicalsAdded?: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
    calculatedRecommendation?: string
    cost?: number
  }>

  // Service Tasks
  tasksCompleted?: Array<{
    task: string
    completed: boolean
    notes?: string
    timeSpent?: number
  }>

  // Pool Condition (for maintenance visits)
  poolCondition?: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }

  // Service-specific details
  serviceDetails?: {
    issueDescription?: string
    diagnosisNotes?: string
    partsUsed?: Array<{
      partName: string
      partNumber?: string
      quantity: number
      cost?: number
      warrantyPart?: boolean
    }>
    laborHours?: number
    laborRate?: number
    totalLaborCost?: number
    warrantyWork?: boolean
    followUpRequired?: boolean
    followUpDate?: Date
    equipmentTested?: boolean
    customerSignoff?: boolean
  }

  // Retail-specific details
  retailDetails?: {
    itemsDelivered?: Array<{
      productName: string
      sku?: string
      quantity: number
      unitPrice?: number
      totalPrice?: number
    }>
    totalDeliveryValue?: number
    paymentCollected?: number
    paymentMethod?: 'cash' | 'check' | 'card' | 'account'
    deliveryInstructions?: string
    signatureRequired?: boolean
    signatureObtained?: boolean
    customerPresent?: boolean
    customerName?: string
    deliveryPhoto?: string
  }

  // Photos
  photos?: Array<{
    url: string
    caption?: string
    type: 'before' | 'after' | 'issue' | 'equipment' | 'delivery' | 'damage'
    uploadedAt: Date
  }>

  // Timing and completion
  duration?: number // minutes
  startTime?: Date
  endTime?: Date

  // Notes and recommendations
  notes?: string
  nextVisitRecommendations?: string
  clientInstructions?: string

  // Follow-up and quality
  qualityRating?: number // 1-5 scale
  clientSatisfaction?:
    | 'very-satisfied'
    | 'satisfied'
    | 'neutral'
    | 'dissatisfied'
    | 'very-dissatisfied'

  createdAt: Date
  updatedAt: Date
}

interface CreateVisitResponse extends ApiResponse {
  visitId?: any
  visit?: ServiceVisit
}

interface VisitsResponse extends ApiResponse {
  visits?: ServiceVisit[]
  totalCount?: number
}

// GET /api/visits - Enhanced with filters and aggregation
export async function GET(
  request: NextRequest
): Promise<NextResponse<VisitsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const poolId = searchParams.get('poolId')
    const status = searchParams.get('status')
    const serviceType = searchParams.get('serviceType')
    const priority = searchParams.get('priority')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const technicianId = searchParams.get('technicianId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeStats = searchParams.get('includeStats') === 'true'

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Build query filters
    let query: any = {}

    if (clientId && ObjectId.isValid(clientId)) {
      query.clientId = new ObjectId(clientId)
    }

    if (poolId && ObjectId.isValid(poolId)) {
      query.poolId = new ObjectId(poolId)
    }

    if (technicianId && ObjectId.isValid(technicianId)) {
      query.technicianId = new ObjectId(technicianId)
    }

    if (status) {
      query.status = status
    }

    if (serviceType) {
      query.serviceType = serviceType
    }

    if (priority) {
      query.priority = priority
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

    // Get visits with populated client and pool data
    const aggregationPipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      {
        $lookup: {
          from: 'pools',
          localField: 'poolId',
          foreignField: '_id',
          as: 'pool',
        },
      },
      {
        $lookup: {
          from: 'technicians',
          localField: 'technicianId',
          foreignField: '_id',
          as: 'technician',
        },
      },
      {
        $addFields: {
          client: { $arrayElemAt: ['$client', 0] },
          pool: { $arrayElemAt: ['$pool', 0] },
          technician: { $arrayElemAt: ['$technician', 0] },
        },
      },
      { $sort: { scheduledDate: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]

    const visits = (await db
      .collection<ServiceVisit>('service_visits')
      .aggregate(aggregationPipeline)
      .toArray()) as ServiceVisit[]

    let response: VisitsResponse = {
      success: true,
      visits: visits,
    }

    // Add total count if requested
    if (includeStats) {
      const totalCount = await db
        .collection('service_visits')
        .countDocuments(query)
      response.totalCount = totalCount
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/visits error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// POST /api/visits - Enhanced visit creation
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateVisitResponse>> {
  try {
    const body = await request.json()
    const {
      clientId,
      poolId,
      serviceType,
      priority = 'normal',
      scheduledDate,
      actualDate,
      readings,
      chemicalsAdded,
      tasksCompleted,
      poolCondition,
      serviceDetails,
      retailDetails,
      duration,
      startTime,
      endTime,
      notes,
      nextVisitRecommendations,
      clientInstructions,
      qualityRating,
      clientSatisfaction,
      photos,
    } = body

    // Validation
    if (!clientId || !ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Valid client ID is required' },
        { status: 400 }
      )
    }

    if (!serviceType) {
      return NextResponse.json(
        { success: false, error: 'Service type is required' },
        { status: 400 }
      )
    }

    // For maintenance and service visits, pool ID is required
    if (
      (serviceType.startsWith('maintenance') ||
        serviceType.startsWith('service')) &&
      (!poolId || !ObjectId.isValid(poolId))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid pool ID is required for maintenance and service visits',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Get technician ID from token (you'll need to implement this based on your auth)
    // For now, using a placeholder
    const technicianId = new ObjectId() // Replace with actual technician from token

    const now = new Date()

    // Build visit data
    const visitData: Partial<ServiceVisit> = {
      clientId: new ObjectId(clientId),
      poolId: poolId ? new ObjectId(poolId) : undefined,
      technicianId,
      scheduledDate: new Date(scheduledDate),
      actualDate: actualDate ? new Date(actualDate) : now,
      status: 'completed',
      serviceType,
      priority,
      duration: duration || 0,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      notes: notes?.trim() || '',
      nextVisitRecommendations: nextVisitRecommendations?.trim() || '',
      clientInstructions: clientInstructions?.trim() || '',
      qualityRating,
      clientSatisfaction,
      createdAt: now,
      updatedAt: now,
    }

    // Add type-specific data
    if (serviceType.startsWith('maintenance')) {
      if (readings) {
        visitData.readings = {
          ...readings,
          testedAt: now,
        }
      }

      if (chemicalsAdded?.length > 0) {
        visitData.chemicalsAdded = chemicalsAdded.map((chemical: any) => ({
          ...chemical,
          cost: chemical.cost || 0,
        }))
      }

      if (poolCondition) {
        visitData.poolCondition = poolCondition
      }
    }

    if (serviceType.startsWith('service') && serviceDetails) {
      // Calculate labor cost if rate is provided
      if (serviceDetails.laborHours && serviceDetails.laborRate) {
        serviceDetails.totalLaborCost =
          serviceDetails.laborHours * serviceDetails.laborRate
      }

      // Calculate total parts cost
      if (serviceDetails.partsUsed?.length > 0) {
        serviceDetails.totalPartsCost = serviceDetails.partsUsed.reduce(
          (total: number, part: any) =>
            total + (part.cost || 0) * part.quantity,
          0
        )
      }

      visitData.serviceDetails = serviceDetails
    }

    if (serviceType.startsWith('retail') && retailDetails) {
      // Calculate total delivery value
      if (retailDetails.itemsDelivered?.length > 0) {
        retailDetails.totalDeliveryValue = retailDetails.itemsDelivered.reduce(
          (total: number, item: any) =>
            total + (item.totalPrice || item.unitPrice * item.quantity || 0),
          0
        )
      }

      visitData.retailDetails = retailDetails
    }

    // Add common fields
    if (tasksCompleted?.length > 0) {
      visitData.tasksCompleted = tasksCompleted
    }

    if (photos?.length > 0) {
      visitData.photos = photos.map((photo: any) => ({
        ...photo,
        uploadedAt: photo.uploadedAt ? new Date(photo.uploadedAt) : now,
      }))
    }

    // Insert visit
    const result = await db.collection('service_visits').insertOne(visitData)

    // Update client's last service date
    await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId) },
      {
        $set: {
          lastServiceDate: now,
          updatedAt: now,
        },
      }
    )

    // Update pool's last service date if applicable
    if (poolId) {
      await db.collection('pools').updateOne(
        { _id: new ObjectId(poolId) },
        {
          $set: {
            lastServiceDate: now,
            updatedAt: now,
          },
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Service visit logged successfully',
        visitId: result.insertedId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/visits error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// PUT /api/visits/[id] - Update existing visit
export async function PUT(
  request: NextRequest
): Promise<NextResponse<CreateVisitResponse>> {
  try {
    const url = new URL(request.url)
    const visitId = url.pathname.split('/').pop()

    if (!visitId || !ObjectId.isValid(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Valid visit ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    // Remove ID fields from update data
    const updateData = { ...body }
    delete updateData._id
    delete updateData.createdAt
    updateData.updatedAt = new Date()

    // Update visit
    const result = await db
      .collection('service_visits')
      .updateOne({ _id: new ObjectId(visitId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Visit updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/visits error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/visits/[id] - Delete visit (admin only)
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const url = new URL(request.url)
    const visitId = url.pathname.split('/').pop()

    if (!visitId || !ObjectId.isValid(visitId)) {
      return NextResponse.json(
        { success: false, error: 'Valid visit ID is required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    const result = await db
      .collection('service_visits')
      .deleteOne({ _id: new ObjectId(visitId) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Visit not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Visit deleted successfully',
    })
  } catch (error) {
    console.error('DELETE /api/visits error:', error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
