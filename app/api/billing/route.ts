// app/api/billing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { authenticateRequest } from '@/lib/auth'
import { PendingBilling, ApiResponse } from '@/types/pool-service'

interface PopulatedPendingBilling extends PendingBilling {
  client?: {
    _id: ObjectId
    name: string
    email: string
    clientType: string
    address: {
      street: string
      city: string
      state: string
      zipCode: string
    }
  }
  visits?: Array<{
    _id: ObjectId
    serviceType: string
    scheduledDate: Date
    billing?: {
      totalAmount: number
      paymentStatus: string
    }
  }>
  orders?: Array<{
    _id: ObjectId
    orderNumber: string
    totalAmount: number
    status: string
  }>
}

interface BillingResponse extends ApiResponse {
  pendingBilling?: PopulatedPendingBilling[]
  totalPending?: number
  totalAmount?: number
}

// GET /api/billing - Get pending billing items with populated client data
export async function GET(
  request: NextRequest
): Promise<NextResponse<BillingResponse>> {
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

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Build query filters
    let query: any = {}

    if (clientId && ObjectId.isValid(clientId)) {
      query.clientId = new ObjectId(clientId)
    }

    if (status) {
      query.status = status
    }

    // Aggregation pipeline similar to your visits route
    const aggregationPipeline = [
      { $match: query },
      // Populate client data
      {
        $lookup: {
          from: 'clients',
          localField: 'clientId',
          foreignField: '_id',
          as: 'client',
        },
      },
      // Populate visit data
      {
        $lookup: {
          from: 'service_visits',
          localField: 'visitIds',
          foreignField: '_id',
          as: 'visits',
        },
      },
      // Populate order data
      {
        $lookup: {
          from: 'orders',
          localField: 'orderIds',
          foreignField: '_id',
          as: 'orders',
        },
      },
      // Add computed fields
      {
        $addFields: {
          client: { $arrayElemAt: ['$client', 0] },
          // Calculate total amount from visits and orders
          calculatedTotalAmount: {
            $add: [
              {
                $sum: {
                  $map: {
                    input: '$visits',
                    as: 'visit',
                    in: { $ifNull: ['$$visit.billing.totalAmount', 0] },
                  },
                },
              },
              {
                $sum: {
                  $map: {
                    input: '$orders',
                    as: 'order',
                    in: { $ifNull: ['$$order.totalAmount', 0] },
                  },
                },
              },
            ],
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]

    const pendingBilling = (await db
      .collection<PendingBilling>('pending_billing')
      .aggregate(aggregationPipeline)
      .toArray()) as PopulatedPendingBilling[]

    // Calculate summary statistics
    const totalPending = await db
      .collection('pending_billing')
      .countDocuments(query)

    const totalAmountPipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'service_visits',
          localField: 'visitIds',
          foreignField: '_id',
          as: 'visits',
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderIds',
          foreignField: '_id',
          as: 'orders',
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $add: [
                {
                  $sum: {
                    $map: {
                      input: '$visits',
                      as: 'visit',
                      in: { $ifNull: ['$$visit.billing.totalAmount', 0] },
                    },
                  },
                },
                {
                  $sum: {
                    $map: {
                      input: '$orders',
                      as: 'order',
                      in: { $ifNull: ['$$order.totalAmount', 0] },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    ]

    const totalAmountResult = await db
      .collection('pending_billing')
      .aggregate(totalAmountPipeline)
      .toArray()

    const totalAmount = totalAmountResult[0]?.totalAmount || 0

    return NextResponse.json({
      success: true,
      pendingBilling,
      totalPending,
      totalAmount,
    })
  } catch (error) {
    console.error('GET /api/billing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// POST /api/billing - Create pending billing record
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
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

    const body = await request.json()

    // Validate required fields
    if (!body.clientId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client ID is required',
        },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(body.clientId)) {
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

    // Verify client exists
    const existingClient = await db
      .collection('clients')
      .findOne({ _id: new ObjectId(body.clientId) })

    if (!existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    const now = new Date()
    const pendingBilling: Omit<PendingBilling, '_id'> = {
      clientId: new ObjectId(body.clientId),
      clientName: existingClient.name, // Add the missing clientName property
      visitIds: (body.visitIds || []).map((id: string) => new ObjectId(id)),
      orderIds: (body.orderIds || []).map((id: string) => new ObjectId(id)),

      unbilledItems: body.unbilledItems || [],
      subtotal: body.subtotal || 0,
      taxAmount: body.taxAmount || 0,
      totalAmount: body.totalAmount || 0,

      status: body.status || 'draft',
      createdDate: now,
      billingFrequency: body.billingFrequency,
      nextBillingDate: body.nextBillingDate
        ? new Date(body.nextBillingDate)
        : undefined,

      // Required properties from PendingBilling type
      visitDate: body.visitDate ? new Date(body.visitDate) : now,
      serviceType: body.serviceType || 'general',
      amount: body.amount || body.totalAmount || 0,
      daysOverdue: body.daysOverdue || 0,

      notes: body.notes?.trim() || undefined,
      specialInstructions: body.specialInstructions?.trim() || undefined,

      createdAt: now,
      updatedAt: now,
    }

    const result = await db
      .collection('pending_billing')
      .insertOne(pendingBilling)

    return NextResponse.json(
      {
        success: true,
        message: 'Pending billing record created successfully',
        data: { billingId: result.insertedId },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/billing error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
