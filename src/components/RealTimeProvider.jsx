'use client'

import { useEffect, useState } from 'react'

export default function RealTimeProvider({ children, onLeadUpdate, onQuotaReset }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)

  useEffect(() => {
    // Create SSE connection
    const eventSource = new EventSource('/api/sse')
    
    eventSource.onopen = () => {
      console.log('SSE connection established')
      setIsConnected(true)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastEvent(data)
        
        if (data.type === 'lead_assigned' && onLeadUpdate) {
          onLeadUpdate(data)
        } else if (data.type === 'quotas_reset' && onQuotaReset) {
          onQuotaReset(data)
        }
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      setIsConnected(false)
      eventSource.close()
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect SSE...')
      }, 5000)
    }
    
    return () => {
      eventSource.close()
    }
  }, [onLeadUpdate, onQuotaReset])

  return (
    <div>
      <div className="fixed bottom-4 right-4 z-50">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-600 animate-pulse' : 'bg-red-600'
          }`} />
          <span>{isConnected ? 'Live Updates Active' : 'Reconnecting...'}</span>
        </div>
      </div>
      {children}
    </div>
  )
}