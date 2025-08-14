const Navigation = () => {
  return (
    <div className='sticky top-0 left-0 z-50 h-16 max-w-3xl mx-auto flex items-center bg-white mb-3 py-3 px-2 rounded-2xl shadow-lg'>
      <nav className='flex items-center justify-between w-full px-4 overflow-x-auto'>
        <a href='/' className='text-gray-600 hover:text-blue-800'>
          📊 Dashboard
        </a>

        <a href='/clients' className='text-gray-600 hover:text-blue-600'>
          👥 Clients
        </a>

        <a href='/schedule' className='text-gray-600 hover:text-blue-600'>
          📅 Schedule
        </a>

        <a href='/routes' className='text-gray-600 hover:text-blue-600'>
          🗺️ Routes
        </a>

        <a href='/calculator' className='text-gray-600 hover:text-blue-600'>
          🧮 Calculator
        </a>

        <a href='/reports' className='text-gray-600 hover:text-blue-600'>
          📈 Reports
        </a>

        <a href='/inventory' className='text-gray-600 hover:text-blue-600'>
          📦 Inventory
        </a>
      </nav>
    </div>
  )
}

export default Navigation
