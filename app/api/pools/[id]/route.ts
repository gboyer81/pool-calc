// app/api/pools/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'

// Pool interface (copy from your existing pools/route.ts)
interface Pool {
  _id?: any
  clientId: any
  name: string
  type: 'residential' | 'commercial'
  shape: 'rectangular' | 'circular' | 'oval' | 'kidney' | 'freeform'
  dimensions: {
    length?: number
    width?: number
    diameter?: number
    avgDepth: number
  }
  volume: {
    gallons: number
    calculatedAt: Date
  }
  equipment: {
    filter: {
      type: 'sand' | 'cartridge' | 'de'
      model?: string
      lastCleaned?: Date
    }
    pump: {
      model?: string
      horsepower?: number
    }
    heater?: {
      type: 'gas' | 'electric' | 'heat-pump'
      model?: string
    }
    saltSystem?: {
      model?: string
      targetSalt: number
    }
    automation?: {
      system?: string
      model?: string
    }
  }
  targetLevels: {
    ph: { min: number; max: number; target: number }
    totalChlorine: { min: number; max: number; target: number }
    freeChlorine: { min: number; max: number; target: number }
    totalAlkalinity: { min: number; max: number; target: number }
    calciumHardness: { min: number; max: number; target: number }
    cyanuricAcid: { min: number; max: number; target: number }
    salt?: { min: number; max: number; target: number }
  }
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface PoolInput {
  name?: string
  type?: 'residential' | 'commercial'
  shape?: 'rectangular' | 'circular' | 'oval' | 'kidney' | 'freeform'
  dimensions?: {
    length?: number
    width?: number
    diameter?: number
    avgDepth: number
  }
  volume?: {
    gallons: number
  }
  equipment?: {
    filter?: {
      type: 'sand' | 'cartridge' | 'de'
      model?: string
    }
    pump?: {
      model?: string
      horsepower?: number
    }
    heater?: {
      type: 'gas' | 'electric' | 'heat-pump'
      model?: string
    }
    saltSystem?: {
      model?: string
      targetSalt: number
    }
  }
  targetLevels?: {
    ph?: { min: number; max: number; target: number }
    freeChlorine?: { min: number; max: number; target: number }
    totalAlkalinity?: { min: number; max: number; target: number }
    calciumHardness?: { min: number; max: number; target: number }
  }
  notes?: string
  isActive?: boolean
}

interface PoolResponse extends ApiResponse {
  pool?: Pool
}

// GET /api/pools/[id] - Get a specific pool
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<PoolResponse>> {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pool ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    const pool = await db
      .collection<Pool>('pools')
      .findOne({ _id: new ObjectId(id) })

    if (!pool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      pool: pool,
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

// PUT /api/pools/[id] - Update a specific pool
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params
    const body: PoolInput = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pool ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Check if pool exists
    const existingPool = await db
      .collection<Pool>('pools')
      .findOne({ _id: new ObjectId(id) })

    if (!existingPool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool not found',
        },
        { status: 404 }
      )
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Update fields if provided
    if (body.name !== undefined) {
      updateData.name = body.name.trim()
    }
    if (body.type !== undefined) {
      updateData.type = body.type
    }
    if (body.shape !== undefined) {
      updateData.shape = body.shape
    }
    if (body.dimensions !== undefined) {
      updateData.dimensions = body.dimensions
    }
    if (body.volume !== undefined) {
      updateData.volume = {
        gallons: body.volume.gallons,
        calculatedAt: new Date(),
      }
    }
    if (body.equipment !== undefined) {
      updateData.equipment = {
        ...existingPool.equipment,
        ...body.equipment,
      }
    }
    if (body.targetLevels !== undefined) {
      updateData.targetLevels = {
        ...existingPool.targetLevels,
        ...body.targetLevels,
      }
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes.trim()
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive
    }

    // Validate required fields if they're being updated
    if (
      body.dimensions &&
      (!body.dimensions.avgDepth || body.dimensions.avgDepth <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Average depth must be greater than 0',
        },
        { status: 400 }
      )
    }

    if (body.volume && (!body.volume.gallons || body.volume.gallons <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool volume must be greater than 0',
        },
        { status: 400 }
      )
    }

    // Check for duplicate pool name within the same client if name is being updated
    if (body.name && body.name.trim() !== existingPool.name) {
      const duplicatePool = await db.collection<Pool>('pools').findOne({
        clientId: existingPool.clientId,
        name: body.name.trim(),
        _id: { $ne: new ObjectId(id) },
      })

      if (duplicatePool) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pool with this name already exists for this client',
          },
          { status: 400 }
        )
      }
    }

    // Update the pool
    const result = await db
      .collection<Pool>('pools')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pool updated successfully',
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

// DELETE /api/pools/[id] - Delete a specific pool
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pool ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Check if pool has any service visits
    const visits = await db
      .collection('service_visits')
      .find({ poolId: new ObjectId(id) })
      .toArray()

    if (visits.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete pool with service history. Consider deactivating instead.',
        },
        { status: 400 }
      )
    }

    const result = await db
      .collection<Pool>('pools')
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pool deleted successfully',
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
