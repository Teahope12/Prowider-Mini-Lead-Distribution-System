'use client'

import { useState } from 'react'

export default function LeadForm({ onSuccess, onError }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    city: '',
    serviceType: 'Service 1',
    description: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setFormData({
          name: '',
          phoneNumber: '',
          city: '',
          serviceType: 'Service 1',
          description: ''
        })
        onSuccess?.(data)
      } else {
        onError?.(data.error || 'Submission failed')
      }
    } catch (error) {
      onError?.('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          required
          pattern="\d{10}"
          title="10 digit phone number"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="10-digit mobile number"
        />
        <p className="text-xs text-gray-500 mt-1">Same number cannot request same service twice</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.city}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your city"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Service Type <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={formData.serviceType}
          onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="Service 1">Service 1</option>
          <option value="Service 2">Service 2</option>
          <option value="Service 3">Service 3</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Describe your service requirements..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  )
}