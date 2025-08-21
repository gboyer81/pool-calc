// app/api/clients/route.ts
import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ApiResponse } from '@/types/user'
import { authenticateRequest, AuthenticatedUser } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// Import the enhanced client types
import {
  Client,
  RetailClient,
  ServiceClient,
  MaintenanceClient,
  ClientsResponse,
} from '@/types/pool-service'

// Input interfaces for creating clients
interface BaseClientInput {
  name: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  clientType: 'retail' | 'service' | 'maintenance'
  specialInstructions?: string
}

interface RetailClientInput extends BaseClientInput {
  clientType: 'retail'
  retail: {
    pricingTier: 'standard' | 'preferred' | 'commercial' | 'wholesale'
    taxExempt: boolean
    taxExemptNumber?: string
    paymentTerms: 'net-30' | 'net-15' | 'cod' | 'prepaid'
    creditLimit?: number
    deliveryPreferences?: {
      preferredDeliveryDay?: string
      deliveryInstructions?: string
      requiresAppointment: boolean
    }
  }
}

interface ServiceClientInput extends BaseClientInput {
  clientType: 'service'
  service: {
    laborRates: {
      standard: number
      emergency: number
    }
    serviceTypes: string[]
    emergencyService: {
      enabled: boolean
      afterHoursRate?: number
      weekendRate?: number
    }
    preferredServiceWindow?: {
      startTime: string
      endTime: string
      preferredDays: string[]
    }
  }
}

interface MaintenanceClientInput extends BaseClientInput {
  clientType: 'maintenance'
  isMaintenance: true
  maintenance: {
    serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
    serviceDay?: string
    chemicalProgram: {
      chemicalSupply: 'client-provided' | 'technician-provided' | 'mixed'
      storageLocation?: string
      specialRequirements?: string[]
      monthlyChemicalBudget?: number
    }
    serviceIntervals: {
      waterTesting: number
      equipmentCheck: number
      filterCleaning: number
      deepCleaning: number
      chemicalRebalancing?: number
    }
    accessInstructions?: {
      gateCode?: string
      keyLocation?: string
      dogOnProperty?: boolean
      specialAccess?: string
    }
    maintenancePreferences?: {
      cleaningIntensity: 'light' | 'standard' | 'deep'
      chemicalBalance: 'minimal' | 'standard' | 'precise'
      equipmentMonitoring: 'basic' | 'comprehensive'
    }
  }
}

type ClientInput =
  | RetailClientInput
  | ServiceClientInput
  | MaintenanceClientInput

interface CreateClientResponse extends ApiResponse {
  clientId?: string
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
    const clientType = searchParams.get('clientType')
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

    // Filter by client type
    if (clientType && clientType !== 'all') {
      query.clientType = clientType
    }

    // Maintenance-specific filters
    if (
      clientType === 'maintenance' &&
      serviceFrequency &&
      serviceFrequency !== 'all'
    ) {
      query['maintenance.serviceFrequency'] = serviceFrequency
    }

    if (serviceDay && serviceDay !== 'all') {
      if (clientType === 'maintenance') {
        query['maintenance.serviceDay'] = serviceDay
      }
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
    console.error('Error fetching clients:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch clients: ${errorMessage}`,
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

    const body = await request.json()
    console.log('Received client data:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (
      !body.name ||
      !body.email ||
      !body.phone ||
      !body.address ||
      !body.clientType
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Missing required fields: name, email, phone, address, clientType',
        },
        { status: 400 }
      )
    }

    // Validate client type
    if (!['retail', 'service', 'maintenance'].includes(body.clientType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid clientType. Must be retail, service, or maintenance',
        },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Check if email already exists
    const existingClient = await db
      .collection('clients')
      .findOne({ email: body.email })

    if (existingClient) {
      return NextResponse.json(
        {
          success: false,
          error: 'A client with this email already exists',
        },
        { status: 409 }
      )
    }

    // Create the appropriate client structure based on type
    let newClient: any = {
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone.trim(),
      address: {
        street: body.address.street.trim(),
        city: body.address.city.trim(),
        state: body.address.state.trim(),
        zipCode: body.address.zipCode.trim(),
      },
      clientType: body.clientType,
      specialInstructions: body.specialInstructions?.trim() || undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Add billing address if provided
    if (body.billingAddress) {
      newClient.billingAddress = {
        street: body.billingAddress.street.trim(),
        city: body.billingAddress.city.trim(),
        state: body.billingAddress.state.trim(),
        zipCode: body.billingAddress.zipCode.trim(),
      }
    }

    // Add type-specific data
    switch (body.clientType) {
      case 'retail':
        if (!body.retail) {
          return NextResponse.json(
            { success: false, error: 'Retail client data is required' },
            { status: 400 }
          )
        }
        newClient.retail = {
          pricingTier: body.retail.pricingTier || 'standard',
          taxExempt: body.retail.taxExempt || false,
          taxExemptNumber: body.retail.taxExemptNumber?.trim() || undefined,
          paymentTerms: body.retail.paymentTerms || 'net-30',
          creditLimit: body.retail.creditLimit || undefined,
          deliveryPreferences: {
            preferredDeliveryDay:
              body.retail.deliveryPreferences?.preferredDeliveryDay ||
              undefined,
            deliveryInstructions:
              body.retail.deliveryPreferences?.deliveryInstructions?.trim() ||
              undefined,
            requiresAppointment:
              body.retail.deliveryPreferences?.requiresAppointment || false,
          },
          lastOrderDate: undefined,
          totalYearlyPurchases: 0,
        }
        break

      case 'service':
        if (!body.service) {
          return NextResponse.json(
            { success: false, error: 'Service client data is required' },
            { status: 400 }
          )
        }
        newClient.service = {
          laborRates: {
            standard: body.service.laborRates?.standard || 85,
            emergency:
              body.service.laborRates?.emergency ||
              body.service.laborRates?.standard * 1.5 ||
              127.5,
          },
          serviceTypes: body.service.serviceTypes || ['equipment-repair'],
          emergencyService: {
            enabled: body.service.emergencyService?.enabled !== false,
            afterHoursRate:
              body.service.emergencyService?.afterHoursRate || 1.5,
            weekendRate: body.service.emergencyService?.weekendRate || 1.25,
          },
          preferredServiceWindow:
            body.service.preferredServiceWindow || undefined,
        }
        break

      case 'maintenance':
        if (!body.maintenance && !body.isMaintenance) {
          return NextResponse.json(
            { success: false, error: 'Maintenance client data is required' },
            { status: 400 }
          )
        }
        newClient.isMaintenance = true
        newClient.maintenance = {
          serviceFrequency: body.maintenance?.serviceFrequency || 'weekly',
          serviceDay: body.maintenance?.serviceDay || undefined,
          chemicalProgram: {
            chemicalSupply:
              body.maintenance?.chemicalProgram?.chemicalSupply ||
              'technician-provided',
            storageLocation:
              body.maintenance?.chemicalProgram?.storageLocation?.trim() ||
              undefined,
            specialRequirements:
              body.maintenance?.chemicalProgram?.specialRequirements || [],
            monthlyChemicalBudget:
              body.maintenance?.chemicalProgram?.monthlyChemicalBudget ||
              undefined,
          },
          serviceIntervals: {
            waterTesting: body.maintenance?.serviceIntervals?.waterTesting || 1,
            equipmentCheck:
              body.maintenance?.serviceIntervals?.equipmentCheck || 1,
            filterCleaning:
              body.maintenance?.serviceIntervals?.filterCleaning || 4,
            deepCleaning: body.maintenance?.serviceIntervals?.deepCleaning || 8,
            chemicalRebalancing:
              body.maintenance?.serviceIntervals?.chemicalRebalancing || 1,
          },
          accessInstructions: {
            gateCode:
              body.maintenance?.accessInstructions?.gateCode?.trim() ||
              undefined,
            keyLocation:
              body.maintenance?.accessInstructions?.keyLocation?.trim() ||
              undefined,
            dogOnProperty:
              body.maintenance?.accessInstructions?.dogOnProperty || false,
            specialAccess:
              body.maintenance?.accessInstructions?.specialAccess?.trim() ||
              undefined,
          },
          maintenancePreferences: {
            cleaningIntensity:
              body.maintenance?.maintenancePreferences?.cleaningIntensity ||
              'standard',
            chemicalBalance:
              body.maintenance?.maintenancePreferences?.chemicalBalance ||
              'standard',
            equipmentMonitoring:
              body.maintenance?.maintenancePreferences?.equipmentMonitoring ||
              'basic',
          },
          seasonalService: body.maintenance?.seasonalService || {},
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid client type' },
          { status: 400 }
        )
    }

    console.log('Inserting client:', JSON.stringify(newClient, null, 2))

    // Insert the new client
    const result = await db.collection('clients').insertOne(newClient)

    console.log('Insert result:', result)

    return NextResponse.json({
      success: true,
      clientId: result.insertedId.toString(),
      message: `${body.clientType} client created successfully`,
    })
  } catch (error) {
    console.error('Error creating client:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create client: ${errorMessage}`,
      },
      { status: 500 }
    )
  }
}

// PUT /api/clients/[id] - Update an existing client
export async function PUT(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const url = new URL(request.url)
    const clientId = url.pathname.split('/').pop()

    if (!clientId || !ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    // Get existing client to determine type
    const existingClient = await db
      .collection('clients')
      .findOne({ _id: new ObjectId(clientId) })

    if (!existingClient) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    // Remove _id from update data to prevent conflicts
    delete updateData._id

    const result = await db
      .collection('clients')
      .updateOne({ _id: new ObjectId(clientId) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
    })
  } catch (error) {
    console.error('Error updating client:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to update client: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const clientId = url.pathname.split('/').pop()

    if (!clientId || !ObjectId.isValid(clientId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('poolCalc')

    const result = await db
      .collection('clients')
      .deleteOne({ _id: new ObjectId(clientId) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting client:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to delete client: ${errorMessage}` },
      { status: 500 }
    )
  }
}
