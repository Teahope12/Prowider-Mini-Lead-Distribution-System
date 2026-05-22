'use client'

import { useState, useEffect } from 'react'
import QuotaDisplay from '@/components/QuotaDisplay'

export default function Dashboard() {
  const [providers, setProviders] = useState([])
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchData = async () => {
    try {
      const response = await fetch('/api/dashboard')
      const data = await response.json()
      setProviders(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    const eventSource = new EventSource('/api/sse')
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'lead_assigned' || data.type === 'quotas_reset') {
        fetchData()
      }
    }
    
    return () => eventSource.close()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (selectedProvider) {
    return (
      <div>
        <button 
          onClick={() => setSelectedProvider(null)}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to all providers
        </button>
        
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold">{selectedProvider.name}</h1>
            <p className="text-gray-500">{selectedProvider.serviceType}</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600">Leads Assigned</div>
                <div className="text-2xl font-bold">{selectedProvider.leadsAssigned}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600">Monthly Quota</div>
                <div className="text-2xl font-bold">{selectedProvider.monthlyQuota}</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-sm text-yellow-600">Remaining</div>
                <div className="text-2xl font-bold">{selectedProvider.monthlyQuota - selectedProvider.leadsAssigned}</div>
              </div>
            </div>
            
            <h2 className="font-semibold mb-3">Assigned Leads</h2>
            {selectedProvider.leads?.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {selectedProvider.leads.map(lead => (
                  <div key={lead.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="font-medium">{lead.name}</div>
                    <div className="text-sm text-gray-500">📞 {lead.phoneNumber} | 📍 {lead.city}</div>
                    <div className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString()}</div>
                    {lead.description && <div className="text-sm mt-1">{lead.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No leads assigned yet.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Provider Dashboard</h1>
        <p className="text-gray-500">Live updates - {lastUpdate?.toLocaleTimeString()}</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Service 1', 'Service 2', 'Service 3'].map(service => {
          const serviceProviders = providers.filter(p => p.serviceType === service)
          if (serviceProviders.length === 0) return null
          
          return (
            <div key={service} className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h2 className="font-semibold text-lg">{service}</h2>
              </div>
              <div className="p-4 space-y-3">
                {serviceProviders.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => setSelectedProvider(provider)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium">{provider.name}</span>
                      {provider.isMandatory && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Mandatory</span>
                      )}
                    </div>
                    <QuotaDisplay 
                      assigned={provider.leadsAssigned}
                      quota={provider.monthlyQuota}
                    />
                    <div className="text-sm text-gray-500 mt-2">
                      {provider.leads?.length || 0} leads assigned
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}