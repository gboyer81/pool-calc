import PoolCalculator from '../components/PoolCalculator'
import { AuroraText } from 'components/magicui/aurora-text'

export default function CalculatorPage() {
  return (
    <div className='bg-background rounded-4xl text-center'>
      <div className='text-6xl'>🏊‍♀️</div>
      <h1 className='text-4xl font-bold text-foreground mb-4'>
        <AuroraText>Pool Service Pro</AuroraText>
      </h1>
      <div className='max-w-4xl mx-auto lg:px-4'>
        <PoolCalculator />
      </div>
    </div>
  )
}