// app/api/technicians/[id]/remove-client/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'
import { authenticateRequest } from '@/lib/auth'

interface RemoveClientRequest {
  clientId: string
}

// POST /api/technicians/[id]/remove-client - Remove a client from a technician
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

    // Only supervisors and admins can remove clients
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
    const body: RemoveClientRequest = await request.json()
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
    const db = client.db('poolCalc')

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

    // Check if client is currently assigned to this technician
    const isAssigned = technician.assignedClients.some(
      (id: ObjectId) => id.toString() === clientId
    )

    if (!isAssigned) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client is not assigned to this technician',
        },
        { status: 400 }
      )
    }

    // Remove client from the technician
    const result = await db.collection('technicians').updateOne(
      { _id: new ObjectId(technicianId) },
      {
        $pull: { assignedClients: new ObjectId(clientId) } as any,
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
      message: 'Client removed from technician successfully',
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
