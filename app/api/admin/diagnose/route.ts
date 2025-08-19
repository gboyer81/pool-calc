// Create this file: app/api/admin/diagnose/route.ts

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const client = await clientPromise

    // Check both possible database names
    const poolCalcDb = client.db('poolCalc')
    const poolServiceDb = client.db('pool-service')

    // Get collections from both databases
    const poolCalcCollections = await poolCalcDb.listCollections().toArray()
    const poolServiceCollections = await poolServiceDb
      .listCollections()
      .toArray()

    // Count documents in each
    const poolCalcClients = await poolCalcDb
      .collection('clients')
      .countDocuments()
    const poolCalcPools = await poolCalcDb.collection('pools').countDocuments()

    const poolServiceClients = await poolServiceDb
      .collection('clients')
      .countDocuments()
    const poolServicePools = await poolServiceDb
      .collection('pools')
      .countDocuments()

    // Get sample data to check ID formats
    const samplePoolCalcClients = await poolCalcDb
      .collection('clients')
      .find({})
      .limit(3)
      .toArray()
    const samplePoolCalcPools = await poolCalcDb
      .collection('pools')
      .find({})
      .limit(3)
      .toArray()

    const samplePoolServiceClients = await poolServiceDb
      .collection('clients')
      .find({})
      .limit(3)
      .toArray()
    const samplePoolServicePools = await poolServiceDb
      .collection('pools')
      .find({})
      .limit(3)
      .toArray()

    // Check for orphaned pools (pools with clientId that doesn't exist)
    const allClients = await poolCalcDb.collection('clients').find({}).toArray()
    const allPools = await poolCalcDb.collection('pools').find({}).toArray()

    const clientIds = new Set(allClients.map((c) => c._id.toString()))
    const orphanedPools = allPools.filter((pool) => {
      const poolClientId = pool.clientId?.toString()
      return poolClientId && !clientIds.has(poolClientId)
    })

    // Check for clientId type mismatches
    const poolsWithStringClientId = allPools.filter(
      (pool) => typeof pool.clientId === 'string'
    )
    const poolsWithObjectIdClientId = allPools.filter(
      (pool) => pool.clientId instanceof ObjectId
    )

    return NextResponse.json({
      success: true,
      diagnosis: {
        databases: {
          poolCalc: {
            collections: poolCalcCollections.map((c) => c.name),
            clients: poolCalcClients,
            pools: poolCalcPools,
            sampleClients: samplePoolCalcClients.map((c) => ({
              _id: c._id,
              name: c.name,
              idType: typeof c._id,
            })),
            samplePools: samplePoolCalcPools.map((p) => ({
              _id: p._id,
              name: p.name,
              clientId: p.clientId,
              clientIdType: typeof p.clientId,
            })),
          },
          poolService: {
            collections: poolServiceCollections.map((c) => c.name),
            clients: poolServiceClients,
            pools: poolServicePools,
            sampleClients: samplePoolServiceClients.map((c) => ({
              _id: c._id,
              name: c.name,
              idType: typeof c._id,
            })),
            samplePools: samplePoolServicePools.map((p) => ({
              _id: p._id,
              name: p.name,
              clientId: p.clientId,
              clientIdType: typeof p.clientId,
            })),
          },
        },
        dataIntegrity: {
          totalClients: allClients.length,
          totalPools: allPools.length,
          orphanedPools: orphanedPools.length,
          orphanedPoolsSample: orphanedPools.slice(0, 5).map((p) => ({
            _id: p._id,
            name: p.name,
            clientId: p.clientId,
            clientIdType: typeof p.clientId,
          })),
          poolsWithStringClientId: poolsWithStringClientId.length,
          poolsWithObjectIdClientId: poolsWithObjectIdClientId.length,
        },
        recommendations: [],
      },
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

// Create this file: app/api/admin/fix-pools/route.ts

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    const client = await clientPromise
    const db = client.db('poolCalc')

    switch (action) {
      case 'fix_client_ids':
        // Convert string clientIds to ObjectIds
        const poolsToFix = await db
          .collection('pools')
          .find({
            clientId: { $type: 'string' },
          })
          .toArray()

        let fixedCount = 0
        for (const pool of poolsToFix) {
          if (ObjectId.isValid(pool.clientId)) {
            await db
              .collection('pools')
              .updateOne(
                { _id: pool._id },
                { $set: { clientId: new ObjectId(pool.clientId) } }
              )
            fixedCount++
          }
        }

        return NextResponse.json({
          success: true,
          message: `Fixed ${fixedCount} pools with string clientIds`,
        })

      case 'delete_orphaned':
        // Delete pools that reference non-existent clients
        const allClients = await db.collection('clients').find({}).toArray()
        const clientIds = new Set(allClients.map((c) => c._id.toString()))

        const orphanedPools = await db.collection('pools').find({}).toArray()
        const poolsToDelete = orphanedPools.filter((pool) => {
          const poolClientId = pool.clientId?.toString()
          return poolClientId && !clientIds.has(poolClientId)
        })

        if (poolsToDelete.length > 0) {
          const deleteResult = await db.collection('pools').deleteMany({
            _id: { $in: poolsToDelete.map((p) => p._id) },
          })

          return NextResponse.json({
            success: true,
            message: `Deleted ${deleteResult.deletedCount} orphaned pools`,
          })
        } else {
          return NextResponse.json({
            success: true,
            message: 'No orphaned pools found',
          })
        }

      case 'delete_all_pools':
        // Nuclear option - delete all pools
        const deleteResult = await db.collection('pools').deleteMany({})

        return NextResponse.json({
          success: true,
          message: `Deleted all ${deleteResult.deletedCount} pools`,
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        )
    }
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
