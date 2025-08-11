import PoolCalculator from './components/PoolCalculator'
import VersionCheck from './components/VersionCheck'

export default function Home() {
  return (
    <div>
      <h1 className='text-[#4a5568] mb-0 text-2xl font-semibold text-center'>
        🏊‍♀️ Pool Calculator
      </h1>
      <VersionCheck />
      <div className='space-y-6'>
        <PoolCalculator />
      </div>
    </div>
  )
}
