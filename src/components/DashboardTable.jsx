'use client'

import { useState } from 'react'
import QuotaDisplay from './QuotaDisplay'

export default function DashboardTable({ providers }) {
  const [selectedService, setSelectedService] = useState('all')
  
  const services = ['all', ...new Set(providers.map(p => p.serviceType))]
  
  const filteredProviders = selectedService === 'all' 
    ? providers 
    : providers.filter(p => p.serviceType === selectedService)
  
  const groupedProviders = filteredProviders.reduce((acc, provider) => {
    if (!acc[provider.serviceType]) acc[provider.serviceType] = []
    acc[provider.serviceType].push(provider)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {services.map(service => (
          <button
            key={service}
            onClick={() => setSelectedService(service)}
            className={`px-4 py-2 rounded ${
              selectedService === service 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {service === 'all' ? 'All Services' : service}
          </button>
        ))}
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(groupedProviders).map(([serviceType, serviceProviders]) => (
          <div key={serviceType} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">{serviceType}</h2>
            <div className="space-y-3">
              {serviceProviders.map(provider => (
                <div key={provider.id} className="border rounded p-3">
                  <div className="font-medium flex justify-between">
                    <span>{provider.name}</span>
                    <span className={`text-sm ${
                      provider.isMandatory ? 'text-purple-600 font-semibold' : 'text-gray-500'
                    }`}>
                      {provider.isMandatory && 'Mandatory'}
                    </span>
                  </div>
                  <QuotaDisplay 
                    assigned={provider.leadsAssigned}
                    quota={provider.monthlyQuota}
                    name=""
                  />
                  {provider.leads && provider.leads.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-blue-600 cursor-pointer">
                        View {provider.leads.length} leads
                      </summary>
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {provider.leads.slice(0, 5).map(lead => (
                          <div key={lead.id} className="text-xs text-gray-600">
                            {lead.name} - {lead.phoneNumber}
                          </div>
                        ))}
                        {provider.leads.length > 5 && (
                          <div className="text-xs text-gray-400">+{provider.leads.length - 5} more</div>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}