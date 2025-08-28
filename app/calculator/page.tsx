'use client'

import { useEffect } from 'react'
import PoolCalculator from '../components/PoolCalculator'
import { AuroraText } from 'components/magicui/aurora-text'
import { useBreadcrumb } from '@/components/Navigation'

export default function CalculatorPage() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Pool Calculator' }
    ])
  }, [setBreadcrumbs])

  return (
    <div className='bg-background rounded-4xl'>
      
      <div className='text-center'>
        <div className='text-6xl'>🏊‍♀️</div>
        <h1 className='text-4xl font-bold text-foreground mb-4'>
          <AuroraText>Pool Service Pro</AuroraText>
        </h1>
        <div className='max-w-4xl mx-auto lg:px-4'>
          <PoolCalculator />
        </div>
      </div>
    </div>
  )
}