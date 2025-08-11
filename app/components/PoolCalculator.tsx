'use client'

import React, { useState, useEffect } from 'react'

// Type definitions
interface PoolVolume {
  cubicFeet: number
  gallons: number
  surfaceArea: number
}

interface SaltResult {
  pounds: number
  bags: number
}

interface ChlorineResult {
  amount: number
  unit: string
}

interface PhResult {
  amount: number
  chemical: string
  unit: string
}

interface LSIResult {
  lsi: number
  pHs: number
  factors: {
    A: number
    B: number
    C: number
    D: number
    tempC: number
  }
}

interface LSITargetResult {
  targetPh: number
  pHs: number
  factors: {
    A: number
    B: number
    C: number
    D: number
    tempC: number
  }
}

type CalculatorType =
  | 'volume'
  | 'salt'
  | 'chlorine'
  | 'ph'
  | 'alkalinity'
  | 'calcium'
  | 'cya'
  | 'lsi'
type CalculationMode = 'target' | 'effect' | 'calculate'
type PoolShape = 'rectangular' | 'circular' | 'oval' | 'kidney'

const PoolCalculator: React.FC = () => {
  // State management
  const [currentCalculator, setCurrentCalculator] =
    useState<CalculatorType>('volume')
  const [calculationModes, setCalculationModes] = useState({
    salt: 'target',
    chlorine: 'target',
    ph: 'target',
    alkalinity: 'target',
    calcium: 'target',
    cya: 'target',
    lsi: 'calculate',
  })

  const [usePreciseCalculation, setUsePreciseCalculation] = useState(false)
  const [savedPoolVolume, setSavedPoolVolume] = useState<number | null>(null)
  const [results, setResults] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)

  // Form state
  const [poolShape, setPoolShape] = useState<PoolShape>('rectangular')
  const [formData, setFormData] = useState({
    // Volume calculator
    length: '',
    width: '',
    diameter: '',
    ovalLength: '',
    ovalWidth: '',
    kidneyLength: '',
    kidneyWidth: '',
    avgDepth: '5',

    // Common fields
    gallons: '',
    gallonsChlorine: '',
    gallonsPh: '',
    gallonsAlk: '',
    gallonsCa: '',
    gallonsCya: '',

    // Salt calculator
    targetPpm: '3200',
    currentPpm: '0',
    currentPpmEffect: '',
    saltAmount: '',
    saltUnit: 'pounds',

    // Chlorine calculator
    targetFc: '',
    currentFc: '0',
    currentFcEffect: '',
    chlorineAmount: '',
    chlorineAmountUnit: 'pounds',
    chlorineType: 'granular',

    // pH calculator
    currentPh: '',
    targetPh: '7.5',
    currentPhEffect: '',
    phAmount: '',
    phAmountUnit: 'pounds',
    phChemicalType: 'soda_ash',

    // Alkalinity calculator
    currentAlk: '',
    targetAlk: '100',
    currentAlkEffect: '',
    alkAmount: '',

    // Calcium calculator
    currentCa: '',
    targetCa: '250',
    currentCaEffect: '',
    calciumAmount: '',

    // CYA calculator
    currentCya: '',
    targetCya: '50',
    currentCyaEffect: '',
    cyaAmount: '',

    // LSI calculator
    lsiPh: '',
    lsiTemp: '',
    lsiTempUnit: 'fahrenheit',
    lsiCalcium: '',
    lsiAlkalinity: '',
    lsiTds: '',
    estimateTds: false,

    // LSI target mode
    lsiTargetTemp: '',
    lsiTargetTempUnit: 'fahrenheit',
    lsiTargetCalcium: '',
    lsiTargetAlkalinity: '',
    lsiTargetTds: '',
    estimateTargetTds: false,
    targetLsi: '0.0',
  })

  // Calculation functions
  const calculatePoolVolume = (
    shape: PoolShape,
    dimensions: any,
    avgDepth: number
  ): PoolVolume => {
    if (avgDepth <= 0) throw new Error('Average depth must be greater than 0')

    let surfaceArea: number

    switch (shape) {
      case 'rectangular':
        if (dimensions.length <= 0 || dimensions.width <= 0) {
          throw new Error('Length and width must be greater than 0')
        }
        surfaceArea = dimensions.length * dimensions.width
        break
      case 'circular':
        if (dimensions.diameter <= 0) {
          throw new Error('Diameter must be greater than 0')
        }
        const radius = dimensions.diameter / 2
        surfaceArea = Math.PI * radius * radius
        break
      case 'oval':
        if (dimensions.length <= 0 || dimensions.width <= 0) {
          throw new Error('Length and width must be greater than 0')
        }
        surfaceArea = Math.PI * (dimensions.length / 2) * (dimensions.width / 2)
        break
      case 'kidney':
        if (dimensions.length <= 0 || dimensions.width <= 0) {
          throw new Error('Length and width must be greater than 0')
        }
        surfaceArea = 0.8 * dimensions.length * dimensions.width
        break
      default:
        throw new Error('Invalid pool shape')
    }

    const volumeCubicFeet = surfaceArea * avgDepth
    const volumeGallons = volumeCubicFeet * 7.48052

    return {
      cubicFeet: Math.round(volumeCubicFeet * 100) / 100,
      gallons: Math.round(volumeGallons),
      surfaceArea: Math.round(surfaceArea * 100) / 100,
    }
  }

  const calculateSaltRequired = (
    gallons: number,
    targetPpm = 3200,
    currentPpm = 0
  ): SaltResult => {
    if (gallons <= 0) throw new Error('Pool volume must be greater than 0')
    if (targetPpm < 0 || currentPpm < 0)
      throw new Error('PPM values cannot be negative')
    if (currentPpm >= targetPpm) return { pounds: 0, bags: 0 }

    const waterLiters = gallons * 3.78541
    const waterGrams = waterLiters * 1000
    const additionalPpm = targetPpm - currentPpm
    const saltGramsNeeded = (additionalPpm * waterGrams) / 1000000
    const saltPounds = saltGramsNeeded / 453.592
    const bags = saltPounds / 40

    return {
      pounds: Math.round(saltPounds * 100) / 100,
      bags: Math.round(bags * 100) / 100,
    }
  }

  const calculateChlorine = (
    gallons: number,
    targetFc = 3,
    currentFc = 0,
    chlorineType: string
  ): ChlorineResult => {
    if (gallons <= 0) throw new Error('Pool volume must be greater than 0')
    if (targetFc < 0 || currentFc < 0)
      throw new Error('Free chlorine values cannot be negative')
    if (currentFc >= targetFc) return { amount: 0, unit: 'No chlorine needed' }

    const fcIncrease = targetFc - currentFc
    let amount: number, unit: string

    if (chlorineType === 'liquid') {
      const ouncesNeeded = (gallons / 1000) * fcIncrease
      if (ouncesNeeded < 128) {
        amount = ouncesNeeded
        unit = 'fluid ounces'
      } else {
        amount = ouncesNeeded / 128
        unit = 'gallons'
      }
    } else {
      const ppmPerPoundPer10k: { [key: string]: number } = {
        powder: 10,
        granular: 8,
      }
      const ppmRate = ppmPerPoundPer10k[chlorineType]
      const poundsNeeded = (gallons / 10000) * fcIncrease * (1 / ppmRate)

      if (poundsNeeded < 1) {
        amount = poundsNeeded * 16
        unit = 'ounces'
      } else {
        amount = poundsNeeded
        unit = 'pounds'
      }
    }

    return {
      amount: Math.round(amount * 100) / 100,
      unit: unit,
    }
  }

  const calculatePh = (
    gallons: number,
    currentPh: number,
    targetPh = 7.5
  ): PhResult => {
    if (gallons <= 0) throw new Error('Pool volume must be greater than 0')
    if (
      currentPh < 6.0 ||
      currentPh > 9.0 ||
      targetPh < 6.0 ||
      targetPh > 9.0
    ) {
      throw new Error('pH values must be between 6.0 and 9.0')
    }
    if (Math.abs(currentPh - targetPh) < 0.1) {
      return { amount: 0, chemical: 'No adjustment needed', unit: '' }
    }

    const phDifference = targetPh - currentPh
    let chemical: string, amount: number, unit: string

    if (phDifference > 0) {
      chemical = 'Soda Ash (Sodium Carbonate)'
      amount = Math.abs(phDifference) * gallons * 0.0002
      unit = 'pounds'
    } else {
      chemical = 'Muriatic Acid (31.45%)'
      amount = Math.abs(phDifference) * gallons * 0.0001
      unit = 'gallons'
    }

    return {
      amount: Math.round(amount * 100) / 100,
      chemical: chemical,
      unit: unit,
    }
  }

  const calculateLSI = (
    ph: number,
    tempF: number,
    calcium: number,
    alkalinity: number,
    tds: number
  ): LSIResult => {
    if (ph < 6.0 || ph > 9.0) throw new Error('pH must be between 6.0 and 9.0')
    if (tempF < 32 || tempF > 120)
      throw new Error('Temperature must be between 32°F and 120°F')
    if (calcium <= 0) throw new Error('Calcium hardness must be greater than 0')
    if (alkalinity <= 0)
      throw new Error('Total alkalinity must be greater than 0')
    if (tds <= 0) throw new Error('TDS must be greater than 0')

    const tempC = ((tempF - 32) * 5) / 9
    const A = (Math.log10(tds) - 1) / 10
    const B = -13.12 * Math.log10(tempC + 273) + 34.55
    const C = Math.log10(calcium) - 0.4
    const D = Math.log10(alkalinity)
    const pHs = 9.3 + A + B - (C + D)
    const lsi = ph - pHs

    return {
      lsi: Math.round(lsi * 100) / 100,
      pHs: Math.round(pHs * 100) / 100,
      factors: {
        A: Math.round(A * 1000) / 1000,
        B: Math.round(B * 100) / 100,
        C: Math.round(C * 100) / 100,
        D: Math.round(D * 100) / 100,
        tempC: Math.round(tempC * 10) / 10,
      },
    }
  }

  const estimateTDS = (
    calcium: number,
    alkalinity: number,
    saltPpm = 0,
    cyaPpm = 0
  ): number => {
    let estimatedTDS = 0
    estimatedTDS += calcium * 1.5
    estimatedTDS += alkalinity * 1.2
    estimatedTDS += saltPpm
    estimatedTDS += cyaPpm
    estimatedTDS += 200
    return Math.round(estimatedTDS)
  }

  const interpretLSI = (lsi: number) => {
    if (lsi < -2.0) {
      return {
        status: 'Highly Corrosive',
        color: '#dc3545',
        bgColor: '#f8d7da',
        description:
          'Water is extremely aggressive and will cause severe corrosion to pool equipment, surfaces, and plumbing.',
        recommendations: [
          'Increase pH',
          'Increase alkalinity',
          'Increase calcium hardness',
          'Consider professional consultation',
        ],
      }
    } else if (lsi < -0.5) {
      return {
        status: 'Corrosive',
        color: '#fd7e14',
        bgColor: '#fff3cd',
        description:
          'Water is corrosive and may damage pool equipment and surfaces over time.',
        recommendations: [
          'Increase pH slightly',
          'Consider increasing alkalinity',
          'Check calcium hardness',
        ],
      }
    } else if (lsi < -0.3) {
      return {
        status: 'Slightly Corrosive',
        color: '#ffc107',
        bgColor: '#fff3cd',
        description:
          'Water has a slight tendency to be corrosive but is close to balanced.',
        recommendations: ['Monitor closely', 'Small pH adjustment may help'],
      }
    } else if (lsi <= 0.3) {
      return {
        status: 'Balanced',
        color: '#198754',
        bgColor: '#d1e7dd',
        description:
          'Water is well balanced and will not cause corrosion or scaling.',
        recommendations: [
          'Maintain current levels',
          'Continue regular testing',
        ],
      }
    } else if (lsi <= 0.5) {
      return {
        status: 'Slightly Scale-Forming',
        color: '#ffc107',
        bgColor: '#fff3cd',
        description:
          'Water has a slight tendency to form scale but is close to balanced.',
        recommendations: ['Monitor closely', 'Small pH reduction may help'],
      }
    } else if (lsi <= 2.0) {
      return {
        status: 'Scale-Forming',
        color: '#fd7e14',
        bgColor: '#fff3cd',
        description:
          'Water will tend to form scale deposits on surfaces and equipment.',
        recommendations: [
          'Reduce pH',
          'Consider reducing alkalinity',
          'Check if calcium is too high',
        ],
      }
    } else {
      return {
        status: 'Highly Scale-Forming',
        color: '#dc3545',
        bgColor: '#f8d7da',
        description:
          'Water will rapidly form scale deposits and may cause equipment damage.',
        recommendations: [
          'Reduce pH significantly',
          'Reduce alkalinity',
          'Consider partial drain and refill',
          'Professional consultation recommended',
        ],
      }
    }
  }

  // Event handlers
  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCalculatorSwitch = (type: CalculatorType) => {
    setCurrentCalculator(type)
    setShowResults(false)
  }

  const handleModeSwitch = (calculator: string, mode: CalculationMode) => {
    setCalculationModes((prev) => ({ ...prev, [calculator]: mode }))
  }

  const handleVolumeInput = (gallons: number) => {
    if (gallons && gallons > 0) {
      setSavedPoolVolume(gallons)
    }
  }

  const populateVolumeField = (fieldName: string) => {
    if (savedPoolVolume && !formData[fieldName as keyof typeof formData]) {
      handleInputChange(fieldName, savedPoolVolume.toString())
    }
  }

  const handleSubmit = () => {
    try {
      // Basic validation
      if (currentCalculator === 'volume') {
        if (!formData.avgDepth) throw new Error('Average depth is required')
        if (
          poolShape === 'rectangular' &&
          (!formData.length || !formData.width)
        ) {
          throw new Error('Length and width are required for rectangular pools')
        }
        if (poolShape === 'circular' && !formData.diameter) {
          throw new Error('Diameter is required for circular pools')
        }
        if (
          poolShape === 'oval' &&
          (!formData.ovalLength || !formData.ovalWidth)
        ) {
          throw new Error('Length and width are required for oval pools')
        }
        if (
          poolShape === 'kidney' &&
          (!formData.kidneyLength || !formData.kidneyWidth)
        ) {
          throw new Error('Length and width are required for kidney pools')
        }
      }

      if (currentCalculator === 'salt' && !formData.gallons) {
        throw new Error('Pool volume is required')
      }

      if (currentCalculator === 'chlorine' && !formData.gallonsChlorine) {
        throw new Error('Pool volume is required')
      }

      if (currentCalculator === 'ph' && !formData.gallonsPh) {
        throw new Error('Pool volume is required')
      }

      if (currentCalculator === 'alkalinity' && !formData.gallonsAlk) {
        throw new Error('Pool volume is required')
      }

      if (currentCalculator === 'calcium' && !formData.gallonsCa) {
        throw new Error('Pool volume is required')
      }

      if (currentCalculator === 'cya' && !formData.gallonsCya) {
        throw new Error('Pool volume is required')
      }

      if (currentCalculator === 'lsi' && calculationModes.lsi === 'calculate') {
        if (
          !formData.lsiPh ||
          !formData.lsiTemp ||
          !formData.lsiCalcium ||
          !formData.lsiAlkalinity
        ) {
          throw new Error('All LSI parameters are required')
        }
        if (!formData.lsiTds && !formData.estimateTds) {
          throw new Error('TDS is required or enable estimation')
        }
      }

      if (currentCalculator === 'lsi' && calculationModes.lsi === 'target') {
        if (
          !formData.lsiTargetTemp ||
          !formData.lsiTargetCalcium ||
          !formData.lsiTargetAlkalinity ||
          !formData.targetLsi
        ) {
          throw new Error('All target LSI parameters are required')
        }
        if (!formData.lsiTargetTds && !formData.estimateTargetTds) {
          throw new Error('TDS is required or enable estimation')
        }
      }
      let result: any

      if (currentCalculator === 'volume') {
        const avgDepth = parseFloat(formData.avgDepth)
        let dimensions: any = {}

        switch (poolShape) {
          case 'rectangular':
            dimensions.length = parseFloat(formData.length)
            dimensions.width = parseFloat(formData.width)
            break
          case 'circular':
            dimensions.diameter = parseFloat(formData.diameter)
            break
          case 'oval':
            dimensions.length = parseFloat(formData.ovalLength)
            dimensions.width = parseFloat(formData.ovalWidth)
            break
          case 'kidney':
            dimensions.length = parseFloat(formData.kidneyLength)
            dimensions.width = parseFloat(formData.kidneyWidth)
            break
        }

        const volumeResult = calculatePoolVolume(
          poolShape,
          dimensions,
          avgDepth
        )
        setSavedPoolVolume(volumeResult.gallons)

        result = {
          type: 'volume',
          data: volumeResult,
          poolShape: poolShape,
        }
      } else if (currentCalculator === 'salt') {
        const mode = calculationModes.salt
        const gallons = parseFloat(formData.gallons)

        if (mode === 'target') {
          const targetPpm = parseFloat(formData.targetPpm)
          const currentPpm = parseFloat(formData.currentPpm) || 0
          const saltResult = calculateSaltRequired(
            gallons,
            targetPpm,
            currentPpm
          )

          result = {
            type: 'salt',
            mode: 'target',
            data: saltResult,
            params: { gallons, targetPpm, currentPpm },
            precise: usePreciseCalculation,
          }
        }
      } else if (currentCalculator === 'lsi') {
        const mode = calculationModes.lsi

        if (mode === 'calculate') {
          const ph = parseFloat(formData.lsiPh)
          const temp = parseFloat(formData.lsiTemp)
          const tempF =
            formData.lsiTempUnit === 'celsius' ? (temp * 9) / 5 + 32 : temp
          const calcium = parseFloat(formData.lsiCalcium)
          const alkalinity = parseFloat(formData.lsiAlkalinity)
          let tds = parseFloat(formData.lsiTds)

          if (formData.estimateTds || !tds) {
            tds = estimateTDS(calcium, alkalinity)
          }

          const lsiResult = calculateLSI(ph, tempF, calcium, alkalinity, tds)
          const interpretation = interpretLSI(lsiResult.lsi)

          result = {
            type: 'lsi',
            mode: 'calculate',
            data: lsiResult,
            interpretation: interpretation,
            params: { ph, tempF, calcium, alkalinity, tds },
          }
        } else {
          const targetLsi = parseFloat(formData.targetLsi)
          const temp = parseFloat(formData.lsiTargetTemp)
          const tempF =
            formData.lsiTargetTempUnit === 'celsius'
              ? (temp * 9) / 5 + 32
              : temp
          const calcium = parseFloat(formData.lsiTargetCalcium)
          const alkalinity = parseFloat(formData.lsiTargetAlkalinity)
          let tds = parseFloat(formData.lsiTargetTds)

          if (formData.estimateTargetTds || !tds) {
            tds = estimateTDS(calcium, alkalinity)
          }

          // Calculate target pH using the formula: pH = LSI + pHs
          const tempC = ((tempF - 32) * 5) / 9
          const A = (Math.log10(tds) - 1) / 10
          const B = -13.12 * Math.log10(tempC + 273) + 34.55
          const C = Math.log10(calcium) - 0.4
          const D = Math.log10(alkalinity)
          const pHs = 9.3 + A + B - (C + D)
          const targetPh = targetLsi + pHs

          const targetResult = {
            targetPh: Math.round(targetPh * 100) / 100,
            pHs: Math.round(pHs * 100) / 100,
            factors: {
              A: Math.round(A * 1000) / 1000,
              B: Math.round(B * 100) / 100,
              C: Math.round(C * 100) / 100,
              D: Math.round(D * 100) / 100,
              tempC: Math.round(tempC * 10) / 10,
            },
          }

          result = {
            type: 'lsi',
            mode: 'target',
            data: targetResult,
            params: { targetLsi, tempF, calcium, alkalinity, tds },
          }
        }
      }

      setResults(result)
      setShowResults(true)
    } catch (error) {
      setResults({
        type: 'error',
        message: (error as Error).message,
      })
      setShowResults(true)
    }
  }

  const clearForm = () => {
    setFormData({
      length: '',
      width: '',
      diameter: '',
      ovalLength: '',
      ovalWidth: '',
      kidneyLength: '',
      kidneyWidth: '',
      avgDepth: '5',
      gallons: '',
      gallonsChlorine: '',
      gallonsPh: '',
      gallonsAlk: '',
      gallonsCa: '',
      gallonsCya: '',
      targetPpm: '3200',
      currentPpm: '0',
      currentPpmEffect: '',
      saltAmount: '',
      saltUnit: 'pounds',
      targetFc: '',
      currentFc: '0',
      currentFcEffect: '',
      chlorineAmount: '',
      chlorineAmountUnit: 'pounds',
      chlorineType: 'granular',
      currentPh: '',
      targetPh: '7.5',
      currentPhEffect: '',
      phAmount: '',
      phAmountUnit: 'pounds',
      phChemicalType: 'soda_ash',
      currentAlk: '',
      targetAlk: '100',
      currentAlkEffect: '',
      alkAmount: '',
      currentCa: '',
      targetCa: '250',
      currentCaEffect: '',
      calciumAmount: '',
      currentCya: '',
      targetCya: '50',
      currentCyaEffect: '',
      cyaAmount: '',
      lsiPh: '',
      lsiTemp: '',
      lsiTempUnit: 'fahrenheit',
      lsiCalcium: '',
      lsiAlkalinity: '',
      lsiTds: '',
      estimateTds: false,
      lsiTargetTemp: '',
      lsiTargetTempUnit: 'fahrenheit',
      lsiTargetCalcium: '',
      lsiTargetAlkalinity: '',
      lsiTargetTds: '',
      estimateTargetTds: false,
      targetLsi: '0.0',
    })
    setShowResults(false)
  }

  return (
    <div className='max-w-4xl mx-auto bg-white p-8'>
      <div className='space-y-5'>
        {/* Calculator Type Selector */}
        <div className='mb-5'>
          <label className='block mb-2 font-semibold text-gray-800'>
            Calculator Type:
          </label>
          <select
            value={currentCalculator}
            onChange={(e) =>
              handleCalculatorSwitch(e.target.value as CalculatorType)
            }
            className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
            <option value='volume'>Pool Volume Calculator</option>
            <option value='salt'>Salt Calculator</option>
            <option value='chlorine'>Chlorine Calculator</option>
            <option value='ph'>pH Adjuster Calculator</option>
            <option value='alkalinity'>Total Alkalinity Calculator</option>
            <option value='calcium'>Calcium Hardness Calculator</option>
            <option value='cya'>Cyanuric Acid Calculator</option>
            <option value='lsi'>Langelier Saturation Index (LSI)</option>
          </select>
        </div>

        {/* Volume Indicator */}
        {savedPoolVolume && currentCalculator !== 'volume' && (
          <div className='bg-teal-50 border border-teal-200 flex justify-around items-center rounded-lg p-0.5 mb-5 gap-5'>
            <div>
              <strong>💾 Using saved pool volume:</strong>{' '}
              {savedPoolVolume.toLocaleString()} gallons
            </div>
            <div>
              <button
                onClick={() => setSavedPoolVolume(null)}
                className='flex text-center ml-3 px-3 py-1 text-xs bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400 rounded transition-colors duration-200'>
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Volume Calculator */}
        {currentCalculator === 'volume' && (
          <div className='space-y-5'>
            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Shape:
              </label>
              <select
                value={poolShape}
                onChange={(e) => setPoolShape(e.target.value as PoolShape)}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                <option value='rectangular'>Rectangular</option>
                <option value='circular'>Circular/Round</option>
                <option value='oval'>Oval</option>
                <option value='kidney'>Kidney/Freeform</option>
              </select>
            </div>

            {poolShape === 'rectangular' && (
              <div className='grid grid-cols-2 gap-4'>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Length (feet):
                  </label>
                  <input
                    type='number'
                    value={formData.length}
                    onChange={(e) =>
                      handleInputChange('length', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 32'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Width (feet):
                  </label>
                  <input
                    type='number'
                    value={formData.width}
                    onChange={(e) => handleInputChange('width', e.target.value)}
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 16'
                  />
                </div>
              </div>
            )}

            {poolShape === 'circular' && (
              <div className='mb-5'>
                <label className='block mb-2 font-semibold text-gray-800'>
                  Diameter (feet):
                </label>
                <input
                  type='number'
                  value={formData.diameter}
                  onChange={(e) =>
                    handleInputChange('diameter', e.target.value)
                  }
                  className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                  placeholder='e.g., 24'
                />
              </div>
            )}

            {poolShape === 'oval' && (
              <div className='grid grid-cols-2 gap-4'>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Length (feet):
                  </label>
                  <input
                    type='number'
                    value={formData.ovalLength}
                    onChange={(e) =>
                      handleInputChange('ovalLength', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 30'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Width (feet):
                  </label>
                  <input
                    type='number'
                    value={formData.ovalWidth}
                    onChange={(e) =>
                      handleInputChange('ovalWidth', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 15'
                  />
                </div>
              </div>
            )}

            {poolShape === 'kidney' && (
              <div className='grid grid-cols-2 gap-4'>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Approximate Length (feet):
                  </label>
                  <input
                    type='number'
                    value={formData.kidneyLength}
                    onChange={(e) =>
                      handleInputChange('kidneyLength', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 35'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Approximate Width (feet):
                  </label>
                  <input
                    type='number'
                    value={formData.kidneyWidth}
                    onChange={(e) =>
                      handleInputChange('kidneyWidth', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 18'
                  />
                </div>
              </div>
            )}

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Average Depth (feet):
              </label>
              <input
                type='number'
                value={formData.avgDepth}
                onChange={(e) => handleInputChange('avgDepth', e.target.value)}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 5.5'
                step='0.5'
              />
              <div className='mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded'>
                <ul className='list-disc list-inside space-y-1 text-xs'>
                  <li>Average depth = (shallow depth + deep depth) / 2</li>
                  <li>eg: 3' shallow → 8' deep = (3 + 8) / 2 = 5.5</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentCalculator === 'salt' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('salt', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.salt === 'target'
                      ? 'bg-linear-to-t from-sky-500 to-indigo-500 text-white border-blue-500 transform hover:-translate-y-0.5 hover:shadow-lg'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Amount Needed
                </button>
                <button
                  onClick={() => handleModeSwitch('salt', 'effect')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.salt === 'effect'
                      ? 'bg-linear-to-t from-sky-500 to-indigo-500 text-white border-blue-500 transform hover:-translate-y-0.5 hover:shadow-lg'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Effect of Amount
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.salt === 'target'
                  ? 'Enter your target salt level to calculate how much salt you need to add.'
                  : 'Enter the amount of salt you plan to add to see the resulting salt level.'}
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Volume (gallons):
              </label>
              <input
                type='number'
                value={formData.gallons}
                onChange={(e) => {
                  handleInputChange('gallons', e.target.value)
                  handleVolumeInput(parseFloat(e.target.value))
                }}
                onFocus={() => populateVolumeField('gallons')}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 20000'
              />
            </div>

            {calculationModes.salt === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target Salt Level (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.targetPpm}
                    onChange={(e) =>
                      handleInputChange('targetPpm', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 3200'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Salt Level (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentPpm}
                    onChange={(e) =>
                      handleInputChange('currentPpm', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 0'
                  />
                </div>
              </>
            )}

            <div className='text-center text-md text-gray-600 py-2 my-3'>
              <span className='px-3 py-1 rounded'>
                {usePreciseCalculation
                  ? 'Using Precise Calculation'
                  : 'Using Standard Calculation'}
              </span>
            </div>
          </div>
        )}

        {currentCalculator === 'chlorine' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('chlorine', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.chlorine === 'target'
                      ? 'bg-linear-to-t from-sky-500 to-indigo-500 text-white border-blue-500 transform hover:-translate-y-0.5 hover:shadow-lg'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Amount Needed
                </button>
                <button
                  onClick={() => handleModeSwitch('chlorine', 'effect')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.chlorine === 'effect'
                      ? 'bg-linear-to-t from-sky-500 to-indigo-500 text-white border-blue-500 transform hover:-translate-y-0.5 hover:shadow-lg'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Effect of Amount
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.chlorine === 'target'
                  ? 'Enter your target chlorine level to calculate how much chlorine you need to add.'
                  : 'Enter the amount of chlorine you plan to add to see the resulting chlorine level.'}
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Volume (gallons):
              </label>
              <input
                type='number'
                value={formData.gallonsChlorine}
                onChange={(e) => {
                  handleInputChange('gallonsChlorine', e.target.value)
                  handleVolumeInput(parseFloat(e.target.value))
                }}
                onFocus={() => populateVolumeField('gallonsChlorine')}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 20000'
              />
            </div>

            {calculationModes.chlorine === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target Free Chlorine (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.targetFc}
                    onChange={(e) =>
                      handleInputChange('targetFc', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 3.0'
                    step='0.5'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Free Chlorine (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentFc}
                    onChange={(e) =>
                      handleInputChange('currentFc', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 0.5'
                    step='0.5'
                  />
                </div>
              </>
            )}

            {calculationModes.chlorine === 'effect' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Free Chlorine (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentFcEffect}
                    onChange={(e) =>
                      handleInputChange('currentFcEffect', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 1.0'
                    step='0.5'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Chlorine Amount to Add:
                  </label>
                  <input
                    type='number'
                    value={formData.chlorineAmount}
                    onChange={(e) =>
                      handleInputChange('chlorineAmount', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 16'
                    step='0.1'
                  />
                  <select
                    value={formData.chlorineAmountUnit}
                    onChange={(e) =>
                      handleInputChange('chlorineAmountUnit', e.target.value)
                    }
                    className='w-full mt-2 px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                    <option value='fluid_ounces'>Fluid Ounces (Liquid)</option>
                    <option value='gallons'>Gallons (Liquid)</option>
                    <option value='pounds'>Pounds (Powder/Granular)</option>
                  </select>
                </div>
              </>
            )}

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Chlorine Type:
              </label>
              <select
                value={formData.chlorineType}
                onChange={(e) =>
                  handleInputChange('chlorineType', e.target.value)
                }
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                <option value='liquid'>
                  Liquid Chlorine (12.5% Sodium Hypochlorite)
                </option>
                <option value='powder'>
                  Cal-Hypo Powder (65% Available Chlorine)
                </option>
                <option value='granular'>
                  Dichlor Granular (56% Available Chlorine)
                </option>
              </select>
            </div>
          </div>
        )}

        {/* pH Calculator */}
        {currentCalculator === 'ph' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('ph', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.ph === 'target'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-indigo-500 to-sky-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Amount Needed
                </button>
                <button
                  onClick={() => handleModeSwitch('ph', 'effect')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.ph === 'effect'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Effect of Amount
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.ph === 'target'
                  ? 'Enter your target pH level to calculate how much chemical you need to add.'
                  : 'Enter the amount of chemical you plan to add to see the resulting pH level.'}
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Volume (gallons):
              </label>
              <input
                type='number'
                value={formData.gallonsPh}
                onChange={(e) => {
                  handleInputChange('gallonsPh', e.target.value)
                  handleVolumeInput(parseFloat(e.target.value))
                }}
                onFocus={() => populateVolumeField('gallonsPh')}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 20000'
              />
            </div>

            {calculationModes.ph === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current pH:
                  </label>
                  <input
                    type='number'
                    value={formData.currentPh}
                    onChange={(e) =>
                      handleInputChange('currentPh', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 7.8'
                    step='0.1'
                    min='6.0'
                    max='9.0'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target pH:
                  </label>
                  <input
                    type='number'
                    value={formData.targetPh}
                    onChange={(e) =>
                      handleInputChange('targetPh', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 7.5'
                    step='0.1'
                    min='6.0'
                    max='9.0'
                  />
                </div>
              </>
            )}

            {calculationModes.ph === 'effect' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current pH:
                  </label>
                  <input
                    type='number'
                    value={formData.currentPhEffect}
                    onChange={(e) =>
                      handleInputChange('currentPhEffect', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 7.8'
                    step='0.1'
                    min='6.0'
                    max='9.0'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Chemical Type:
                  </label>
                  <select
                    value={formData.phChemicalType}
                    onChange={(e) =>
                      handleInputChange('phChemicalType', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                    <option value='soda_ash'>Soda Ash (raises pH)</option>
                    <option value='muriatic_acid'>
                      Muriatic Acid (lowers pH)
                    </option>
                  </select>
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Amount to Add:
                  </label>
                  <input
                    type='number'
                    value={formData.phAmount}
                    onChange={(e) =>
                      handleInputChange('phAmount', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 2'
                    step='0.1'
                  />
                  <select
                    value={formData.phAmountUnit}
                    onChange={(e) =>
                      handleInputChange('phAmountUnit', e.target.value)
                    }
                    className='w-full mt-2 px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                    <option value='pounds'>Pounds</option>
                    <option value='gallons'>Gallons</option>
                  </select>
                </div>
              </>
            )}

            {calculationModes.lsi === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Water Temperature:
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetTemp}
                    onChange={(e) =>
                      handleInputChange('lsiTargetTemp', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 80'
                  />
                  <select
                    value={formData.lsiTargetTempUnit}
                    onChange={(e) =>
                      handleInputChange('lsiTargetTempUnit', e.target.value)
                    }
                    className='w-full mt-2 px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                    <option value='fahrenheit'>Fahrenheit (°F)</option>
                    <option value='celsius'>Celsius (°C)</option>
                  </select>
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Calcium Hardness (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetCalcium}
                    onChange={(e) =>
                      handleInputChange('lsiTargetCalcium', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 250'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Total Alkalinity (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetAlkalinity}
                    onChange={(e) =>
                      handleInputChange('lsiTargetAlkalinity', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 100'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Total Dissolved Solids (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetTds}
                    onChange={(e) =>
                      handleInputChange('lsiTargetTds', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 1500'
                    disabled={formData.estimateTargetTds}
                  />
                  <div className='mt-2 p-2 bg-gray-50 rounded'>
                    <label className='flex items-center text-sm'>
                      <input
                        type='checkbox'
                        checked={formData.estimateTargetTds}
                        onChange={(e) => {
                          handleInputChange(
                            'estimateTargetTds',
                            e.target.checked.toString()
                          )
                          if (
                            e.target.checked &&
                            formData.lsiTargetCalcium &&
                            formData.lsiTargetAlkalinity
                          ) {
                            const estimated = estimateTDS(
                              parseFloat(formData.lsiTargetCalcium),
                              parseFloat(formData.lsiTargetAlkalinity)
                            )
                            handleInputChange(
                              'lsiTargetTds',
                              estimated.toString()
                            )
                          }
                        }}
                        className='mr-2'
                      />
                      <span className='text-gray-600'>
                        Estimate TDS if unknown
                      </span>
                    </label>
                  </div>
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target LSI:
                  </label>
                  <input
                    type='number'
                    value={formData.targetLsi}
                    onChange={(e) =>
                      handleInputChange('targetLsi', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 0.0'
                    step='0.1'
                    min='-2.0'
                    max='2.0'
                  />
                  <div className='mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded'>
                    Ideal range: -0.3 to +0.3 (0.0 = perfectly balanced)
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* LSI Calculator */}
        {currentCalculator === 'lsi' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('lsi', 'calculate')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.lsi === 'calculate'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Current LSI
                </button>
                <button
                  onClick={() => handleModeSwitch('lsi', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.lsi === 'target'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Find Target pH
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.lsi === 'calculate'
                  ? "Calculate your water's Langelier Saturation Index to determine if it's balanced, corrosive, or scale-forming."
                  : 'Enter your desired LSI to calculate what pH you need for balanced water.'}
              </div>
            </div>

            {calculationModes.lsi === 'calculate' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current pH:
                  </label>
                  <input
                    type='number'
                    value={formData.lsiPh}
                    onChange={(e) => handleInputChange('lsiPh', e.target.value)}
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 7.6'
                    step='0.1'
                    min='6.0'
                    max='9.0'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Water Temperature:
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTemp}
                    onChange={(e) =>
                      handleInputChange('lsiTemp', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 80'
                  />
                  <select
                    value={formData.lsiTempUnit}
                    onChange={(e) =>
                      handleInputChange('lsiTempUnit', e.target.value)
                    }
                    className='w-full mt-2 px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                    <option value='fahrenheit'>Fahrenheit (°F)</option>
                    <option value='celsius'>Celsius (°C)</option>
                  </select>
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Calcium Hardness (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiCalcium}
                    onChange={(e) =>
                      handleInputChange('lsiCalcium', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 250'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Total Alkalinity (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiAlkalinity}
                    onChange={(e) =>
                      handleInputChange('lsiAlkalinity', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 100'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Total Dissolved Solids (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTds}
                    onChange={(e) =>
                      handleInputChange('lsiTds', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 1500'
                    disabled={formData.estimateTds}
                  />
                  <div className='mt-2 p-2 bg-gray-50 rounded'>
                    <label className='flex items-center text-sm'>
                      <input
                        type='checkbox'
                        checked={formData.estimateTds}
                        onChange={(e) => {
                          handleInputChange(
                            'estimateTds',
                            e.target.checked.toString()
                          )
                          if (
                            e.target.checked &&
                            formData.lsiCalcium &&
                            formData.lsiAlkalinity
                          ) {
                            const estimated = estimateTDS(
                              parseFloat(formData.lsiCalcium),
                              parseFloat(formData.lsiAlkalinity)
                            )
                            handleInputChange('lsiTds', estimated.toString())
                          }
                        }}
                        className='mr-2'
                      />
                      <span className='text-gray-600'>
                        Estimate TDS if unknown
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {calculationModes.lsi === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Water Temperature:
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetTemp}
                    onChange={(e) =>
                      handleInputChange('lsiTargetTemp', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 80'
                  />
                  <select
                    value={formData.lsiTargetTempUnit}
                    onChange={(e) =>
                      handleInputChange('lsiTargetTempUnit', e.target.value)
                    }
                    className='w-full mt-2 px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'>
                    <option value='fahrenheit'>Fahrenheit (°F)</option>
                    <option value='celsius'>Celsius (°C)</option>
                  </select>
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Calcium Hardness (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetCalcium}
                    onChange={(e) =>
                      handleInputChange('lsiTargetCalcium', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 250'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Total Alkalinity (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetAlkalinity}
                    onChange={(e) =>
                      handleInputChange('lsiTargetAlkalinity', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 100'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Total Dissolved Solids (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.lsiTargetTds}
                    onChange={(e) =>
                      handleInputChange('lsiTargetTds', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 1500'
                    disabled={formData.estimateTargetTds}
                  />
                  <div className='mt-2 p-2 bg-gray-50 rounded'>
                    <label className='flex items-center text-sm'>
                      <input
                        type='checkbox'
                        checked={formData.estimateTargetTds}
                        onChange={(e) => {
                          handleInputChange(
                            'estimateTargetTds',
                            e.target.checked.toString()
                          )
                          if (
                            e.target.checked &&
                            formData.lsiTargetCalcium &&
                            formData.lsiTargetAlkalinity
                          ) {
                            const estimated = estimateTDS(
                              parseFloat(formData.lsiTargetCalcium),
                              parseFloat(formData.lsiTargetAlkalinity)
                            )
                            handleInputChange(
                              'lsiTargetTds',
                              estimated.toString()
                            )
                          }
                        }}
                        className='mr-2'
                      />
                      <span className='text-gray-600'>
                        Estimate TDS if unknown
                      </span>
                    </label>
                  </div>
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target LSI:
                  </label>
                  <input
                    type='number'
                    value={formData.targetLsi}
                    onChange={(e) =>
                      handleInputChange('targetLsi', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 0.0'
                    step='0.1'
                    min='-2.0'
                    max='2.0'
                  />
                  <div className='mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded'>
                    Ideal range: -0.3 to +0.3 (0.0 = perfectly balanced)
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Alkalinity Calculator */}
        {currentCalculator === 'alkalinity' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('alkalinity', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.alkalinity === 'target'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Amount Needed
                </button>
                <button
                  onClick={() => handleModeSwitch('alkalinity', 'effect')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.alkalinity === 'effect'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Effect of Amount
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.alkalinity === 'target'
                  ? 'Enter your target alkalinity level to calculate how much sodium bicarbonate you need to add.'
                  : 'Enter the amount of sodium bicarbonate you plan to add to see the resulting alkalinity level.'}
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Volume (gallons):
              </label>
              <input
                type='number'
                value={formData.gallonsAlk}
                onChange={(e) => {
                  handleInputChange('gallonsAlk', e.target.value)
                  handleVolumeInput(parseFloat(e.target.value))
                }}
                onFocus={() => populateVolumeField('gallonsAlk')}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 20000'
              />
            </div>

            {calculationModes.alkalinity === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Total Alkalinity (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentAlk}
                    onChange={(e) =>
                      handleInputChange('currentAlk', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 60'
                    step='10'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target Total Alkalinity (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.targetAlk}
                    onChange={(e) =>
                      handleInputChange('targetAlk', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 100'
                    step='10'
                  />
                </div>
              </>
            )}

            {calculationModes.alkalinity === 'effect' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Total Alkalinity (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentAlkEffect}
                    onChange={(e) =>
                      handleInputChange('currentAlkEffect', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 60'
                    step='10'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Sodium Bicarbonate Amount (pounds):
                  </label>
                  <input
                    type='number'
                    value={formData.alkAmount}
                    onChange={(e) =>
                      handleInputChange('alkAmount', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 3'
                    step='0.1'
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Calcium Calculator */}
        {currentCalculator === 'calcium' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('calcium', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.calcium === 'target'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Amount Needed
                </button>
                <button
                  onClick={() => handleModeSwitch('calcium', 'effect')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.calcium === 'effect'
                      ? 'bg-linear-to-tl from-sky-500 to-indigo-500 transform hover:-translate-y-0.5 hover:shadow-lg text-white border-blue-500'
                      : 'bg-linear-to-tl from-gray-200 to-gray-50 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Effect of Amount
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.calcium === 'target'
                  ? 'Enter your target calcium hardness level to calculate how much calcium chloride you need to add.'
                  : 'Enter the amount of calcium chloride you plan to add to see the resulting calcium hardness level.'}
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Volume (gallons):
              </label>
              <input
                type='number'
                value={formData.gallonsCa}
                onChange={(e) => {
                  handleInputChange('gallonsCa', e.target.value)
                  handleVolumeInput(parseFloat(e.target.value))
                }}
                onFocus={() => populateVolumeField('gallonsCa')}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 20000'
              />
            </div>

            {calculationModes.calcium === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Calcium Hardness (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentCa}
                    onChange={(e) =>
                      handleInputChange('currentCa', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 150'
                    step='10'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target Calcium Hardness (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.targetCa}
                    onChange={(e) =>
                      handleInputChange('targetCa', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 250'
                    step='10'
                  />
                </div>
              </>
            )}

            {calculationModes.calcium === 'effect' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Calcium Hardness (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentCaEffect}
                    onChange={(e) =>
                      handleInputChange('currentCaEffect', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 150'
                    step='10'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Calcium Chloride Amount (pounds):
                  </label>
                  <input
                    type='number'
                    value={formData.calciumAmount}
                    onChange={(e) =>
                      handleInputChange('calciumAmount', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 2.5'
                    step='0.1'
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* CYA Calculator */}
        {currentCalculator === 'cya' && (
          <div className='space-y-5'>
            <div className='bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-5'>
              <div className='flex gap-3 mb-4'>
                <button
                  onClick={() => handleModeSwitch('cya', 'target')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.cya === 'target'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Amount Needed
                </button>
                <button
                  onClick={() => handleModeSwitch('cya', 'effect')}
                  className={`flex-1 px-4 py-2 border-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    calculationModes.cya === 'effect'
                      ? 'bg-linear-to-tl transform hover:-translate-y-0.5 hover:shadow-lg from-sky-500 to-indigo-500 text-white border-blue-500'
                      : 'bg-gray-200 text-gray-900 border-gray-300 hover:bg-gray-100 hover:border-blue-400'
                  }`}>
                  Calculate Effect of Amount
                </button>
              </div>
              <div className='text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded mb-4'>
                {calculationModes.cya === 'target'
                  ? 'Enter your target cyanuric acid level to calculate how much stabilizer you need to add.'
                  : 'Enter the amount of cyanuric acid you plan to add to see the resulting stabilizer level.'}
              </div>
            </div>

            <div className='mb-5'>
              <label className='block mb-2 font-semibold text-gray-800'>
                Pool Volume (gallons):
              </label>
              <input
                type='number'
                value={formData.gallonsCya}
                onChange={(e) => {
                  handleInputChange('gallonsCya', e.target.value)
                  handleVolumeInput(parseFloat(e.target.value))
                }}
                onFocus={() => populateVolumeField('gallonsCya')}
                className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                placeholder='e.g., 20000'
              />
            </div>

            {calculationModes.cya === 'target' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Cyanuric Acid (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentCya}
                    onChange={(e) =>
                      handleInputChange('currentCya', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 10'
                    step='5'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Target Cyanuric Acid (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.targetCya}
                    onChange={(e) =>
                      handleInputChange('targetCya', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 50'
                    step='5'
                  />
                </div>
              </>
            )}

            {calculationModes.cya === 'effect' && (
              <>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Current Cyanuric Acid (ppm):
                  </label>
                  <input
                    type='number'
                    value={formData.currentCyaEffect}
                    onChange={(e) =>
                      handleInputChange('currentCyaEffect', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 10'
                    step='5'
                  />
                </div>
                <div className='mb-5'>
                  <label className='block mb-2 font-semibold text-gray-800'>
                    Cyanuric Acid Amount (pounds):
                  </label>
                  <input
                    type='number'
                    value={formData.cyaAmount}
                    onChange={(e) =>
                      handleInputChange('cyaAmount', e.target.value)
                    }
                    className='w-full px-3 py-3 border-2 border-gray-300 rounded-lg text-base transition-colors duration-300 focus:outline-none focus:border-blue-500'
                    placeholder='e.g., 1.5'
                    step='0.1'
                  />
                </div>
              </>
            )}
          </div>
        )}
        {/* Removed duplicate unintended LSI block that caused unmatched parenthesis */}

        {/* Action Buttons */}
        <div className='flex gap-4 my-8'>
          <button
            onClick={handleSubmit}
            className='flex-1 px-5 py-3 text-base font-semibold rounded-lg text-white transition-all duration-300 cursor-pointer transform hover:-translate-y-0.5 hover:shadow-lg bg-linear-to-br from-[var(--secondarybg)] to-[var(--primarybg)] '
            style={{
              border: 'none',
            }}>
            {currentCalculator === 'volume' && 'Calculate Pool Volume'}
            {currentCalculator === 'salt' &&
              (calculationModes.salt === 'target'
                ? 'Calculate Salt Needed'
                : 'Calculate Salt Effect')}
            {currentCalculator === 'chlorine' &&
              (calculationModes.chlorine === 'target'
                ? 'Calculate Chlorine Needed'
                : 'Calculate Chlorine Effect')}
            {currentCalculator === 'ph' &&
              (calculationModes.ph === 'target'
                ? 'Calculate pH Adjuster Needed'
                : 'Calculate pH Effect')}
            {currentCalculator === 'alkalinity' &&
              (calculationModes.alkalinity === 'target'
                ? 'Calculate Alkalinity Increaser Needed'
                : 'Calculate Alkalinity Effect')}
            {currentCalculator === 'calcium' &&
              (calculationModes.calcium === 'target'
                ? 'Calculate Calcium Needed'
                : 'Calculate Calcium Effect')}
            {currentCalculator === 'cya' &&
              (calculationModes.cya === 'target'
                ? 'Calculate Stabilizer Needed'
                : 'Calculate Stabilizer Effect')}
            {currentCalculator === 'lsi' &&
              (calculationModes.lsi === 'calculate'
                ? 'Calculate LSI'
                : 'Calculate Target pH')}
          </button>
          <button
            onClick={clearForm}
            className='flex-1 px-5 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 bg-gray-200 transform hover:-translate-y-0.5 hover:shadow-lg text-gray-900'>
            Clear Form
          </button>
          {currentCalculator === 'salt' && (
            <button
              onClick={() => setUsePreciseCalculation(!usePreciseCalculation)}
              className='px-4 py-2 text-sm font-medium rounded-lg text-white transition-all duration-300 cursor-pointer bg-green-500 hover:bg-green-600'>
              Toggle Precision
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {showResults && results && (
        <div className='mt-6'>
          {results.type === 'error' ? (
            <div className='bg-red-100 text-red-800 p-4 rounded-lg mt-5 border-l-4 border-red-400'>
              <strong>Error:</strong> {results.message}
            </div>
          ) : results.type === 'volume' ? (
            <div className='bg-gray-100 bg-opacity-80 p-6 rounded-lg mt-6 border-l-4 border-blue-600'>
              <h3 className='mt-0 text-gray-800 text-xl font-semibold mb-4'>
                Pool Volume Calculation
              </h3>
              <p className='text-gray-700 mb-4'>
                Your {results.poolShape} pool volume:
              </p>
              <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='bg-gray-200 p-4 rounde9-lg text-center10shadow-md'>
                  blue{' '}
                  <div className='text-2xl font-bold text-blue-800'>
                    {results.data.gallons.toLocaleString()}
                  </div>
                  <div className='text-gray-600 text-sm mt-1'>Gallons</div>
                </div>
                <div className='bg-white p-4 rounded-lg text-center shadow-md'>
                  <div className='text-2xl font-bold text-blue-800'>
                    {results.data.cubicFeet}
                  </div>
                  <div className='text-gray-600 text-sm mt-1'>Cubic Feet</div>
                </div>
              </div>
              <div className='bg-blue-100 text-blue-700 p-4 rounded-lg mt-5 border-l-4 border-blue-500'>
                <strong>Surface Area:</strong> {results.data.surfaceArea} sq ft
                <br />
                <strong>Note:</strong> This is an approximation. Actual volume
                may vary due to pool features, steps, and irregular shapes.
              </div>
            </div>
          ) : results.type === 'salt' && results.mode === 'target' ? (
            results.data.pounds === 0 ? (
              <div className='bg-blue-100 text-blue-700 p-4 rounded-lg mt-5 border-l-4 border-blue-500'>
                <h3 className='mt-0 text-gray-800 text-xl font-semibold mb-2'>
                  No Salt Needed
                </h3>
                <p>
                  Your pool already has {results.params.currentPpm} ppm, which
                  meets or exceeds your target of {results.params.targetPpm}{' '}
                  ppm.
                </p>
              </div>
            ) : (
              <div className='bg-gray-100 bg-opacity-80 p-6 rounded-lg mt-6 border-l-4 border-blue-600'>
                <h3 className='mt-0 text-gray-800 text-xl font-semibold mb-4'>
                  Salt Required ({results.precise ? 'Precise' : 'Standard'}{' '}
                  Calculation)
                </h3>
                <p className='text-gray-700 mb-4'>
                  To bring your {results.params.gallons.toLocaleString()} gallon
                  pool from {results.params.currentPpm} ppm to{' '}
                  {results.params.targetPpm} ppm:
                </p>
                <div className='grid grid-cols-2 gap-4 mt-4'>
                  <div className='bg-white p-4 rounded-lg text-center shadow-md'>
                    <div className='text-2xl font-bold text-blue-800'>
                      {results.data.pounds}
                    </div>
                    <div className='text-gray-600 text-sm mt-1'>Pounds</div>
                  </div>
                  <div className='bg-white p-4 rounded-lg text-center shadow-md'>
                    <div className='text-2xl font-bold text-blue-800'>
                      {results.data.bags}
                    </div>
                    <div className='text-gray-600 text-sm mt-1'>40 lb Bags</div>
                  </div>
                </div>
              </div>
            )
          ) : results.type === 'lsi' && results.mode === 'calculate' ? (
            <div className='bg-gray-100 bg-opacity-80 p-6 rounded-lg mt-6 border-l-4 border-blue-600'>
              <h3 className='mt-0 text-gray-800 text-xl font-semibold mb-4'>
                Langelier Saturation Index Results
              </h3>
              <div className='text-center mb-6'>
                <div
                  className='text-4xl font-bold mb-2'
                  style={{ color: results.interpretation.color }}>
                  LSI: {results.data.lsi}
                </div>
                <div
                  className='text-xl font-bold mb-4'
                  style={{ color: results.interpretation.color }}>
                  {results.interpretation.status}
                </div>
                <div
                  className='p-4 rounded-lg border-l-4'
                  style={{
                    backgroundColor: results.interpretation.bgColor,
                    color: results.interpretation.color,
                    borderLeftColor: results.interpretation.color,
                  }}>
                  {results.interpretation.description}
                </div>
              </div>
              <div className='grid grid-cols-3 gap-4 text-center text-sm mb-4'>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-800'>
                    pH: {results.params.ph}
                  </div>
                  <div className='text-gray-600 text-xs'>Current Level</div>
                </div>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-800'>
                    {results.params.tempF}°F
                  </div>
                  <div className='text-gray-600 text-xs'>Temperature</div>
                </div>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-800'>
                    {results.params.calcium} ppm
                  </div>
                  <div className='text-gray-600 text-xs'>Calcium</div>
                </div>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-800'>
                    {results.params.alkalinity} ppm
                  </div>
                  <div className='text-gray-600 text-xs'>Alkalinity</div>
                </div>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-800'>
                    {results.params.tds} ppm
                  </div>
                  <div className='text-gray-600 text-xs'>TDS</div>
                </div>
                <div className='bg-white p-3 rounded-lg shadow-sm'>
                  <div className='text-lg font-bold text-blue-800'>
                    LSI: {results.data.lsi}
                  </div>
                  <div className='text-gray-600 text-xs'>Index</div>
                </div>
              </div>
              {results.interpretation.recommendations.length > 0 && (
                <div className='bg-blue-100 text-blue-700 p-4 rounded-lg mt-5 border-l-4 border-blue-500'>
                  <strong>Recommendations:</strong>
                  <ul className='list-disc list-inside mt-2 space-y-1'>
                    {results.interpretation.recommendations.map(
                      (rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
              <div className='mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600'>
                <strong>Langelier Formula:</strong> LSI = pH - pHs, where pHs ={' '}
                {results.data.pHs}
                <br />
                <strong>Calculation Factors:</strong> A={results.data.factors.A}{' '}
                (TDS), B={results.data.factors.B} (Temp), C=
                {results.data.factors.C} (Ca), D={results.data.factors.D} (Alk)
              </div>
            </div>
          ) : results.type === 'lsi' && results.mode === 'target' ? (
            <div className='bg-gray-100 bg-opacity-80 p-6 rounded-lg mt-6 border-l-4 border-blue-600'>
              <h3 className='mt-0 text-gray-800 text-xl font-semibold mb-4'>
                Target pH Calculation
              </h3>
              <p className='text-gray-700 mb-4'>
                To achieve an LSI of {results.params.targetLsi} with your
                current water conditions:
              </p>
              <div className='grid grid-cols-2 gap-4 mt-4'>
                <div className='bg-white p-4 rounded-lg text-center shadow-md'>
                  <div className='text-2xl font-bold text-blue-800'>
                    {results.data.targetPh}
                  </div>
                  <div className='text-gray-600 text-sm mt-1'>Target pH</div>
                </div>
                <div className='bg-white p-4 rounded-lg text-center shadow-md'>
                  <div className='text-2xl font-bold text-blue-800'>
                    {results.params.targetLsi}
                  </div>
                  <div className='text-gray-600 text-sm mt-1'>Target LSI</div>
                </div>
              </div>
              <div className='bg-blue-100 text-blue-700 p-4 rounded-lg mt-5 border-l-4 border-blue-500'>
                <strong>Current Conditions:</strong>
                <br />
                Temperature: {results.params.tempF}°F | Calcium:{' '}
                {results.params.calcium} ppm | Alkalinity:{' '}
                {results.params.alkalinity} ppm | TDS: {results.params.tds} ppm
              </div>
              <div className='mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600'>
                <strong>Langelier Formula:</strong> LSI = pH - pHs, where pHs ={' '}
                {results.data.pHs}
                <br />
                <strong>Calculation Factors:</strong> A={results.data.factors.A}{' '}
                (TDS), B={results.data.factors.B} (Temp), C=
                {results.data.factors.C} (Ca), D={results.data.factors.D} (Alk)
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default PoolCalculator
