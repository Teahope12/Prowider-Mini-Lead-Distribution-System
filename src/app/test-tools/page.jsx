'use client'

import { useState } from 'react'

export default function TestTools() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const addResult = (message, type = 'info') => {
    setResults(prev => [{ message, type, timestamp: new Date() }, ...prev].slice(0, 10))
  }

  const resetQuotas = async () => {
    setLoading(true)
    try {
      const eventId = `reset_${Date.now()}_${Math.random()}`
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      })
      const data = await response.json()
      
      if (response.ok) {
        addResult('✓ Quotas reset successfully! All providers have 10 quota remaining.', 'success')
      } else {
        addResult('✗ Reset failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error) {
      addResult('✗ Network error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const testIdempotency = async () => {
    setLoading(true)
    const eventId = `idempotency_${Date.now()}`
    
    for (let i = 1; i <= 3; i++) {
      try {
        const response = await fetch('/api/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId })
        })
        const data = await response.json()
        
        if (data.alreadyProcessed) {
          addResult(`Call #${i}: Already processed (idempotency working)`, 'info')
        } else if (i === 1) {
          addResult(`Call #${i}: First time - quotas reset`, 'success')
        } else {
          addResult(`Call #${i}: Processed but not duplicate?`, 'warning')
        }
      } catch (error) {
        addResult(`Call #${i}: Failed - ${error.message}`, 'error')
      }
      await new Promise(r => setTimeout(r, 500))
    }
    setLoading(false)
  }

  const generateLeads = async () => {
    setLoading(true)
    addResult('Generating 10 leads... This may take a few seconds.', 'info')
    
    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 10 })
      })
      const data = await response.json()
      
      if (response.ok) {
        addResult(`✓ Generated ${data.totalCreated} leads successfully! Check dashboard for real-time updates.`, 'success')
        addResult(`  - Successful: ${data.totalCreated}, Failed: ${data.totalFailed}, Duplicate: ${data.totalDuplicate}`, 'info')
      } else {
        addResult('✗ Generation failed: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (error) {
      addResult('✗ Network error: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Test Tools</h1>
        <p className="text-gray-500">Webhook simulation and concurrency testing</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">🔄 Webhook Simulation</h2>
            <p className="text-sm text-gray-500">Simulate payment gateway confirmation</p>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={resetQuotas}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
            >
              Reset Provider Quotas (to 10)
            </button>
            <button
              onClick={testIdempotency}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              Test Idempotency (Call Webhook 3x)
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">⚡ Concurrency Test</h2>
            <p className="text-sm text-gray-500">Generate multiple leads simultaneously</p>
          </div>
          <div className="p-4">
            <button
              onClick={generateLeads}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400"
            >
              Generate 10 Leads Instantly
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">📋 Test Results</h2>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500 text-center">Click any button to see results...</p>
          ) : (
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div key={idx} className={`p-2 rounded text-sm ${
                  result.type === 'success' ? 'bg-green-50 text-green-700' :
                  result.type === 'error' ? 'bg-red-50 text-red-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  <span className="text-xs text-gray-400">{result.timestamp.toLocaleTimeString()}</span>
                  {' '}{result.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      
    </div>
  )
}