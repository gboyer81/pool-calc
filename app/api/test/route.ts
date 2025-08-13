import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ApiResponse } from '@/types/user'

interface TestResponse extends ApiResponse {
  insertedId?: string
}

const dbName = process.env.DATABASE_NAME || 'dbName'

export async function GET(): Promise<NextResponse<TestResponse>> {
  try {
    const client = await clientPromise
    const db = client.db(dbName)

    // Test the connection
    await client.db('admin').command({ ping: 1 })

    // Try to insert a test document
    const collection = db.collection('test')
    const result = await collection.insertOne({
      message: 'Hello from MongoDB!',
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Connected to MongoDB successfully!',
      insertedId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error('MongoDB error:', error)

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
