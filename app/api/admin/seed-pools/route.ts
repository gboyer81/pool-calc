// Create this file: app/api/admin/seed-pools/route.ts

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST() {
  try {
    const client = await clientPromise
    const db = client.db('poolCalc')

    // Get existing active clients
    const clients = await db
      .collection('clients')
      .find({ isActive: true })
      .toArray()

    if (clients.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active clients found. Please add clients first.',
      })
    }

    const now = new Date()
    const poolsToCreate = []

    // Create 1 pool per client
    for (const client of clients) {
      // Check if client already has pools
      const existingPools = await db.collection('pools').countDocuments({
        clientId: client._id,
      })

      if (existingPools === 0) {
        const pool = {
          clientId: client._id,
          name: 'Main Pool',
          type: 'residential',
          shape: 'rectangular',
          dimensions: {
            avgDepth: 5.5,
          },
          volume: {
            gallons: 20000 + Math.floor(Math.random() * 10000 - 5000), // 15k-25k gallons
            calculatedAt: now,
          },
          equipment: {
            filter: {
              type: 'sand',
              model: 'Standard Sand Filter',
            },
            pump: {
              model: 'Pool Pump',
              horsepower: 1.5,
            },
          },
          targetLevels: {
            ph: { min: 7.2, max: 7.6, target: 7.4 },
            totalChlorine: { min: 1.0, max: 3.0, target: 2.0 },
            freeChlorine: { min: 1.0, max: 3.0, target: 2.0 },
            totalAlkalinity: { min: 80, max: 120, target: 100 },
            calciumHardness: { min: 200, max: 400, target: 250 },
            cyanuricAcid: { min: 30, max: 80, target: 50 },
          },
          notes: `Sample pool for ${client.name}`,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        }

        poolsToCreate.push(pool)
      }
    }

    if (poolsToCreate.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'All clients already have pools assigned',
      })
    }

    // Insert pools
    const result = await db.collection('pools').insertMany(poolsToCreate)

    return NextResponse.json({
      success: true,
      message: `Created ${result.insertedCount} sample pools for ${result.insertedCount} clients`,
      poolsCreated: result.insertedCount,
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
