// types/pool-service.ts
import { ObjectId } from 'mongodb'

// Client Management
export interface Client {
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
  serviceFrequency: 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
  serviceDay?: string // 'monday', 'tuesday', etc.
  preferredTimeSlot?: string // 'morning', 'afternoon', 'evening'
  specialInstructions?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Pool Information
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
    totalChlorine: { min: number; max: number; target: number }
    freeChlorine: { min: number; max: number; target: number }
    totalAlkalinity: { min: number; max: number; target: number }
    calciumHardness: { min: number; max: number; target: number }
    cyanuricAcid: { min: number; max: number; target: number }
    salt?: { min: number; max: number; target: number }
  }
  notes?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Visit Logging
export interface ServiceVisit {
  _id: ObjectId
  clientId: ObjectId
  poolId: ObjectId
  technicianId: ObjectId
  scheduledDate: Date
  actualDate?: Date
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled'
  serviceType: 'routine' | 'chemical-only' | 'equipment-service' | 'emergency'

  // Water Testing Results
  readings: {
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

  // Chemical Adjustments
  chemicalsAdded: Array<{
    chemical: string
    amount: number
    unit: string
    reason: string
  }>

  // Service Tasks
  tasksCompleted: Array<{
    task: string
    completed: boolean
    notes?: string
  }>

  // Pool Condition
  poolCondition: {
    waterClarity: 'clear' | 'cloudy' | 'green' | 'black'
    debris: 'none' | 'light' | 'moderate' | 'heavy'
    equipmentStatus: 'normal' | 'issues' | 'service-needed'
  }

  // Photos
  photos?: Array<{
    url: string
    caption?: string
    type: 'before' | 'after' | 'issue' | 'equipment'
    uploadedAt: Date
  }>

  duration?: number // minutes
  notes?: string
  nextVisitRecommendations?: string
  createdAt: Date
  updatedAt: Date
}

// Technician Management
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

// Service Routes
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

// Chemical Inventory
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

// API Response Types
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

// Generic API Response (extend from existing)
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}
