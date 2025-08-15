// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ApiResponse } from '@/types/user'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

interface Technician {
  _id?: any
  name: string
  email: string
  phone: string
  employeeId: string
  password: string
  role: 'technician' | 'supervisor' | 'admin'
  certifications: Array<{
    name: string
    issuer: string
    expirationDate?: Date
  }>
  serviceAreas: string[] // zip codes or regions
  assignedClients: any[] // ObjectIds of assigned clients
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse extends ApiResponse {
  technician?: {
    _id: string
    name: string
    email: string
    employeeId: string
    role: string
    assignedClients: string[]
  }
  token?: string
}

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Helper function to verify password (handles both plain text and hashed)
async function verifyPassword(
  plainPassword: string,
  storedPassword: string
): Promise<boolean> {
  // Check if the stored password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (
    storedPassword.startsWith('$2a$') ||
    storedPassword.startsWith('$2b$') ||
    storedPassword.startsWith('$2y$')
  ) {
    // It's a bcrypt hash, use bcrypt.compare
    return await bcrypt.compare(plainPassword, storedPassword)
  } else {
    // It's plain text (for demo purposes), do direct comparison
    return plainPassword === storedPassword
  }
}

// POST /api/auth/login - Technician login
export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
  try {
    const body: LoginRequest = await request.json()
    const { email, password } = body

    console.log('Login attempt:', { email, passwordLength: password.length })

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    // FIX: Use consistent database name 'PoolCalc' (capital P)
    const db = client.db('PoolCalc')

    // Find technician by email
    const technician = await db
      .collection<Technician>('technicians')
      .findOne({ email: email.toLowerCase().trim() })

    console.log('Technician found:', technician ? 'Yes' : 'No')
    if (technician) {
      console.log('Technician details:', {
        email: technician.email,
        isActive: technician.isActive,
        hasPassword: !!technician.password,
      })
    }

    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    if (!technician.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is deactivated',
        },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, technician.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
        },
        { status: 401 }
      )
    }

    // Create JWT token
    const token = jwt.sign(
      {
        technicianId: technician._id.toString(),
        email: technician.email,
        role: technician.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Update last login
    await db.collection('technicians').updateOne(
      { _id: technician._id },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token: token,
      technician: {
        _id: technician._id.toString(),
        name: technician.name,
        email: technician.email,
        employeeId: technician.employeeId,
        role: technician.role,
        assignedClients: technician.assignedClients.map((id) => id.toString()),
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        success: false,
        error: 'Login failed: ' + errorMessage,
      },
      { status: 500 }
    )
  }
}
