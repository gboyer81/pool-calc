// types/pool-service.ts
import { ObjectId } from 'mongodb'

// ============================================================================
// CLIENT MANAGEMENT - Enhanced for Multiple Client Types
// ============================================================================

// Base client interface
export interface BaseClient {
  _id: ObjectId
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
  clientType: 'retail' | 'service' | 'maintenance'
  specialInstructions?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Retail Client - for equipment/chemical sales
export interface RetailClient extends BaseClient {
  clientType: 'retail'
  retail: {
    // Pricing tier for retail discounts
    pricingTier: 'standard' | 'preferred' | 'commercial' | 'wholesale'
    // Tax-exempt status
    taxExempt: boolean
    taxExemptNumber?: string
    // Payment terms
    paymentTerms: 'net-30' | 'net-15' | 'cod' | 'prepaid'
    creditLimit?: number
    // Delivery preferences
    deliveryPreferences: {
      preferredDeliveryDay?: string
      deliveryInstructions?: string
      requiresAppointment: boolean
    }
    // Purchase history tracking
    lastOrderDate?: Date
    totalYearlyPurchases?: number
  }
}

// Service Client - for equipment repair, installation, leak detection
export interface ServiceClient extends BaseClient {
  clientType: 'service'
  service: {
    // Labor rates for different types of work
    laborRates: {
      standard: number // $/hour for regular service
      emergency: number // $/hour for emergency calls
    }
    // Service types this client typically needs
    serviceTypes: Array<
      | 'equipment-repair'
      | 'leak-detection'
      | 'new-installation'
      | 'equipment-upgrade'
      | 'pump-service'
      | 'heater-service'
      | 'automation-service'
    >
    // Emergency service availability
    emergencyService: {
      enabled: boolean
      afterHoursRate?: number // multiplier for after hours
      weekendRate?: number // multiplier for weekends
    }
    // Preferred service window
    preferredServiceWindow?: {
      startTime: string // "09:00"
      endTime: string // "17:00"
      preferredDays: string[] // ["monday", "tuesday"]
    }
    // Equipment warranty tracking
    warrantyInfo?: Array<{
      equipmentType: string
      warrantyExpiration: Date
      warrantyProvider: string
    }>
  }
}

// Maintenance Client - for ongoing pool cleaning/maintenance
export interface MaintenanceClient extends BaseClient {
  clientType: 'maintenance'
  isMaintenance: true // Your requested flag
  maintenance: {
    // Service frequency and scheduling
    serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
    serviceDay?: string // 'monday', 'tuesday', etc.
    preferredTimeSlot?: string // 'morning', 'afternoon', 'evening'

    // Chemical management
    chemicalProgram: {
      // Client-provided vs technician-provided chemicals
      chemicalSupply: 'client-provided' | 'technician-provided' | 'mixed'
      // Chemical storage location
      storageLocation?: string
      // Special chemical requirements
      specialRequirements?: string[]
      // Chemical usage tracking
      monthlyChemicalBudget?: number
    }

    // Service intervals and tasks
    serviceIntervals: {
      // How often different tasks are performed
      waterTesting: number // visits (every 1 visit, every 2 visits, etc.)
      equipmentCheck: number // visits
      filterCleaning: number // visits
      deepCleaning: number // visits
      chemicalRebalancing: number // visits
    }

    // Equipment access and special considerations
    accessInstructions: {
      gateCode?: string
      keyLocation?: string
      dogOnProperty?: boolean
      specialAccess?: string
    }

    // Pool-specific maintenance settings
    maintenancePreferences: {
      cleaningIntensity: 'light' | 'standard' | 'deep'
      chemicalBalance: 'minimal' | 'standard' | 'precise'
      equipmentMonitoring: 'basic' | 'comprehensive'
    }

    // Seasonal considerations
    seasonalService: {
      winterMaintenance?: boolean
      poolClosing?: boolean
      poolOpening?: boolean
      heaterService?: boolean
    }
  }
}

// Union type for all client types
export type Client = RetailClient | ServiceClient | MaintenanceClient

// Type guards for client types
export function isRetailClient(client: Client): client is RetailClient {
  return client.clientType === 'retail'
}

export function isServiceClient(client: Client): client is ServiceClient {
  return client.clientType === 'service'
}

export function isMaintenanceClient(
  client: Client
): client is MaintenanceClient {
  return client.clientType === 'maintenance'
}

// ============================================================================
// POOL INFORMATION
// ============================================================================

export interface Pool {
  _id: ObjectId
  clientId: ObjectId
  name: string // "Main Pool", "Spa", etc.
  type: 'residential' | 'commercial'
  shape: 'rectangular' | 'circular' | 'oval' | 'kidney' | 'freeform'
  dimensions: {
    length?: number
    width?: number
    diameter?: number
    avgDepth: number
  }
  volume: {
    gallons: number
    calculatedAt: Date
  }
  equipment: {
    filter: {
      type: 'sand' | 'cartridge' | 'de'
      model?: string
      lastCleaned?: Date
    }
    pump: {
      model?: string
      horsepower?: number
    }
    heater?: {
      type: 'gas' | 'electric' | 'heat-pump'
      model?: string
    }
    saltSystem?: {
      model?: string
      targetSalt: number
    }
    automation?: {
      system?: string
      model?: string
    }
  }
  targetLevels: {
    ph: { min: number; max: number; target: number }
    freeChlorine: { min: number; max: number; target: number }
    totalChlorine?: { min: number; max: number; target: number } // Optional
    totalAlkalinity: { min: number; max: number; target: number }
    calciumHardness: { min: number; max: number; target: number }
    cyanuricAcid: { min: number; max: number; target: number }
    salt?: { min: number; max: number; target: number }
  }

  readings: {
    freeChlorine?: number
    totalChlorine?: number // Optional - measured when testing
    combinedChlorine?: number // Calculated: totalChlorine - freeChlorine
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }
  notes?: string
}

// ============================================================================
// SERVICE VISITS - Enhanced for Different Client Types
// ============================================================================

export interface ServiceVisit {
  _id: ObjectId
  clientId: ObjectId
  poolId?: ObjectId // Optional for retail clients
  technicianId: ObjectId
  scheduledDate: Date
  actualDate?: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled'

  // Service type based on client type
  serviceType:
    | 'maintenance-routine'
    | 'maintenance-chemical'
    | 'service-repair'
    | 'service-installation'
    | 'service-emergency'
    | 'retail-delivery'
    | 'retail-pickup'
    | 'routine' // Legacy support
    | 'chemical-only' // Legacy support
    | 'equipment-service' // Legacy support
    | 'emergency' // Legacy support

  // Maintenance-specific fields (when clientType is 'maintenance')
  maintenanceDetails?: {
    readings?: {
      ph?: number
      totalChlorine?: number
      freeChlorine?: number
      totalAlkalinity?: number
      calciumHardness?: number
      cyanuricAcid?: number
      salt?: number
      phosphates?: number
      temperature?: number
      testedAt: Date
    }
    chemicalsAdded?: Array<{
      chemical: string
      amount: number
      unit: string
      reason: string
      cost?: number
    }>
    tasksCompleted?: Array<{
      task: string
      completed: boolean
      notes?: string
    }>
    poolCondition?: {
      waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
      debris: 'none' | 'light' | 'moderate' | 'heavy'
      equipmentStatus: 'normal' | 'issues' | 'service-needed'
    }
  }

  // Service-specific fields (when clientType is 'service')
  serviceDetails?: {
    workPerformed: string
    laborHours: number
    laborRate: number
    partsUsed?: Array<{
      partNumber?: string
      description: string
      quantity: number
      unitCost: number
    }>
    equipmentServiced?: Array<{
      equipmentType: string
      model?: string
      serialNumber?: string
      actionTaken: string
    }>
    followUpRequired?: boolean
    warrantyWork?: boolean
  }

  // Retail-specific fields (when clientType is 'retail')
  retailDetails?: {
    orderNumber?: string
    itemsDelivered?: Array<{
      sku?: string
      description: string
      quantity: number
      unitPrice: number
    }>
    deliveryMethod: 'pickup' | 'delivery' | 'installation'
    signatureRequired?: boolean
    customerSignature?: string
  }

  // Legacy fields for backward compatibility
  readings?: {
    ph?: number
    totalChlorine?: number
    freeChlorine?: number
    totalAlkalinity?: number
    calciumHardness?: number
    cyanuricAcid?: number
    salt?: number
    phosphates?: number
    temperature?: number
    testedAt: Date
  }

  chemicalsAdded?: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
  }>

  tasksCompleted?: Array<{
    task: string
    completed: boolean
    notes?: string
  }>

  poolCondition?: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }

  // Common fields
  photos?: Array<{
    url: string
    caption?: string
    type:
      | 'before'
      | 'after'
      | 'issue'
      | 'equipment'
      | 'delivery'
      | 'installation'
    uploadedAt: Date
  }>

  duration?: number // minutes
  notes?: string
  nextVisitRecommendations?: string

  // Billing information
  billing?: {
    totalLabor?: number
    totalParts?: number
    totalChemicals?: number
    totalAmount: number
    invoiceNumber?: string
    paymentStatus: 'pending' | 'paid' | 'overdue'
  }

  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// TECHNICIAN MANAGEMENT
// ============================================================================

export interface Technician {
  _id: ObjectId
  name: string
  email: string
  phone: string
  employeeId?: string
  certifications: Array<{
    name: string
    issuer: string
    expirationDate?: Date
  }>
  serviceAreas: string[] // zip codes or regions
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SERVICE ROUTES
// ============================================================================

export interface ServiceRoute {
  _id: ObjectId
  name: string
  technicianId: ObjectId
  day: string // 'monday', 'tuesday', etc.
  clients: Array<{
    clientId: ObjectId
    order: number
    estimatedDuration: number
    timeSlot?: string
  }>
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// CHEMICAL INVENTORY
// ============================================================================

export interface ChemicalInventory {
  _id: ObjectId
  name: string
  type:
    | 'chlorine'
    | 'acid'
    | 'alkalinity-increaser'
    | 'calcium-increaser'
    | 'salt'
    | 'other'
  currentStock: number
  unit: string
  minStock: number
  costPerUnit: number
  supplier?: string
  lastRestocked: Date
  expirationDate?: Date
  notes?: string
}

// ============================================================================
// PRODUCTS & INVENTORY (for Retail Clients)
// ============================================================================

export interface Product {
  _id: ObjectId
  sku: string
  name: string
  description: string
  category: 'chemicals' | 'equipment' | 'accessories' | 'parts'
  subCategory?: string
  brand?: string
  model?: string

  // Pricing
  baseCost: number
  pricing: {
    standard: number
    preferred: number
    commercial: number
    wholesale: number
  }

  // Inventory
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number

  // Specifications
  specifications?: {
    weight?: number
    dimensions?: {
      length: number
      width: number
      height: number
    }
    volume?: number
    concentration?: string
    compatibility?: string[]
  }

  // Vendor information
  suppliers: Array<{
    name: string
    partNumber?: string
    cost: number
    leadTime: number // days
    minOrderQty: number
  }>

  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// INVOICING & BILLING
// ============================================================================

export interface Invoice {
  _id: ObjectId
  invoiceNumber: string
  clientId: ObjectId
  visitIds?: ObjectId[] // Associated service visits
  orderIds?: ObjectId[] // Associated retail orders

  // Billing details
  lineItems: Array<{
    type: 'labor' | 'chemical' | 'part' | 'product' | 'service'
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
    taxable: boolean
  }>

  subtotal: number
  taxAmount: number
  totalAmount: number

  // Payment information
  terms: string
  dueDate: Date
  paidDate?: Date
  paymentMethod?: string
  paymentStatus: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// ORDERS (for Retail Clients)
// ============================================================================

export interface Order {
  _id: ObjectId
  orderNumber: string
  clientId: ObjectId

  items: Array<{
    productId: ObjectId
    sku: string
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>

  subtotal: number
  discount?: number
  taxAmount: number
  shippingCost?: number
  totalAmount: number

  // Delivery information
  deliveryMethod: 'pickup' | 'delivery' | 'installation'
  deliveryAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  scheduledDelivery?: Date
  actualDelivery?: Date

  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
  notes?: string

  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface ClientsResponse extends ApiResponse {
  clients?: Client[]
}

export interface PoolsResponse extends ApiResponse {
  pools?: Pool[]
}

export interface VisitsResponse extends ApiResponse {
  visits?: ServiceVisit[]
}

export interface RouteResponse extends ApiResponse {
  route?: ServiceRoute
}

export interface TechniciansResponse extends ApiResponse {
  technicians?: Technician[]
}

export interface ProductsResponse extends ApiResponse {
  products?: Product[]
}

export interface OrdersResponse extends ApiResponse {
  orders?: Order[]
}

export interface InvoicesResponse extends ApiResponse {
  invoices?: Invoice[]
}

// ============================================================================
// UTILITY TYPES & ENUMS
// ============================================================================

export type ClientType = 'retail' | 'service' | 'maintenance'
export type ServiceFrequency =
  | 'twice-weekly'
  | 'weekly'
  | 'bi-weekly'
  | 'monthly'
export type PaymentTerms = 'net-30' | 'net-15' | 'cod' | 'prepaid'
export type PricingTier = 'standard' | 'preferred' | 'commercial' | 'wholesale'
export type VisitStatus =
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'skipped'
  | 'rescheduled'
export type PaymentStatus = 'pending' | 'paid' | 'overdue'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export class ClientUtils {
  static isMaintenanceClient(client: Client): client is MaintenanceClient {
    return client.clientType === 'maintenance'
  }

  static isServiceClient(client: Client): client is ServiceClient {
    return client.clientType === 'service'
  }

  static isRetailClient(client: Client): client is RetailClient {
    return client.clientType === 'retail'
  }

  static getLaborRate(
    client: ServiceClient,
    type: 'standard' | 'emergency' = 'standard'
  ): number {
    return client.service.laborRates[type]
  }

  static getProductPrice(product: Product, tier: PricingTier): number {
    return product.pricing[tier]
  }

  static shouldPerformTask(
    client: MaintenanceClient,
    taskType: keyof MaintenanceClient['maintenance']['serviceIntervals'],
    visitNumber: number
  ): boolean {
    return visitNumber % client.maintenance.serviceIntervals[taskType] === 0
  }
}

// Utility functions
// export const poolToString = (pool: any): Pool => ({
//   ...pool,
//   _id: typeof pool._id === 'string' ? pool._id : pool._id.toString(),
// })

// export const poolToObjectId = (pool: any) => ({
//   ...pool,
//   _id: typeof pool._id === 'string' ? new ObjectId(pool._id) : pool._id,
// })
