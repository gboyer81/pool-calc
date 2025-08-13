import { ObjectId } from 'mongodb'

// Database User interface (includes MongoDB _id)
export interface User {
  _id: ObjectId
  name: string
  email: string
  createdAt?: Date
  updatedAt?: Date
}

// User input interface (for creating/updating users)
export interface UserInput {
  name: string
  email: string
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  error?: string
  data?: T
}

export interface UsersResponse extends ApiResponse {
  users?: User[]
}

export interface UserResponse extends ApiResponse {
  user?: User
}

export interface CreateUserResponse extends ApiResponse {
  userId?: ObjectId
}

// Client-side User interface (with string _id for JSON serialization)
export interface ClientUser {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

// Hook return type
export interface UseUsersReturn {
  users: ClientUser[]
  loading: boolean
  error: string | null
  addUser: (
    userData: UserInput
  ) => Promise<{ success: boolean; message?: string; error?: string }>
  updateUser: (
    userId: string,
    userData: UserInput
  ) => Promise<{ success: boolean; message?: string; error?: string }>
  deleteUser: (
    userId: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>
  refetch: () => Promise<void>
}
