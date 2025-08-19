import PoolCalculator from './components/PoolCalculator'
import VersionCheck from './components/VersionCheck'

export default function Home() {
  return (
    <div className='bg-white rounded-4xl text-center'>
      <div className='text-6xl'>🏊‍♀️</div>
      <h1 className='text-3xl font-bold text-gray-900 mb-6'>
        Pool Service Pro
      </h1>
      <VersionCheck />
      <div>
        <PoolCalculator />
      </div>
    </div>
  )
}
