// app/api/technicians/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ApiResponse } from '@/types/user'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

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

interface TechnicianInput {
  name: string
  email: string
  phone: string
  employeeId: string
  password: string
  role: 'technician' | 'supervisor' | 'admin'
  serviceAreas?: string[]
  assignedClients?: string[]
}

interface TechniciansResponse extends ApiResponse {
  technicians?: Omit<Technician, 'password'>[]
}

interface CreateTechnicianResponse extends ApiResponse {
  technicianId?: any
}

// GET /api/technicians - Get all technicians (admin only)
export async function GET(
  request: NextRequest
): Promise<NextResponse<TechniciansResponse>> {
  try {
    // TODO: Add JWT verification middleware for admin access

    const client = await clientPromise
    // FIX: Use consistent database name 'PoolCalc' (capital P)
    const db = client.db('PoolCalc')

    const technicians = await db
      .collection<Technician>('technicians')
      .find({}, { projection: { password: 0 } }) // Exclude password from results
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      technicians: technicians,
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

// POST /api/technicians - Create a new technician (admin only)
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateTechnicianResponse>> {
  try {
    // TODO: Add JWT verification middleware for admin access

    const body: TechnicianInput = await request.json()
    const {
      name,
      email,
      phone,
      employeeId,
      password,
      role,
      serviceAreas,
      assignedClients,
    } = body

    // Basic validation
    if (!name || !email || !phone || !employeeId || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Name, email, phone, employee ID, password, and role are required',
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

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid phone number',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    // FIX: Use consistent database name 'PoolCalc' (capital P)
    const db = client.db('PoolCalc')

    // Check if technician already exists
    const existingTechnician = await db
      .collection<Technician>('technicians')
      .findOne({
        $or: [
          { email: email.toLowerCase().trim() },
          { employeeId: employeeId.trim() },
        ],
      })

    if (existingTechnician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician with this email or employee ID already exists',
        },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Convert assignedClients to ObjectIds if provided
    const clientObjectIds = assignedClients
      ? assignedClients
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id))
      : []

    // Insert new technician
    const now = new Date()
    const result = await db.collection('technicians').insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      employeeId: employeeId.trim(),
      password: hashedPassword,
      role,
      certifications: [],
      serviceAreas: serviceAreas || [],
      assignedClients: clientObjectIds,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Technician created successfully',
        technicianId: result.insertedId,
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
