// app/api/routes/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface RouteStatusResponse {
  success: boolean
  statuses?: Array<{
    clientId: string
    clientName: string
    status: string
    date: string
    updatedAt: string
  }>
  error?: string
}

// GET /api/routes/status - Get route status for a specific date or technician
export async function GET(
  request: NextRequest
): Promise<NextResponse<RouteStatusResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technicianId')
    const date = searchParams.get('date') // YYYY-MM-DD format

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Default to today if no date provided
    const queryDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0))

    let query: any = { date: startOfDay }

    // If technicianId provided, filter by assigned clients
    if (technicianId && ObjectId.isValid(technicianId)) {
      const technician = await db
        .collection('technicians')
        .findOne({ _id: new ObjectId(technicianId) })

      if (technician && technician.assignedClients) {
        query.clientId = {
          $in: technician.assignedClients.map((id: any) => new ObjectId(id)),
        }
      }
    }

    // Get route statuses with client information
    const statuses = await db
      .collection('route_status')
      .aggregate([
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
          $addFields: {
            client: { $arrayElemAt: ['$client', 0] },
          },
        },
        { $sort: { updatedAt: -1 } },
      ])
      .toArray()

    const formattedStatuses = statuses.map((status: any) => ({
      clientId: status.clientId.toString(),
      clientName: status.client?.name || 'Unknown Client',
      status: status.status,
      date: status.date.toISOString().split('T')[0],
      updatedAt: status.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      statuses: formattedStatuses,
    })
  } catch (error) {
    console.error('Error in GET /api/routes/status:', error)
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

// DELETE /api/routes/status - Clear route statuses (for testing/reset)
export async function DELETE(
  request: NextRequest
): Promise<
  NextResponse<{ success: boolean; message?: string; error?: string }>
> {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') // YYYY-MM-DD format

    const client = await clientPromise
    const db = client.db('poolCalc')

    let query = {}

    if (date) {
      const queryDate = new Date(date)
      const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0))
      query = { date: startOfDay }
    }

    const result = await db.collection('route_status').deleteMany(query)

    return NextResponse.json({
      success: true,
      message: `Cleared ${result.deletedCount} route status records`,
    })
  } catch (error) {
    console.error('Error in DELETE /api/routes/status:', error)
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
