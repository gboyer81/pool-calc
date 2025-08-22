'use client'

import React, { useState } from 'react'

interface CalculatorProps {
  poolVolume: number
  onAddChemical: (
    chemical: string,
    amount: number,
    unit: string,
    reason: string
  ) => void
}

interface PhCalculatorProps extends CalculatorProps {
  currentPh?: number
}

interface ChlorineCalculatorProps extends CalculatorProps {
  currentCl?: number
  targetCl: number
}

interface AlkalinityCalculatorProps extends CalculatorProps {
  currentAlk?: number
  targetAlk: number
}

export const PhCalculatorForm: React.FC<PhCalculatorProps> = ({
  poolVolume,
  currentPh,
  onAddChemical,
}) => {
  const [targetPh, setTargetPh] = useState('7.5')
  const [calculatedResult, setCalculatedResult] = useState<any>(null)

  const calculatePh = () => {
    if (!currentPh || !targetPh) return

    const phDiff = parseFloat(targetPh) - currentPh
    if (Math.abs(phDiff) < 0.1) {
      setCalculatedResult({
        message: 'pH is already within target range',
        amount: 0,
      })
      return
    }

    let chemical, amount, unit

    if (phDiff > 0) {
      // Need to raise pH - use Soda Ash
      chemical = 'Soda Ash'
      // Approximate: 6 oz soda ash per 10,000 gallons raises pH by ~0.2
      amount = Math.round((phDiff / 0.2) * 6 * (poolVolume / 10000) * 100) / 100
      unit = 'ounces'
    } else {
      // Need to lower pH - use Muriatic Acid
      chemical = 'Muriatic Acid'
      // Approximate: 8 fl oz muriatic acid per 10,000 gallons lowers pH by ~0.2
      amount =
        Math.round((Math.abs(phDiff) / 0.2) * 8 * (poolVolume / 10000) * 100) /
        100
      unit = 'fluid ounces'
    }

    setCalculatedResult({ chemical, amount, unit, phDiff })
  }

  const addToVisit = () => {
    if (calculatedResult && calculatedResult.amount > 0) {
      onAddChemical(
        calculatedResult.chemical,
        calculatedResult.amount,
        calculatedResult.unit,
        `Adjust pH from ${currentPh} to ${targetPh}`
      )
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='block text-sm font-medium mb-1'>Current pH</label>
          <input
            type='number'
            step='0.1'
            value={currentPh || ''}
            disabled
            className='w-full px-3 py-2 border rounded-md bg-muted/50'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>Target pH</label>
          <input
            type='number'
            step='0.1'
            value={targetPh}
            onChange={(e) => setTargetPh(e.target.value)}
            className='w-full px-3 py-2 border rounded-md'
          />
        </div>
      </div>

      <button
        onClick={calculatePh}
        disabled={!currentPh}
        className='w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300'>
        Calculate pH Adjustment
      </button>

      {calculatedResult && (
        <div className='bg-green-50 border border-green-200 rounded-md p-3'>
          {calculatedResult.amount > 0 ? (
            <>
              <p className='font-medium'>Recommendation:</p>
              <p>
                Add{' '}
                <strong>
                  {calculatedResult.amount} {calculatedResult.unit}
                </strong>{' '}
                of <strong>{calculatedResult.chemical}</strong>
              </p>
              <button
                onClick={addToVisit}
                className='mt-2 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700'>
                Add to Visit Log
              </button>
            </>
          ) : (
            <p className='text-green-700'>{calculatedResult.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export const ChlorineCalculatorForm: React.FC<ChlorineCalculatorProps> = ({
  poolVolume,
  currentCl,
  targetCl,
  onAddChemical,
}) => {
  const [chlorineType, setChlorineType] = useState('liquid')
  const [calculatedResult, setCalculatedResult] = useState<any>(null)

  const calculateChlorine = () => {
    if (!currentCl || !targetCl) return

    const clDiff = targetCl - currentCl
    if (clDiff <= 0) {
      setCalculatedResult({
        message: 'Chlorine is already at or above target',
        amount: 0,
      })
      return
    }

    let amount, unit

    if (chlorineType === 'liquid') {
      // Liquid chlorine: ~1 gallon per 10,000 gallons raises FC by ~10 ppm
      amount = Math.round((clDiff / 10) * (poolVolume / 10000) * 128) / 100 // Convert to fl oz
      unit = amount >= 128 ? 'gallons' : 'fluid ounces'
      if (unit === 'gallons') amount = amount / 128
    } else {
      // Cal-hypo powder: ~1 lb per 10,000 gallons raises FC by ~10 ppm
      amount = Math.round((clDiff / 10) * (poolVolume / 10000) * 100) / 100
      unit = 'pounds'
    }

    setCalculatedResult({
      chemical:
        chlorineType === 'liquid' ? 'Liquid Chlorine' : 'Cal-Hypo Powder',
      amount: Math.round(amount * 100) / 100,
      unit,
      clDiff,
    })
  }

  const addToVisit = () => {
    if (calculatedResult && calculatedResult.amount > 0) {
      onAddChemical(
        calculatedResult.chemical,
        calculatedResult.amount,
        calculatedResult.unit,
        `Raise free chlorine from ${currentCl} to ${targetCl} ppm`
      )
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Current FC (ppm)
          </label>
          <input
            type='number'
            step='0.1'
            value={currentCl || ''}
            disabled
            className='w-full px-3 py-2 border rounded-md bg-muted/50'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Target FC (ppm)
          </label>
          <input
            type='number'
            step='0.1'
            value={targetCl}
            disabled
            className='w-full px-3 py-2 border rounded-md bg-muted/50'
          />
        </div>
      </div>

      <div>
        <label className='block text-sm font-medium mb-1'>Chlorine Type</label>
        <select
          value={chlorineType}
          onChange={(e) => setChlorineType(e.target.value)}
          className='w-full px-3 py-2 border rounded-md'>
          <option value='liquid'>Liquid Chlorine</option>
          <option value='powder'>Cal-Hypo Powder</option>
        </select>
      </div>

      <button
        onClick={calculateChlorine}
        disabled={!currentCl}
        className='w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300'>
        Calculate Chlorine Addition
      </button>

      {calculatedResult && (
        <div className='bg-green-50 border border-green-200 rounded-md p-3'>
          {calculatedResult.amount > 0 ? (
            <>
              <p className='font-medium'>Recommendation:</p>
              <p>
                Add{' '}
                <strong>
                  {calculatedResult.amount} {calculatedResult.unit}
                </strong>{' '}
                of <strong>{calculatedResult.chemical}</strong>
              </p>
              <button
                onClick={addToVisit}
                className='mt-2 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700'>
                Add to Visit Log
              </button>
            </>
          ) : (
            <p className='text-green-700'>{calculatedResult.message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export const AlkalinityCalculatorForm: React.FC<AlkalinityCalculatorProps> = ({
  poolVolume,
  currentAlk,
  targetAlk,
  onAddChemical,
}) => {
  const [calculatedResult, setCalculatedResult] = useState<any>(null)

  const calculateAlkalinity = () => {
    if (!currentAlk || !targetAlk) return

    const alkDiff = targetAlk - currentAlk
    if (alkDiff <= 0) {
      setCalculatedResult({
        message: 'Alkalinity is already at or above target',
        amount: 0,
      })
      return
    }

    // Sodium bicarbonate: ~1 lb per 10,000 gallons raises TA by ~10 ppm
    const amount = Math.round((alkDiff / 10) * (poolVolume / 10000) * 100) / 100

    setCalculatedResult({
      chemical: 'Sodium Bicarbonate',
      amount,
      unit: 'pounds',
      alkDiff,
    })
  }

  const addToVisit = () => {
    if (calculatedResult && calculatedResult.amount > 0) {
      onAddChemical(
        calculatedResult.chemical,
        calculatedResult.amount,
        calculatedResult.unit,
        `Raise total alkalinity from ${currentAlk} to ${targetAlk} ppm`
      )
    }
  }

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 gap-3'>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Current TA (ppm)
          </label>
          <input
            type='number'
            value={currentAlk || ''}
            disabled
            className='w-full px-3 py-2 border rounded-md bg-muted/50'
          />
        </div>
        <div>
          <label className='block text-sm font-medium mb-1'>
            Target TA (ppm)
          </label>
          <input
            type='number'
            value={targetAlk}
            disabled
            className='w-full px-3 py-2 border rounded-md bg-muted/50'
          />
        </div>
      </div>

      <button
        onClick={calculateAlkalinity}
        disabled={!currentAlk}
        className='w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300'>
        Calculate Alkalinity Addition
      </button>

      {calculatedResult && (
        <div className='bg-green-50 border border-green-200 rounded-md p-3'>
          {calculatedResult.amount > 0 ? (
            <>
              <p className='font-medium'>Recommendation:</p>
              <p>
                Add{' '}
                <strong>
                  {calculatedResult.amount} {calculatedResult.unit}
                </strong>{' '}
                of <strong>{calculatedResult.chemical}</strong>
              </p>
              <button
                onClick={addToVisit}
                className='mt-2 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700'>
                Add to Visit Log
              </button>
            </>
          ) : (
            <p className='text-green-700'>{calculatedResult.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
