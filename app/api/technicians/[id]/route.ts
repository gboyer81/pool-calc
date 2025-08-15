// app/api/technicians/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { ApiResponse } from '@/types/user'
import { authenticateRequest } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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
  name?: string
  email?: string
  phone?: string
  employeeId?: string
  password?: string
  role?: 'technician' | 'supervisor' | 'admin'
  serviceAreas?: string[]
  assignedClients?: string[]
  isActive?: boolean
}

interface TechnicianResponse extends ApiResponse {
  technician?: Omit<Technician, 'password'>
}

// GET /api/technicians/[id] - Get a specific technician
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<TechnicianResponse>> {
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

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid technician ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    const technician = await db.collection<Technician>('technicians').findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } } // Exclude password from results
    )

    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found',
        },
        { status: 404 }
      )
    }

    // Only allow access to own data for regular technicians
    if (
      user.role === 'technician' &&
      user.technicianId !== technician._id.toString()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      technician,
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

// PUT /api/technicians/[id] - Update a specific technician
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
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

    const { id } = await params
    const body: TechnicianInput = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid technician ID format',
        },
        { status: 400 }
      )
    }

    // Only allow admins and supervisors to update other technicians
    // Technicians can only update their own profile (limited fields)
    if (user.role === 'technician' && user.technicianId !== id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
        },
        { status: 403 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Build update object based on user role and provided fields
    const updateData: any = {
      updatedAt: new Date(),
    }

    // Fields that technicians can update for themselves
    const allowedFieldsForTechnician = ['name', 'phone', 'password']

    // Fields that admins/supervisors can update
    const allowedFieldsForAdmin = [
      'name',
      'email',
      'phone',
      'employeeId',
      'password',
      'role',
      'serviceAreas',
      'assignedClients',
      'isActive',
    ]

    const allowedFields =
      user.role === 'technician'
        ? allowedFieldsForTechnician
        : allowedFieldsForAdmin

    // Process each field in the request body
    for (const [key, value] of Object.entries(body)) {
      if (
        allowedFields.includes(key) &&
        value !== undefined &&
        value !== null
      ) {
        if (
          key === 'password' &&
          typeof value === 'string' &&
          value.length >= 8
        ) {
          // Hash password if provided
          updateData.password = await bcrypt.hash(value, 12)
        } else if (key === 'assignedClients' && Array.isArray(value)) {
          // Convert client IDs to ObjectIds
          try {
            updateData.assignedClients = value.map((id) => new ObjectId(id))
          } catch (err) {
            return NextResponse.json(
              {
                success: false,
                error: 'Invalid client ID format in assigned clients',
              },
              { status: 400 }
            )
          }
        } else if (key === 'email' && typeof value === 'string') {
          // Check if email is already taken by another technician
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            return NextResponse.json(
              {
                success: false,
                error: 'Please provide a valid email address',
              },
              { status: 400 }
            )
          }

          const existingTechnician = await db
            .collection<Technician>('technicians')
            .findOne({
              email: value.toLowerCase().trim(),
              _id: { $ne: new ObjectId(id) },
            })

          if (existingTechnician) {
            return NextResponse.json(
              {
                success: false,
                error: 'Email is already taken by another technician',
              },
              { status: 400 }
            )
          }

          updateData.email = value.toLowerCase().trim()
        } else if (key !== 'password') {
          updateData[key] = value
        }
      }
    }

    // Only proceed if there are fields to update
    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid fields provided for update',
        },
        { status: 400 }
      )
    }

    const result = await db
      .collection<Technician>('technicians')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Technician updated successfully',
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

// PATCH /api/technicians/[id] - Toggle technician active status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
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

    // Only admins and supervisors can toggle status
    if (!['admin', 'supervisor'].includes(user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient permissions',
        },
        { status: 403 }
      )
    }

    const { id } = await params
    const { isActive } = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid technician ID format',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    const result = await db.collection<Technician>('technicians').updateOne(
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
          error: 'Technician not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Technician ${
        isActive ? 'activated' : 'deactivated'
      } successfully`,
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

// DELETE /api/technicians/[id] - Delete a technician (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
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

    // Only admins can delete technicians
    if (user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      )
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid technician ID format',
        },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (user.technicianId === id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete your own account',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Check if technician has any service visits or assigned clients
    const visitCount = await db
      .collection('service_visits')
      .countDocuments({ technicianId: new ObjectId(id) })

    if (visitCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete technician with service history. Consider deactivating instead.',
        },
        { status: 400 }
      )
    }

    const result = await db
      .collection<Technician>('technicians')
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Technician deleted successfully',
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
