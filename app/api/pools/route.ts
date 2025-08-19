// app/api/pools/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'

// Pool interface matching your types
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
  equipment?: {
    filter?: {
      type?: 'sand' | 'cartridge' | 'de'
      model?: string
    }
    pump?: {
      model?: string
      horsepower?: number
    }
    heater?: {
      type?: 'gas' | 'electric' | 'heat-pump'
      model?: string
    }
    saltSystem?: {
      model?: string
      targetSalt?: number
    }
    automation?: {
      system?: string
      model?: string
    }
  }
  targetLevels?: {
    ph?: { min: number; max: number; target: number }
    totalChlorine?: { min: number; max: number; target: number }
    freeChlorine?: { min: number; max: number; target: number }
    totalAlkalinity?: { min: number; max: number; target: number }
    calciumHardness?: { min: number; max: number; target: number }
    cyanuricAcid?: { min: number; max: number; target: number }
    salt?: { min: number; max: number; target: number }
  }
  notes?: string
}

interface PoolsResponse extends ApiResponse {
  pools?: Pool[]
}

interface CreatePoolResponse extends ApiResponse {
  poolId?: string
  pool?: Pool
}

// GET /api/pools - Get all pools or pools for a specific client
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db('poolCalc')
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    let query: any = { isActive: true }
    if (clientId) {
      query = { ...query, clientId: new ObjectId(clientId) }
    }

    const pools = await db.collection('pools').find(query).toArray()

    const response: PoolsResponse = {
      success: true,
      pools: pools as Pool[],
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching pools:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pools' },
      { status: 500 }
    )
  }
}

// POST /api/pools - Create new pool
export async function POST(request: NextRequest) {
  try {
    const body: PoolInput = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    // Calculate volume
    let volume = 0
    const { shape, dimensions } = body
    const avgDepth = dimensions.avgDepth

    switch (shape) {
      case 'rectangular':
        if (dimensions.length && dimensions.width) {
          volume = dimensions.length * dimensions.width * avgDepth * 7.48
        }
        break
      case 'circular':
        if (dimensions.diameter) {
          const radius = dimensions.diameter / 2
          volume = Math.PI * radius * radius * avgDepth * 7.48
        }
        break
      case 'oval':
        if (dimensions.length && dimensions.width) {
          volume =
            Math.PI *
            (dimensions.length / 2) *
            (dimensions.width / 2) *
            avgDepth *
            7.48
        }
        break
      case 'kidney':
        if (dimensions.length && dimensions.width) {
          // Approximate kidney shape as 0.8 of oval
          volume =
            0.8 *
            Math.PI *
            (dimensions.length / 2) *
            (dimensions.width / 2) *
            avgDepth *
            7.48
        }
        break
      case 'freeform':
        // Require manual volume input for freeform pools
        volume = 0
        break
    }

    // Set default target levels if not provided
    const defaultTargets: Pool['targetLevels'] = {
      ph: { min: 7.2, max: 7.6, target: 7.4 },
      totalChlorine: { min: 1.0, max: 3.0, target: 2.0 },
      freeChlorine: { min: 1.0, max: 3.0, target: 2.0 },
      totalAlkalinity: { min: 80, max: 120, target: 100 },
      calciumHardness: { min: 200, max: 400, target: 300 },
      cyanuricAcid: { min: 30, max: 50, target: 40 },
    }

    // Add salt targets if salt system is present
    if (body.equipment?.saltSystem?.model) {
      defaultTargets.salt = {
        min: 2700,
        max: 3400,
        target: body.equipment.saltSystem.targetSalt || 3200,
      }
    }

    const poolData: Pool = {
      clientId: new ObjectId(body.clientId),
      name: body.name,
      type: body.type,
      shape: body.shape,
      dimensions: body.dimensions,
      volume: {
        gallons: Math.round(volume),
        calculatedAt: new Date(),
      },
      equipment: {
        filter: body.equipment?.filter
          ? {
              ...body.equipment.filter,
              type: body.equipment.filter.type || 'sand',
            }
          : { type: 'sand' },
        pump: body.equipment?.pump || {},
        heater:
          body.equipment?.heater && body.equipment.heater.type
            ? {
                ...body.equipment.heater,
                type: body.equipment.heater.type,
              }
            : undefined,
        saltSystem: body.equipment?.saltSystem
          ? {
              ...body.equipment.saltSystem,
              targetSalt: body.equipment.saltSystem.targetSalt || 3200,
            }
          : undefined,
        automation: body.equipment?.automation,
      },
      targetLevels: { ...defaultTargets, ...body.targetLevels },
      notes: body.notes || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('pools').insertOne(poolData)

    const response: CreatePoolResponse = {
      success: true,
      message: 'Pool created successfully',
      poolId: result.insertedId.toString(),
      pool: { ...poolData, _id: result.insertedId },
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating pool:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create pool' },
      { status: 500 }
    )
  }
}
