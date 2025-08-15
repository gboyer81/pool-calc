// lib/auth.ts
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import clientPromise from './mongodb'
import { ObjectId } from 'mongodb'

const JWT_SECRET =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface AuthenticatedUser {
  technicianId: string
  email: string
  role: 'technician' | 'supervisor' | 'admin'
  name: string
  assignedClients: string[]
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return null
    }

    const token = authorization.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as any

    // Get full technician data from database
    const client = await clientPromise
    const db = client.db('poolCalc')

    const technician = await db
      .collection('technicians')
      .findOne(
        { _id: new ObjectId(decoded.technicianId) },
        { projection: { password: 0 } }
      )

    if (!technician || !technician.isActive) {
      return null
    }

    return {
      technicianId: technician._id.toString(),
      email: technician.email,
      role: technician.role,
      name: technician.name,
      assignedClients: technician.assignedClients.map((id: ObjectId) =>
        id.toString()
      ),
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const user = await authenticateRequest(request)
    if (!user) {
      return Response.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    return handler(request, user)
  }
}

export function requireRole(roles: string[]) {
  return (
    handler: (
      request: NextRequest,
      user: AuthenticatedUser
    ) => Promise<Response>
  ) => {
    return async (request: NextRequest) => {
      const user = await authenticateRequest(request)
      if (!user) {
        return Response.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      if (!roles.includes(user.role)) {
        return Response.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      return handler(request, user)
    }
  }
}
