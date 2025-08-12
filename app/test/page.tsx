'use client'

import React, { useState } from 'react'
import { Metadata } from 'next'

interface TestResult {
  success: boolean
  message?: string
  error?: string
  insertedId?: string
}

export default function TestPage(): React.ReactElement {
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  async function testConnection(): Promise<void> {
    setLoading(true)
    try {
      const response = await fetch('/api/test')
      const data: TestResult = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error - unable to connect to API',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'Arial',
        maxWidth: '800px',
        margin: '0 auto',
      }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        MongoDB Connection Test
      </h1>

      <p style={{ color: '#666', marginBottom: '30px' }}>
        Click the button below to test your MongoDB Atlas connection. This will
        attempt to:
      </p>

      <ul style={{ color: '#666', marginBottom: '30px', lineHeight: 1.6 }}>
        <li>Connect to your MongoDB Atlas cluster</li>
        <li>Ping the database to verify connectivity</li>
        <li>Insert a test document</li>
        <li>Return the results</li>
      </ul>

      <button
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.2s',
        }}>
        {loading ? 'Testing Connection...' : 'Test MongoDB Connection'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '30px',
            padding: '20px',
            backgroundColor: result.success ? '#d4edda' : '#f8d7da',
            border: `1px solid ${result.success ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '8px',
            color: result.success ? '#155724' : '#721c24',
          }}>
          <h3 style={{ margin: '0 0 15px 0' }}>
            {result.success ? '✅ Success!' : '❌ Error'}
          </h3>

          {result.success && result.message && (
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              {result.message}
            </p>
          )}

          {result.error && (
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
              Error: {result.error}
            </p>
          )}

          {result.insertedId && (
            <p style={{ margin: '0 0 10px 0' }}>
              Document ID:{' '}
              <code
                style={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                }}>
                {result.insertedId}
              </code>
            </p>
          )}

          <details style={{ marginTop: '15px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Raw Response Data
            </summary>
            <pre
              style={{
                marginTop: '10px',
                padding: '15px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {result?.success && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#e2f3ff',
            border: '1px solid #b8daff',
            borderRadius: '6px',
            color: '#004085',
          }}>
          <h4 style={{ margin: '0 0 10px 0' }}>🎉 What This Means:</h4>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Your MongoDB Atlas cluster is accessible</li>
            <li>Authentication credentials are correct</li>
            <li>Network connectivity is working</li>
            <li>Database operations are functional</li>
            <li>Your app is ready for production!</li>
          </ul>
        </div>
      )}
    </div>
  )
}
