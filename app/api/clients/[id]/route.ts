// app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'

// Client interface
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
  }
  serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  serviceDay?: string
  preferredTimeSlot?: string
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

interface ClientResponse extends ApiResponse {
  client?: Client
}

// GET /api/clients/[id] - Get a specific client
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ClientResponse>> {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('PoolCalc')
    const clientData = await db
      .collection<Client>('clients')
      .findOne({ _id: new ObjectId(id) })

    if (!clientData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      client: clientData,
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

// PUT /api/clients/[id] - Update a specific client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID format',
        },
        { status: 400 }
      )
    }

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

    // Phone validation
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
    const db = client.db('PoolCalc')

    // Check if email or phone is already taken by another client
    const existingClient = await db.collection<Client>('clients').findOne({
      $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }],
      _id: { $ne: new ObjectId(id) },
    })

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email or phone is already taken by another client',
        },
        { status: 400 }
      )
    }

    const result = await db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
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
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
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

// DELETE /api/clients/[id] - Delete a specific client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('PoolCalc')

    // Check if client has any pools first
    const pools = await db
      .collection('pools')
      .find({ clientId: new ObjectId(id) })
      .toArray()
    if (pools.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete client with existing pools. Please delete pools first.',
        },
        { status: 400 }
      )
    }

    // Check if client has any service visits
    const visits = await db
      .collection('service_visits')
      .find({ clientId: new ObjectId(id) })
      .toArray()
    if (visits.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete client with service history. Consider deactivating instead.',
        },
        { status: 400 }
      )
    }

    const result = await db
      .collection<Client>('clients')
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
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

// PATCH /api/clients/[id] - Toggle client active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const { id } = await params
    const { isActive } = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid client ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('PoolCalc')

    const result = await db.collection<Client>('clients').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isActive: Boolean(isActive),
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Client not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Client ${isActive ? 'activated' : 'deactivated'} successfully`,
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
