export const dynamic = 'force-dynamic'

// Store active connections globally
if (!global.activeSSEConnections) {
  global.activeSSEConnections = []
}

export async function GET() {
  const encoder = new TextEncoder()
  
  let controllerRef = null
  
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller
      
      // Add controller to active connections
      global.activeSSEConnections.push(controller)
      
      // Send initial connection message
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          type: 'connected', 
          timestamp: new Date().toISOString() 
        })}\n\n`))
      } catch (error) {
        console.error('Failed to send initial message:', error)
      }
      
      // Keep connection alive with heartbeat every 30 seconds
      const heartbeat = setInterval(() => {
        try {
          if (controller && controller.desiredSize !== null) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: new Date().toISOString() 
            })}\n\n`))
          } else {
            clearInterval(heartbeat)
          }
        } catch (error) {
          console.error('Heartbeat failed:', error)
          clearInterval(heartbeat)
        }
      }, 30000)
      
      // Store cleanup function
      controller._cleanup = () => {
        clearInterval(heartbeat)
        const index = global.activeSSEConnections.indexOf(controller)
        if (index > -1) global.activeSSEConnections.splice(index, 1)
      }
    },
    cancel() {
      // Clean up on disconnect
      if (controllerRef && controllerRef._cleanup) {
        controllerRef._cleanup()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    },
  })
}

// Helper function to broadcast events to all connected clients
export function broadcastEvent(eventData) {
  if (global.activeSSEConnections && global.activeSSEConnections.length > 0) {
    const encoder = new TextEncoder()
    const message = encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`)
    
    // Create a copy of connections to avoid modification during iteration
    const connections = [...global.activeSSEConnections]
    
    connections.forEach(controller => {
      try {
        if (controller && controller.desiredSize !== null) {
          controller.enqueue(message)
        }
      } catch (error) {
        console.error('Failed to broadcast to client:', error)
        // Remove dead connection
        const index = global.activeSSEConnections.indexOf(controller)
        if (index > -1) global.activeSSEConnections.splice(index, 1)
      }
    })
  }
}