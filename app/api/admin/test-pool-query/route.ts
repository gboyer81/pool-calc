// Create this file: app/api/admin/test-pool-query/route.ts

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const { clientId, testType } = await request.json()

    const client = await clientPromise
    const db = client.db('poolCalc')

    const results = {}

    // Test 1: Raw client lookup
    if (clientId) {
      console.log('🔍 Testing with clientId:', clientId)

      // Check if client exists
      const clientExists = await db
        .collection('clients')
        .findOne({ _id: new ObjectId(clientId) })
      results.clientExists = !!clientExists
      results.clientData = clientExists
        ? { _id: clientExists._id, name: clientExists.name }
        : null

      // Test different query variations
      results.queries = {}

      // Query 1: Exact match with ObjectId
      const pools1 = await db
        .collection('pools')
        .find({
          clientId: new ObjectId(clientId),
        })
        .toArray()
      results.queries.objectIdQuery = {
        query: { clientId: 'new ObjectId(clientId)' },
        count: pools1.length,
        pools: pools1.map((p) => ({
          _id: p._id,
          name: p.name,
          clientId: p.clientId,
        })),
      }

      // Query 2: String comparison
      const pools2 = await db
        .collection('pools')
        .find({
          clientId: clientId,
        })
        .toArray()
      results.queries.stringQuery = {
        query: { clientId: 'clientId (as string)' },
        count: pools2.length,
        pools: pools2.map((p) => ({
          _id: p._id,
          name: p.name,
          clientId: p.clientId,
        })),
      }

      // Query 3: Check all pools to see their clientId formats
      const allPools = await db.collection('pools').find({}).limit(5).toArray()
      results.samplePools = allPools.map((p) => ({
        _id: p._id,
        name: p.name,
        clientId: p.clientId,
        clientIdType: typeof p.clientId,
        clientIdString: p.clientId?.toString(),
        matchesInput: p.clientId?.toString() === clientId,
      }))

      // Query 4: Find pools where clientId string matches
      const pools4 = await db.collection('pools').find().toArray()
      const matchingPools = pools4.filter(
        (p) => p.clientId?.toString() === clientId
      )
      results.queries.stringMatchQuery = {
        query: 'filter where clientId.toString() === clientId',
        count: matchingPools.length,
        pools: matchingPools.map((p) => ({
          _id: p._id,
          name: p.name,
          clientId: p.clientId,
        })),
      }
    }

    // Test 2: Database collections and counts
    const collections = await db.listCollections().toArray()
    const totalClients = await db.collection('clients').countDocuments()
    const totalPools = await db.collection('pools').countDocuments()

    results.databaseInfo = {
      collections: collections.map((c) => c.name),
      totalClients,
      totalPools,
      databaseName: 'poolCalc',
    }

    // Test 3: Sample data types
    const sampleClient = await db.collection('clients').findOne()
    const samplePool = await db.collection('pools').findOne()

    results.sampleData = {
      client: sampleClient
        ? {
            _id: sampleClient._id,
            name: sampleClient.name,
            idType: typeof sampleClient._id,
          }
        : null,
      pool: samplePool
        ? {
            _id: samplePool._id,
            name: samplePool.name,
            clientId: samplePool.clientId,
            clientIdType: typeof samplePool.clientId,
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('❌ Test query error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    )
  }
}
