import PoolCalculator from './components/PoolCalculator'
import VersionCheck from './components/VersionCheck'

export default function Home() {
  return (
    <div className='bg-white rounded-4xl text-center'>
      <div className='text-6xl'>🏊‍♀️</div>
      <h1 className='text-4xl font-bold text-gray-900 mb-4'>
        Pool Service Pro
      </h1>
      {/* <VersionCheck /> */}
      <div className='max-w-4xl mx-auto px-4'>
        <PoolCalculator />
      </div>
    </div>
  )
}
