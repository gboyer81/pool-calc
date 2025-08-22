import React, { useState, useEffect } from 'react'

// Example component showing how to use the chlorine calculations
export default function ChlorineReadingsForm() {
  const [readings, setReadings] = useState({
    freeChlorine: '',
    totalChlorine: '',
    ph: '',
    totalAlkalinity: '',
  })

  const [calculatedValues, setCalculatedValues] = useState({
    combinedChlorine: undefined as number | undefined,
    needsShocking: false,
    isBalanced: true,
  })

  // Calculate combined chlorine and status when readings change
  useEffect(() => {
    const freeChlorine = readings.freeChlorine
      ? parseFloat(readings.freeChlorine)
      : undefined
    const totalChlorine = readings.totalChlorine
      ? parseFloat(readings.totalChlorine)
      : undefined

    // Calculate combined chlorine: Total - Free
    const combinedChlorine =
      totalChlorine !== undefined && freeChlorine !== undefined
        ? Math.max(0, totalChlorine - freeChlorine)
        : undefined

    // Determine if pool needs shocking (combined chlorine > 0.5 ppm)
    const needsShocking =
      combinedChlorine !== undefined && combinedChlorine > 0.5

    // Check if chlorine is balanced (combined < 0.5)
    const isBalanced = combinedChlorine === undefined || combinedChlorine < 0.5

    setCalculatedValues({
      combinedChlorine,
      needsShocking,
      isBalanced,
    })
  }, [readings.freeChlorine, readings.totalChlorine])

  const handleInputChange = (field: string, value: string) => {
    setReadings((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const getChlorineStatus = () => {
    if (calculatedValues.combinedChlorine === undefined) {
      return {
        color: 'text-gray-500',
        message: 'Enter both values to calculate',
      }
    }

    if (calculatedValues.needsShocking) {
      return {
        color: 'text-red-600',
        message: 'High combined chlorine - Pool needs shocking!',
      }
    }

    if (calculatedValues.isBalanced) {
      return {
        color: 'text-green-600',
        message: 'Chlorine levels balanced',
      }
    }

    return { color: 'text-yellow-600', message: 'Monitor chlorine levels' }
  }

  const status = getChlorineStatus()

  return (
    <div className='max-w-2xl mx-auto p-6 bg-background rounded-lg shadow-lg'>
      <h2 className='text-2xl font-bold text-foreground mb-6'>
        Pool Chemistry Readings
      </h2>

      {/* Input Fields */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Free Chlorine (ppm) *
          </label>
          <input
            type='number'
            step='0.1'
            value={readings.freeChlorine}
            onChange={(e) => handleInputChange('freeChlorine', e.target.value)}
            className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='e.g., 2.0'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Ideal range: 1.0 - 3.0 ppm
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Total Chlorine (ppm)
          </label>
          <input
            type='number'
            step='0.1'
            value={readings.totalChlorine}
            onChange={(e) => handleInputChange('totalChlorine', e.target.value)}
            className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='e.g., 2.3'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Optional - measures all chlorine
          </p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            pH Level
          </label>
          <input
            type='number'
            step='0.1'
            value={readings.ph}
            onChange={(e) => handleInputChange('ph', e.target.value)}
            className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='e.g., 7.4'
          />
          <p className='text-xs text-gray-500 mt-1'>Ideal range: 7.2 - 7.6</p>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Total Alkalinity (ppm)
          </label>
          <input
            type='number'
            value={readings.totalAlkalinity}
            onChange={(e) =>
              handleInputChange('totalAlkalinity', e.target.value)
            }
            className='w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder='e.g., 100'
          />
          <p className='text-xs text-gray-500 mt-1'>
            Ideal range: 80 - 120 ppm
          </p>
        </div>
      </div>

      {/* Calculated Values */}
      <div className='bg-muted/50 rounded-lg p-4 mb-6'>
        <h3 className='text-lg font-semibold text-foreground mb-3'>
          Calculated Values
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='bg-background rounded-md p-3'>
            <div className='text-sm font-medium text-gray-700'>
              Combined Chlorine
            </div>
            <div className='text-xl font-bold text-foreground'>
              {calculatedValues.combinedChlorine !== undefined
                ? `${calculatedValues.combinedChlorine.toFixed(1)} ppm`
                : '-- ppm'}
            </div>
            <div className='text-xs text-gray-500'>Total - Free Chlorine</div>
          </div>

          <div className='bg-background rounded-md p-3'>
            <div className='text-sm font-medium text-gray-700'>Status</div>
            <div className={`text-lg font-semibold ${status.color}`}>
              {status.message}
            </div>
          </div>
        </div>
      </div>

      {/* Chemistry Explanation */}
      <div className='bg-blue-50 rounded-lg p-4'>
        <h4 className='font-semibold text-blue-900 mb-2'>
          💡 Chemistry Explanation
        </h4>
        <div className='text-sm text-blue-800 space-y-1'>
          <p>
            <strong>Free Chlorine:</strong> Available chlorine that actively
            sanitizes the pool
          </p>
          <p>
            <strong>Total Chlorine:</strong> Free chlorine + combined chlorine
            (chloramines)
          </p>
          <p>
            <strong>Combined Chlorine:</strong> Chloramines that cause eye/skin
            irritation
          </p>
          <p>
            <strong>Ideal:</strong> Combined chlorine should be less than 0.5
            ppm
          </p>
          <p>
            <strong>Action:</strong> If combined chlorine &gt; 0.5 ppm, shock
            the pool
          </p>
        </div>
      </div>

      {/* Action Recommendations */}
      {calculatedValues.needsShocking && (
        <div className='mt-4 bg-red-50 border border-red-200 rounded-lg p-4'>
          <h4 className='font-semibold text-red-900 mb-2'>
            ⚠️ Action Required
          </h4>
          <div className='text-sm text-red-800'>
            <p>
              Combined chlorine level is high (
              {calculatedValues.combinedChlorine?.toFixed(1)} ppm)
            </p>
            <p className='mt-1'>
              <strong>Recommendation:</strong> Shock the pool to break down
              chloramines
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className='mt-6 flex justify-end'>
        <button className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'>
          Save Readings
        </button>
      </div>
    </div>
  )
}
