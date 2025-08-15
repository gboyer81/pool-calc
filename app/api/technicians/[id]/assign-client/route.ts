// app/api/technicians/[id]/assign-client/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'
import { authenticateRequest } from '@/lib/auth'

interface AssignClientRequest {
  clientId: string
}

// POST /api/technicians/[id]/assign-client - Assign a client to a technician
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    // Authenticate the request
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Only supervisors and admins can assign clients
    if (!['supervisor', 'admin'].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      )
    }

    const { id: technicianId } = await params
    const body: AssignClientRequest = await request.json()
    const { clientId } = body

    if (!ObjectId.isValid(technicianId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid technician ID format',
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

    const client = await clientPromise
    const db = client.db('PoolCalc')

    // Verify technician exists
    const technician = await db.collection('technicians').findOne({
      _id: new ObjectId(technicianId),
      isActive: true,
    })
    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found or inactive',
        },
        { status: 404 }
      )
    }

    // Verify client exists
    const clientDoc = await db.collection('clients').findOne({
      _id: new ObjectId(clientId),
      isActive: true,
    })
    if (!clientDoc) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found or inactive',
        },
        { status: 404 }
      )
    }

    // Check if client is already assigned to this technician
    if (
      technician.assignedClients.some(
        (id: ObjectId) => id.toString() === clientId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client is already assigned to this technician',
        },
        { status: 400 }
      )
    }

    // Remove client from any other technician first
    await db.collection('technicians').updateMany(
      {
        _id: { $ne: new ObjectId(technicianId) },
        assignedClients: new ObjectId(clientId),
      },
      {
        $pull: { assignedClients: new ObjectId(clientId) } as any,
        $set: { updatedAt: new Date() },
      }
    )

    // Add client to the specified technician
    const result = await db.collection('technicians').updateOne(
      { _id: new ObjectId(technicianId) },
      {
        $addToSet: { assignedClients: new ObjectId(clientId) },
        $set: { updatedAt: new Date() },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client assigned successfully',
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
