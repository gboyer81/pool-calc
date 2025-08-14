import PoolCalculator from './components/PoolCalculator'
import VersionCheck from './components/VersionCheck'

export default function Home() {
  return (
    <div className='bg-white rounded-4xl pt-4'>
      <h1 className='text-[#4a5568] mb-0 text-2xl font-semibold text-center mt-2'>
        🏊‍♀️ Pool Calculator
      </h1>
      <VersionCheck />
      <div className='space-y-6 '>
        <PoolCalculator />
      </div>
    </div>
  )
}
