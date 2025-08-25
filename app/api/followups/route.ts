// app/api/followups/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  FollowUp,
  FollowUpResponse,
  ApiResponse,
  FollowUpsResponse,
} from '@/types/pool-service'

// GET /api/followups - Get follow-up visits
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const technicianId = searchParams.get('technicianId')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db('poolCalc')

    // First, get follow-ups from dedicated collection if it exists
    let followUps = await getStoredFollowUps(
      db,
      status,
      technicianId,
      priority,
      limit
    )

    // If no stored follow-ups, generate from visits that require follow-up
    if (followUps.length === 0) {
      followUps = await generateFollowUpsFromVisits(db, status, limit)
    }

    return NextResponse.json({
      success: true,
      data: followUps,
    })
  } catch (error) {
    console.error('GET /api/followups error:', error)
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

// POST /api/followups - Create new follow-up
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    const followUp: Partial<FollowUp> = {
      clientId: new ObjectId(body.clientId),
      originalVisitId: new ObjectId(body.originalVisitId),
      followUpType: body.followUpType || 'general-followup',
      priority: body.priority || 'medium',
      dueDate: new Date(body.dueDate),
      scheduledDate: body.scheduledDate
        ? new Date(body.scheduledDate)
        : undefined,
      status: 'pending',
      notes: body.notes || '',
      originalTechnician: body.originalTechnician,
      assignedTechnician: body.assignedTechnician
        ? new ObjectId(body.assignedTechnician)
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('followups').insertOne(followUp)

    return NextResponse.json(
      {
        success: true,
        message: 'Follow-up created successfully',
        data: { insertedId: result.insertedId },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/followups error:', error)
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

// PUT /api/followups/[id] - Update follow-up
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const url = new URL(request.url)
    const followUpId = url.pathname.split('/').pop()

    if (!followUpId || !ObjectId.isValid(followUpId)) {
      return NextResponse.json(
        { success: false, error: 'Valid follow-up ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    const updateData = { ...body }
    delete updateData._id
    delete updateData.createdAt
    updateData.updatedAt = new Date()

    // Convert dates
    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate)
    }
    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate)
    }
    if (updateData.completedDate) {
      updateData.completedDate = new Date(updateData.completedDate)
    }

    const result = await db
      .collection('followups')
      .updateOne({ _id: new ObjectId(followUpId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Follow-up not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Follow-up updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/followups error:', error)
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

// Helper function to get stored follow-ups
async function getStoredFollowUps(
  db: any,
  status: string,
  technicianId: string | null,
  priority: string | null,
  limit: number
) {
  const pipeline = [
    {
      $match: {
        status: status,
        ...(technicianId &&
          ObjectId.isValid(technicianId) && {
            assignedTechnician: new ObjectId(technicianId),
          }),
        ...(priority && { priority: priority }),
      },
    },
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
        from: 'service_visits',
        localField: 'originalVisitId',
        foreignField: '_id',
        as: 'originalVisit',
      },
    },
    {
      $addFields: {
        client: { $arrayElemAt: ['$client', 0] },
        originalVisit: { $arrayElemAt: ['$originalVisit', 0] },
      },
    },
    {
      $project: {
        _id: 1,
        clientName: '$client.name',
        clientId: { $toString: '$clientId' },
        originalVisitId: { $toString: '$originalVisitId' },
        originalVisitDate: {
          $ifNull: [
            '$originalVisit.actualDate',
            '$originalVisit.scheduledDate',
          ],
        },
        followUpType: 1,
        priority: 1,
        dueDate: 1,
        scheduledDate: 1,
        status: 1,
        notes: 1,
        originalTechnician: 1,
        createdAt: 1,
      },
    },
    {
      $sort: { dueDate: 1 },
    },
    {
      $limit: limit,
    },
  ]

  return await db.collection('followups').aggregate(pipeline).toArray()
}

// Helper function to generate follow-ups from visits
async function generateFollowUpsFromVisits(
  db: any,
  status: string,
  limit: number
) {
  const pipeline = [
    {
      $match: {
        status: 'completed',
        $or: [
          { 'serviceDetails.followUpRequired': true },
          { nextVisitRecommendations: { $exists: true, $ne: '' } },
        ],
      },
    },
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
        from: 'technicians',
        localField: 'technicianId',
        foreignField: '_id',
        as: 'technician',
      },
    },
    {
      $addFields: {
        client: { $arrayElemAt: ['$client', 0] },
        technician: { $arrayElemAt: ['$technician', 0] },
      },
    },
    {
      $project: {
        _id: { $toString: '$_id' },
        clientName: '$client.name',
        clientId: { $toString: '$clientId' },
        originalVisitId: { $toString: '$_id' },
        originalVisitDate: { $ifNull: ['$actualDate', '$scheduledDate'] },
        followUpType: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$serviceType', 'service-repair'] },
                then: 'Equipment Check',
              },
              {
                case: {
                  $regexMatch: { input: '$serviceType', regex: /maintenance/ },
                },
                then: 'Chemical Retest',
              },
              {
                case: { $eq: ['$serviceDetails.warrantyWork', true] },
                then: 'Warranty Callback',
              },
            ],
            default: 'Follow-up Service',
          },
        },
        priority: {
          $switch: {
            branches: [
              { case: { $eq: ['$priority', 'emergency'] }, then: 'high' },
              { case: { $eq: ['$priority', 'high'] }, then: 'medium' },
              {
                case: { $eq: ['$serviceDetails.followUpRequired', true] },
                then: 'medium',
              },
            ],
            default: 'low',
          },
        },
        dueDate: {
          $ifNull: [
            '$serviceDetails.followUpDate',
            {
              $add: [
                { $ifNull: ['$actualDate', '$scheduledDate'] },
                7 * 24 * 60 * 60 * 1000,
              ],
            }, // 7 days from visit
          ],
        },
        notes: { $ifNull: ['$nextVisitRecommendations', 'Follow-up required'] },
        originalTechnician: '$technician.name',
        status: 'pending',
      },
    },
    {
      $match: {
        dueDate: { $gte: new Date() }, // Only future or current due dates
      },
    },
    {
      $sort: { dueDate: 1 },
    },
    {
      $limit: limit,
    },
  ]

  return await db.collection('service_visits').aggregate(pipeline).toArray()
}
