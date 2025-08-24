'use client'

import React from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import TechnicianDashboard from '@/components/TechnicianDashboard'

export default function TechnicianDashboardPage() {
  return (
    <ProtectedRoute>
      <div className='min-h-screen p-4 bg-gray-100'>
        <h1 className='mb-6 text-3xl font-bold text-center text-gray-800'>
          Technician Dashboard
        </h1>
        <TechnicianDashboard />
      </div>
    </ProtectedRoute>
  )
}
