// app/api/pools/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'

// Pool interface
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
  clientId: string
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
}

interface PoolsResponse extends ApiResponse {
  pools?: Pool[]
}

interface CreatePoolResponse extends ApiResponse {
  poolId?: any
}

// GET /api/pools - Get all pools or pools for a specific client
export async function GET(
  request: NextRequest
): Promise<NextResponse<PoolsResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const isActive = searchParams.get('isActive')

    const client = await clientPromise
    const db = client.db('PoolCalc')

    // Build query filters
    let query: any = {}
    if (clientId) {
      if (!ObjectId.isValid(clientId)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid client ID format',
          },
          { status: 400 }
        )
      }
      query.clientId = new ObjectId(clientId)
    }
    if (isActive !== null) {
      query.isActive = isActive !== 'false'
    }

    const pools = await db
      .collection<Pool>('pools')
      .find(query)
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      pools: pools,
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

// POST /api/pools - Create a new pool
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreatePoolResponse>> {
  try {
    const body: PoolInput = await request.json()
    const {
      clientId,
      name,
      type,
      shape,
      dimensions,
      volume,
      equipment,
      targetLevels,
      notes,
    } = body

    // Basic validation
    if (!clientId || !name || !type || !shape || !dimensions || !volume) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Client ID, name, type, shape, dimensions, and volume are required',
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

    if (!dimensions.avgDepth || dimensions.avgDepth <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Average depth must be greater than 0',
        },
        { status: 400 }
      )
    }

    if (!volume.gallons || volume.gallons <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool volume must be greater than 0',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('PoolCalc')

    // Verify client exists
    const clientExists = await db
      .collection('clients')
      .findOne({ _id: new ObjectId(clientId) })
    if (!clientExists) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    // Check if pool name already exists for this client
    const existingPool = await db.collection<Pool>('pools').findOne({
      clientId: new ObjectId(clientId),
      name: name.trim(),
    })

    if (existingPool) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pool with this name already exists for this client',
        },
        { status: 400 }
      )
    }

    // Set default target levels if not provided
    const defaultTargetLevels: {
      ph: { min: number; max: number; target: number }
      totalChlorine: { min: number; max: number; target: number }
      freeChlorine: { min: number; max: number; target: number }
      totalAlkalinity: { min: number; max: number; target: number }
      calciumHardness: { min: number; max: number; target: number }
      cyanuricAcid: { min: number; max: number; target: number }
      salt?: { min: number; max: number; target: number }
    } = {
      ph: { min: 7.2, max: 7.6, target: 7.4 },
      totalChlorine: { min: 1.0, max: 3.0, target: 2.0 },
      freeChlorine: { min: 1.0, max: 3.0, target: 2.0 },
      totalAlkalinity: { min: 80, max: 120, target: 100 },
      calciumHardness: { min: 200, max: 400, target: 250 },
      cyanuricAcid: { min: 30, max: 80, target: 50 },
    }

    // Add salt targets if salt system is present
    if (equipment?.saltSystem) {
      defaultTargetLevels.salt = {
        min: equipment.saltSystem.targetSalt - 400,
        max: equipment.saltSystem.targetSalt + 400,
        target: equipment.saltSystem.targetSalt,
      }
    }

    // Insert new pool
    const now = new Date()
    const result = await db.collection('pools').insertOne({
      clientId: new ObjectId(clientId),
      name: name.trim(),
      type,
      shape,
      dimensions,
      volume: {
        gallons: volume.gallons,
        calculatedAt: now,
      },
      equipment: {
        filter: {
          type: equipment?.filter?.type || 'sand',
          model: equipment?.filter?.model || '',
        },
        pump: {
          model: equipment?.pump?.model || '',
          horsepower: equipment?.pump?.horsepower || 1,
        },
        heater: equipment?.heater
          ? {
              type: equipment.heater.type,
              model: equipment.heater.model || '',
            }
          : undefined,
        saltSystem: equipment?.saltSystem
          ? {
              model: equipment.saltSystem.model || '',
              targetSalt: equipment.saltSystem.targetSalt || 3200,
            }
          : undefined,
      },
      targetLevels: { ...defaultTargetLevels, ...targetLevels },
      notes: notes?.trim() || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Pool created successfully',
        poolId: result.insertedId,
      },
      { status: 201 }
    )
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
