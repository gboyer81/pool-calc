import PoolCalculator from './components/PoolCalculator'
import { AuroraText } from 'components/magicui/aurora-text'

export default function Home() {
  return (
    <div className='bg-background rounded-4xl text-center'>
      <div className='text-6xl'>🏊‍♀️</div>
      <h1 className='text-4xl font-bold text-foreground mb-4'>
        <AuroraText>Pool Service Pro</AuroraText>
      </h1>
      {/* <VersionCheck /> */}
      <div className='max-w-4xl mx-auto px-4'>
        <PoolCalculator />
      </div>
    </div>
  )
}
