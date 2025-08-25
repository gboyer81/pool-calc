// app/api/billing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  Invoice,
  PendingBilling,
  ApiResponse,
  BillingResponse,
} from '@/types/pool-service'

// GET /api/billing - Get billing information
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'pending', 'overdue', 'invoices'
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db('poolCalc')

    if (type === 'pending' || type === 'overdue') {
      // Get pending billing from visits
      const pendingBills = await getPendingBilling(db, type, limit)
      return NextResponse.json({
        success: true,
        data: pendingBills,
      })
    } else {
      // Get invoices
      let query: any = {}

      if (clientId && ObjectId.isValid(clientId)) {
        query.clientId = new ObjectId(clientId)
      }

      if (status) {
        query.paymentStatus = status
      }

      const invoices = await db
        .collection<Invoice>('invoices')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()

      return NextResponse.json({
        success: true,
        data: invoices,
      })
    }
  } catch (error) {
    console.error('GET /api/billing error:', error)
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

// POST /api/billing - Create new invoice
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    // Generate invoice number
    const invoiceCount = await db.collection('invoices').countDocuments()
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(
      invoiceCount + 1
    ).padStart(4, '0')}`

    const invoice: Partial<Invoice> = {
      invoiceNumber,
      clientId: new ObjectId(body.clientId),
      visitIds: body.visitIds?.map((id: string) => new ObjectId(id)),
      orderIds: body.orderIds?.map((id: string) => new ObjectId(id)),
      lineItems: body.lineItems || [],
      subtotal: body.subtotal || 0,
      taxAmount: body.taxAmount || 0,
      totalAmount: body.totalAmount || 0,
      terms: body.terms || 'Net 30',
      dueDate: body.dueDate
        ? new Date(body.dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentStatus: 'draft',
      notes: body.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('invoices').insertOne(invoice)

    // Update related visits with invoice number
    if (body.visitIds?.length > 0) {
      await db.collection('service_visits').updateMany(
        { _id: { $in: body.visitIds.map((id: string) => new ObjectId(id)) } },
        {
          $set: {
            'billing.invoiceNumber': invoiceNumber,
            'billing.paymentStatus': 'sent',
            updatedAt: new Date(),
          },
        }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Invoice created successfully',
        data: {
          insertedId: result.insertedId,
          invoiceNumber,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/billing error:', error)
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

// PUT /api/billing/[id] - Update invoice
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const url = new URL(request.url)
    const invoiceId = url.pathname.split('/').pop()

    if (!invoiceId || !ObjectId.isValid(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'Valid invoice ID is required' },
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
    if (updateData.paidDate) {
      updateData.paidDate = new Date(updateData.paidDate)
    }

    const result = await db
      .collection('invoices')
      .updateOne({ _id: new ObjectId(invoiceId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // If payment status changed to paid, update related visits
    if (updateData.paymentStatus === 'paid') {
      const invoice = await db
        .collection('invoices')
        .findOne({ _id: new ObjectId(invoiceId) })
      if (invoice && invoice.visitIds?.length > 0) {
        await db.collection('service_visits').updateMany(
          { _id: { $in: invoice.visitIds } },
          {
            $set: {
              'billing.paymentStatus': 'paid',
              'billing.paidDate': updateData.paidDate || new Date(),
              updatedAt: new Date(),
            },
          }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Invoice updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/billing error:', error)
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

// Helper function to get pending billing from visits
async function getPendingBilling(
  db: any,
  type: string,
  limit: number
): Promise<PendingBilling[]> {
  const pipeline = [
    {
      $match: {
        status: 'completed',
        $or: [
          { 'billing.paymentStatus': 'pending' },
          { 'billing.paymentStatus': 'overdue' },
          { 'billing.paymentStatus': { $exists: false } },
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
      $addFields: {
        client: { $arrayElemAt: ['$client', 0] },
        visitDate: { $ifNull: ['$actualDate', '$scheduledDate'] },
      },
    },
    {
      $project: {
        _id: 1,
        clientName: '$client.name',
        clientId: { $toString: '$clientId' },
        visitId: { $toString: '$_id' },
        visitDate: 1,
        serviceType: 1,
        amount: { $ifNull: ['$billing.totalAmount', 0] },
        status: { $ifNull: ['$billing.paymentStatus', 'pending'] },
        invoiceNumber: {
          $ifNull: [
            '$billing.invoiceNumber',
            {
              $concat: ['INV-', { $toString: '$_id' }],
            },
          ],
        },
        billing: 1,
        chemicalsAdded: 1,
        'serviceDetails.partsUsed': 1,
        'serviceDetails.laborHours': 1,
        'serviceDetails.laborRate': 1,
      },
    },
  ]

  const visits = await db
    .collection('service_visits')
    .aggregate(pipeline)
    .toArray()

  const pendingBills: PendingBilling[] = visits.map((visit: any) => {
    const visitDate = new Date(visit.visitDate)
    const daysSince = Math.floor(
      (Date.now() - visitDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Generate line items from visit data
    const lineItems: any[] = []

    // Add labor if present
    if (visit.serviceDetails?.laborHours && visit.serviceDetails?.laborRate) {
      lineItems.push({
        type: 'labor',
        description: `Labor - ${visit.serviceType.replace('-', ' ')}`,
        quantity: visit.serviceDetails.laborHours,
        unitPrice: visit.serviceDetails.laborRate,
        totalPrice:
          visit.serviceDetails.laborHours * visit.serviceDetails.laborRate,
      })
    }

    // Add chemicals
    if (visit.chemicalsAdded) {
      visit.chemicalsAdded.forEach((chemical: any) => {
        lineItems.push({
          type: 'chemical',
          description: chemical.chemical,
          quantity: chemical.amount,
          unitPrice: (chemical.cost || 0) / chemical.amount,
          totalPrice: chemical.cost || 0,
        })
      })
    }

    // Add parts
    if (visit.serviceDetails?.partsUsed) {
      visit.serviceDetails.partsUsed.forEach((part: any) => {
        lineItems.push({
          type: 'part',
          description: part.partName,
          quantity: part.quantity,
          unitPrice: (part.cost || 0) / part.quantity,
          totalPrice: part.cost || 0,
        })
      })
    }

    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    )

    return {
      _id: visit._id,
      clientName: visit.clientName,
      clientId: visit.clientId,
      visitId: visit.visitId,
      visitDate: visitDate,
      serviceType: visit.serviceType,
      amount: visit.amount || totalAmount,
      status:
        visit.status === 'pending' && daysSince > 30 ? 'overdue' : visit.status,
      invoiceNumber:
        visit.invoiceNumber || `INV-${visit._id.toString().slice(-8)}`,
      daysOverdue: visit.status === 'overdue' || daysSince > 30 ? daysSince : 0,
      lineItems,
    }
  })

  // Filter by type if specified
  let filteredBills = pendingBills
  if (type === 'overdue') {
    filteredBills = pendingBills.filter(
      (bill) => bill.status === 'overdue' || bill.daysOverdue > 30
    )
  } else if (type === 'pending') {
    filteredBills = pendingBills.filter(
      (bill) => bill.status === 'pending' && bill.daysOverdue <= 30
    )
  }

  // Sort by days overdue (highest first), then by amount
  filteredBills.sort((a, b) => {
    if (a.daysOverdue !== b.daysOverdue) {
      return b.daysOverdue - a.daysOverdue
    }
    return b.amount - a.amount
  })

  return filteredBills.slice(0, limit)
}
