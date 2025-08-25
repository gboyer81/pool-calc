// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import {
  InventoryItem,
  InventoryUsage,
  ApiResponse,
  InventoryResponse,
} from '@/types/pool-service'

// GET /api/inventory - Get inventory items and usage stats
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'usage' or 'items'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db('poolCalc')

    if (type === 'usage' && startDate && endDate) {
      // Get inventory usage from visits
      const usageStats = await getInventoryUsageStats(
        db,
        startDate,
        endDate,
        limit
      )
      return NextResponse.json({
        success: true,
        data: usageStats,
      })
    } else {
      // Get inventory items
      const inventory = await db
        .collection<InventoryItem>('inventory')
        .find({ isActive: true })
        .sort({ name: 1 })
        .limit(limit)
        .toArray()

      return NextResponse.json({
        success: true,
        data: inventory,
      })
    }
  } catch (error) {
    console.error('GET /api/inventory error:', error)
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

// POST /api/inventory - Add new inventory item
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    const inventoryItem: Partial<InventoryItem> = {
      name: body.name,
      type: body.type,
      category: body.category,
      currentStock: body.currentStock || 0,
      unit: body.unit,
      minStock: body.minStock || 0,
      maxStock: body.maxStock,
      costPerUnit: body.costPerUnit || 0,
      supplier: body.supplier,
      lastRestocked: body.lastRestocked
        ? new Date(body.lastRestocked)
        : new Date(),
      expirationDate: body.expirationDate
        ? new Date(body.expirationDate)
        : undefined,
      notes: body.notes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('inventory').insertOne(inventoryItem)

    return NextResponse.json(
      {
        success: true,
        message: 'Inventory item added successfully',
        data: { insertedId: result.insertedId },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/inventory error:', error)
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

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const url = new URL(request.url)
    const itemId = url.pathname.split('/').pop()

    if (!itemId || !ObjectId.isValid(itemId)) {
      return NextResponse.json(
        { success: false, error: 'Valid item ID is required' },
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

    const result = await db
      .collection('inventory')
      .updateOne({ _id: new ObjectId(itemId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Inventory item updated successfully',
    })
  } catch (error) {
    console.error('PUT /api/inventory error:', error)
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

// Helper function to get inventory usage stats from visits
async function getInventoryUsageStats(
  db: any,
  startDate: string,
  endDate: string,
  limit: number
): Promise<InventoryUsage[]> {
  const pipeline = [
    {
      $match: {
        status: 'completed',
        $or: [
          {
            actualDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
          },
          {
            $and: [
              { actualDate: { $exists: false } },
              {
                scheduledDate: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
                },
              },
            ],
          },
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
      },
    },
    {
      $project: {
        _id: 1,
        clientName: '$client.name',
        visitDate: { $ifNull: ['$actualDate', '$scheduledDate'] },
        chemicalsAdded: 1,
        'serviceDetails.partsUsed': 1,
      },
    },
  ]

  const visits = await db
    .collection('service_visits')
    .aggregate(pipeline)
    .toArray()

  // Aggregate usage by item
  const usageMap = new Map<string, any>()

  visits.forEach((visit: any) => {
    const visitDate = visit.visitDate

    // Process chemicals
    if (visit.chemicalsAdded) {
      visit.chemicalsAdded.forEach((chemical: any) => {
        const key = chemical.chemical
        if (!usageMap.has(key)) {
          usageMap.set(key, {
            _id: key,
            name: chemical.chemical,
            type: 'chemical',
            quantityUsed: 0,
            unit: chemical.unit,
            costPerUnit: 0,
            totalCost: 0,
            remainingStock: Math.floor(Math.random() * 100) + 20, // Mock data - replace with actual inventory lookup
            minStock: Math.floor(Math.random() * 20) + 5,
            lastUsed: visitDate,
            usageHistory: [],
          })
        }

        const item = usageMap.get(key)
        item.quantityUsed += chemical.amount
        item.totalCost += chemical.cost || 0
        item.costPerUnit = item.totalCost / item.quantityUsed
        item.lastUsed = new Date(
          Math.max(item.lastUsed.getTime(), visitDate.getTime())
        )
        item.usageHistory.push({
          visitId: visit._id,
          clientName: visit.clientName,
          quantity: chemical.amount,
          cost: chemical.cost || 0,
          date: visitDate,
        })
      })
    }

    // Process parts
    if (visit.serviceDetails?.partsUsed) {
      visit.serviceDetails.partsUsed.forEach((part: any) => {
        const key = part.partName
        if (!usageMap.has(key)) {
          usageMap.set(key, {
            _id: key,
            name: part.partName,
            type: 'part',
            quantityUsed: 0,
            unit: 'each',
            costPerUnit: 0,
            totalCost: 0,
            remainingStock: Math.floor(Math.random() * 50) + 10,
            minStock: Math.floor(Math.random() * 10) + 2,
            lastUsed: visitDate,
            usageHistory: [],
          })
        }

        const item = usageMap.get(key)
        item.quantityUsed += part.quantity
        item.totalCost += part.cost || 0
        item.costPerUnit = item.totalCost / item.quantityUsed
        item.lastUsed = new Date(
          Math.max(item.lastUsed.getTime(), visitDate.getTime())
        )
        item.usageHistory.push({
          visitId: visit._id,
          clientName: visit.clientName,
          quantity: part.quantity,
          cost: part.cost || 0,
          date: visitDate,
        })
      })
    }
  })

  // Convert to array and sort by total cost (highest first)
  const usageArray = Array.from(usageMap.values())
  usageArray.sort((a, b) => b.totalCost - a.totalCost)

  return usageArray.slice(0, limit)
}
