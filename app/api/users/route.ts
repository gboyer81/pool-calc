import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import {
  User,
  UserInput,
  UsersResponse,
  CreateUserResponse,
} from '@/types/user'

// GET /api/users - Get all users
export async function GET(): Promise<NextResponse<UsersResponse>> {
  try {
    const client = await clientPromise
    const db = client.db('myapp')
    const users = await db.collection<User>('users').find({}).toArray()

    return NextResponse.json({
      success: true,
      users: users,
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

// POST /api/users - Create a new user
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateUserResponse>> {
  try {
    const body: UserInput = await request.json()
    const { name, email } = body

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and email are required',
        },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid email address',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('myapp')

    // Check if user already exists
    const existingUser = await db.collection<User>('users').findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'User with this email already exists',
        },
        { status: 400 }
      )
    }

    // Insert new user
    const now = new Date()
    const result = await db.collection('users').insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        userId: result.insertedId,
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
