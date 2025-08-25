// app/api/routes/update-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface UpdateStatusRequest {
  clientId: string
  status: 'pending' | 'in-progress' | 'completed' | 'skipped'
}

interface UpdateStatusResponse {
  success: boolean
  error?: string
  message?: string
}

// POST /api/routes/update-status - Update the status of a visit in today's route
export async function POST(
  request: NextRequest
): Promise<NextResponse<UpdateStatusResponse>> {
  try {
    const body: UpdateStatusRequest = await request.json()
    const { clientId, status } = body

    if (!clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
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

    if (!['pending', 'in-progress', 'completed', 'skipped'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid status. Must be: pending, in-progress, completed, or skipped',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    // Check if there's already a visit record for today
    const existingVisit = await db.collection('service_visits').findOne({
      clientId: new ObjectId(clientId),
      scheduledDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    })

    if (existingVisit) {
      // Update existing visit status
      await db.collection('service_visits').updateOne(
        { _id: existingVisit._id },
        {
          $set: {
            status: status,
            updatedAt: new Date(),
            ...(status === 'in-progress' && { actualStartTime: new Date() }),
            ...(status === 'completed' && { actualEndTime: new Date() }),
          },
        }
      )
    } else if (status === 'in-progress' || status === 'completed') {
      // Create a new visit record for in-progress or completed status
      const visitData = {
        clientId: new ObjectId(clientId),
        scheduledDate: new Date(),
        actualDate: new Date(),
        status: status,
        serviceType: 'maintenance-routine', // Default service type
        priority: 'normal',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(status === 'in-progress' && { actualStartTime: new Date() }),
        ...(status === 'completed' && { actualEndTime: new Date() }),
      }

      await db.collection('service_visits').insertOne(visitData)
    }
    // For 'pending' and 'skipped', we might not need a visit record,
    // but we could store route status in a separate collection if needed

    // For now, we'll create a simple route status tracking
    const routeStatusData = {
      clientId: new ObjectId(clientId),
      status: status,
      date: startOfDay,
      updatedAt: new Date(),
    }

    await db.collection('route_status').replaceOne(
      {
        clientId: new ObjectId(clientId),
        date: startOfDay,
      },
      routeStatusData,
      { upsert: true }
    )

    let message = ''
    switch (status) {
      case 'pending':
        message = 'Visit reset to pending'
        break
      case 'in-progress':
        message = 'Visit started'
        break
      case 'completed':
        message = 'Visit marked as completed'
        break
      case 'skipped':
        message = 'Visit skipped'
        break
    }

    return NextResponse.json({
      success: true,
      message: message,
    })
  } catch (error) {
    console.error('Error in POST /api/routes/update-status:', error)
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
