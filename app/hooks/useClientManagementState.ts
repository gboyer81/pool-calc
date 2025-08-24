// app/hooks/useClientManagementState.ts
'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ClientManagementState {
  viewMode: 'table' | 'grid'
  searchTerm: string
  clientTypeFilter: 'all' | 'retail' | 'service' | 'maintenance'
  statusFilter: 'all' | 'active' | 'inactive'
  frequencyFilter: 'all' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly'
}

const DEFAULT_STATE: ClientManagementState = {
  viewMode: 'table',
  searchTerm: '',
  clientTypeFilter: 'all',
  statusFilter: 'all',
  frequencyFilter: 'all',
}

const STORAGE_KEY = 'clientManagement_preferences'

export function useClientManagementState() {
  const [state, setState] = useState<ClientManagementState>(DEFAULT_STATE)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        const parsedState = JSON.parse(savedState) as ClientManagementState
        // Validate the parsed state has all required keys
        const validatedState: ClientManagementState = {
          viewMode: parsedState.viewMode || DEFAULT_STATE.viewMode,
          searchTerm: parsedState.searchTerm || DEFAULT_STATE.searchTerm,
          clientTypeFilter:
            parsedState.clientTypeFilter || DEFAULT_STATE.clientTypeFilter,
          statusFilter: parsedState.statusFilter || DEFAULT_STATE.statusFilter,
          frequencyFilter:
            parsedState.frequencyFilter || DEFAULT_STATE.frequencyFilter,
        }
        setState(validatedState)
      }
    } catch (error) {
      console.error('Error loading client management preferences:', error)
      // If there's an error, just use default state
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save state to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Error saving client management preferences:', error)
      }
    }
  }, [state, isLoaded])

  // Update functions
  const updateViewMode = useCallback((viewMode: 'table' | 'grid') => {
    setState((prev) => ({ ...prev, viewMode }))
  }, [])

  const updateSearchTerm = useCallback((searchTerm: string) => {
    setState((prev) => ({ ...prev, searchTerm }))
  }, [])

  const updateClientTypeFilter = useCallback(
    (clientTypeFilter: ClientManagementState['clientTypeFilter']) => {
      setState((prev) => ({ ...prev, clientTypeFilter }))
    },
    []
  )

  const updateStatusFilter = useCallback(
    (statusFilter: ClientManagementState['statusFilter']) => {
      setState((prev) => ({ ...prev, statusFilter }))
    },
    []
  )

  const updateFrequencyFilter = useCallback(
    (frequencyFilter: ClientManagementState['frequencyFilter']) => {
      setState((prev) => ({ ...prev, frequencyFilter }))
    },
    []
  )

  // Reset to defaults
  const resetFilters = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  // Reset only search and filters, keep view mode
  const clearFilters = useCallback(() => {
    setState((prev) => ({
      ...prev,
      searchTerm: '',
      clientTypeFilter: 'all',
      statusFilter: 'all',
      frequencyFilter: 'all',
    }))
  }, [])

  return {
    // Current state
    viewMode: state.viewMode,
    searchTerm: state.searchTerm,
    clientTypeFilter: state.clientTypeFilter,
    statusFilter: state.statusFilter,
    frequencyFilter: state.frequencyFilter,

    // Update functions
    setViewMode: updateViewMode,
    setSearchTerm: updateSearchTerm,
    setClientTypeFilter: updateClientTypeFilter,
    setStatusFilter: updateStatusFilter,
    setFrequencyFilter: updateFrequencyFilter,

    // Utility functions
    resetFilters,
    clearFilters,

    // Loading state
    isLoaded,
  }
}
