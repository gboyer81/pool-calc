import { ObjectId } from 'mongodb'

export function validateClientId(clientId: string): {
  isValid: boolean
  error?: string
  normalizedId?: string
} {
  // Check if clientId exists
  if (!clientId) {
    return { isValid: false, error: 'Client ID is required' }
  }

  // Check length
  if (clientId.length !== 24) {
    return {
      isValid: false,
      error: `Invalid length: ${clientId.length} (should be 24)`,
    }
  }

  // Check if it's a valid hex string
  if (!/^[0-9a-fA-F]{24}$/.test(clientId)) {
    return {
      isValid: false,
      error: 'Contains invalid characters (should be hex only)',
    }
  }

  // Try to create ObjectId
  try {
    const objectId = new ObjectId(clientId)
    return {
      isValid: true,
      normalizedId: objectId.toString(),
    }
  } catch (error) {
    return {
      isValid: false,
      error: `ObjectId creation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    }
  }
}
