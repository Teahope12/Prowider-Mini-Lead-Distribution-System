import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm border p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Provider Lead Distribution System
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Automated lead distribution with fair allocation, real-time updates, and webhook integration
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="/request-service" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
            Submit Service Request
          </Link>
          <Link href="/dashboard" className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition">
            View Provider Dashboard
          </Link>
          <Link href="/test-tools" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
            Test Tools
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">📊 System Stats</h2>
          <div className="space-y-2 text-gray-600">
            <p>• 8 Providers across 3 Services</p>
            <p>• Monthly quota: 10 leads per provider</p>
            <p>• Each lead assigned to exactly 3 providers</p>
            <p>• Round-robin fair allocation</p>
            <p>• Real-time updates via SSE</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Mandatory Rules</h2>
          <div className="space-y-2">
            <div className="text-sm"><span className="font-semibold">Service 1:</span> Provider 1 (Mandatory)</div>
            <div className="text-sm"><span className="font-semibold">Service 2:</span> Provider 5 (Mandatory)</div>
            <div className="text-sm"><span className="font-semibold">Service 3:</span> Provider 1 & Provider 4 (Mandatory)</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">🔄 Fair Allocation Pools</h2>
          <div className="space-y-2">
            <div className="text-sm"><span className="font-semibold">Service 1:</span> Providers 2, 3, 4</div>
            <div className="text-sm"><span className="font-semibold">Service 2:</span> Providers 6, 7, 8</div>
            <div className="text-sm"><span className="font-semibold">Service 3:</span> Providers 2, 3, 5, 6, 7, 8</div>
          </div>
        </div>

        
      </div>
    </div>
  )
}