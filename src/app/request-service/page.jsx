'use client'

import { useState } from 'react'
import LeadForm from '@/components/LeadForm'

export default function RequestService() {
  const [message, setMessage] = useState(null)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Request a Service</h1>
          <p className="text-gray-600 mt-2">Fill out the form below to submit your service request</p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <LeadForm 
          onSuccess={(data) => {
            setMessage({ type: 'success', text: '✓ Lead submitted successfully! Assigned to ' + 
              data.assignedProviders.map(p => p.name).join(', ') })
            setTimeout(() => setMessage(null), 5000)
          }}
          onError={(error) => {
            setMessage({ type: 'error', text: '✗ ' + error })
            setTimeout(() => setMessage(null), 5000)
          }}
        />

        <div className="mt-6 pt-6 border-t text-xs text-gray-500">
          <p>Note: Same phone number cannot request the same service twice.</p>
          <p>Each request is automatically assigned to 3 providers.</p>
        </div>
      </div>
    </div>
  )
}