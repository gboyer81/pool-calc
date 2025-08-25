// Create a temporary test page: app/test/client/page.tsx
'use client'

import React, { useState } from 'react'

export default function ClientApiTest() {
  const [clientId, setClientId] = useState('68a7c44b2cee7c2dd3ea86c3')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    setLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem('technicianToken')

      console.log('Testing API with:', {
        clientId,
        token: token ? 'Present' : 'Missing',
        url: `/api/clients/${clientId}`,
      })

      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  const testAllClients = async () => {
    setLoading(true)
    setResult(null)

    try {
      const token = localStorage.getItem('technicianToken')

      const response = await fetch('/api/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      setResult({
        status: response.status,
        ok: response.ok,
        data: data,
        clientCount: data.clients?.length || 0,
        clientIds:
          data.clients?.map((c: any) => ({ id: c._id, name: c.name })) || [],
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='p-6 max-w-4xl mx-auto'>
      <h1 className='text-2xl font-bold mb-6'>Client API Test</h1>

      <div className='mb-6'>
        <label className='block text-sm font-medium mb-2'>Client ID:</label>
        <input
          type='text'
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className='w-full p-2 border border-gray-300 rounded-md'
          placeholder='Enter client ID to test'
        />
      </div>

      <div className='flex space-x-4 mb-6'>
        <button
          onClick={testApi}
          disabled={loading}
          className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400'>
          {loading ? 'Testing...' : 'Test Single Client API'}
        </button>

        <button
          onClick={testAllClients}
          disabled={loading}
          className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400'>
          {loading ? 'Testing...' : 'Test All Clients API'}
        </button>
      </div>

      {result && (
        <div className='bg-gray-100 p-4 rounded-lg'>
          <h3 className='font-semibold mb-2'>API Test Result:</h3>
          <pre className='text-sm overflow-auto max-h-96'>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className='mt-6 text-sm text-gray-600'>
        <p>
          <strong>Expected ObjectId format:</strong> 24-character hexadecimal
          string
        </p>
        <p>
          <strong>Current ID length:</strong> {clientId.length}
        </p>
        <p>
          <strong>Valid hex format:</strong>{' '}
          {/^[0-9a-fA-F]{24}$/.test(clientId) ? '✅ Yes' : '❌ No'}
        </p>
      </div>
    </div>
  )
}
