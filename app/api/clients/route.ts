// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ApiResponse } from '@/types/user'
import { authenticateRequest, AuthenticatedUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// Client interface - matches what the component expects
interface Client {
  _id?: any
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  serviceDay?: string // 'monday', 'tuesday', etc.
  preferredTimeSlot?: string // 'morning', 'afternoon', 'evening'
  specialInstructions?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface ClientInput {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  serviceDay?: string
  preferredTimeSlot?: string
  specialInstructions?: string
}

interface ClientsResponse extends ApiResponse {
  clients?: Client[]
}

interface CreateClientResponse extends ApiResponse {
  clientId?: any
}

// GET /api/clients - Get all clients (filtered by technician assignment)
export async function GET(
  request: NextRequest
): Promise<NextResponse<ClientsResponse>> {
  try {
    // Authenticate the request
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const serviceFrequency = searchParams.get('serviceFrequency')
    const serviceDay = searchParams.get('serviceDay')
    const isActive = searchParams.get('isActive')

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Build query filters
    let query: any = {}

    // Filter by technician assignment (unless admin/supervisor)
    if (user.role === 'technician') {
      query._id = { $in: user.assignedClients.map((id) => new ObjectId(id)) }
    }

    if (serviceFrequency && serviceFrequency !== 'all') {
      query.serviceFrequency = serviceFrequency
    }
    if (serviceDay && serviceDay !== 'all') {
      query.serviceDay = serviceDay
    }
    if (isActive !== null) {
      query.isActive = isActive !== 'false'
    }

    const clients = await db
      .collection<Client>('clients')
      .find(query)
      .sort({ name: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      clients: clients,
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

// POST /api/clients - Create a new client
export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateClientResponse>> {
  try {
    const body: ClientInput = await request.json()
    const {
      name,
      email,
      phone,
      address,
      serviceFrequency,
      serviceDay,
      preferredTimeSlot,
      specialInstructions,
    } = body

    // Basic validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, email, and phone are required',
        },
        { status: 400 }
      )
    }

    if (
      !address?.street ||
      !address?.city ||
      !address?.state ||
      !address?.zipCode
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complete address is required',
        },
        { status: 400 }
      )
    }

    if (!serviceFrequency) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service frequency is required',
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
    const db = client.db('poolCalc')

    // Check if client already exists
    const existingClient = await db.collection<Client>('clients').findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
    })

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client with this email or phone already exists',
        },
        { status: 400 }
      )
    }

    // Insert new client
    const now = new Date()
    const result = await db.collection('clients').insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
      },
      serviceFrequency,
      serviceDay: serviceDay?.toLowerCase(),
      preferredTimeSlot: preferredTimeSlot?.toLowerCase(),
      specialInstructions: specialInstructions?.trim() || '',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Client created successfully',
        clientId: result.insertedId,
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
