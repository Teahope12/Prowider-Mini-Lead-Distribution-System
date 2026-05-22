import { prisma } from '@/lib/prisma'
import { broadcastEvent } from '../sse/route'

export async function POST(request) {
  try {
    const body = await request.json()
    const { eventId } = body

    // Idempotency check - prevent duplicate processing
    if (eventId) {
      const existingReceipt = await prisma.webhookReceipt.findUnique({
        where: { eventId }
      })

      if (existingReceipt) {
        return Response.json({ 
          message: 'Webhook already processed (idempotency check)', 
          alreadyProcessed: true,
          processedAt: existingReceipt.processed
        })
      }
    }

    // Use transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Reset all providers' leadsAssigned to 0
      const resetProviders = await tx.provider.updateMany({
        data: { leadsAssigned: 0 }
      })

      // Reset allocation counters for fair distribution
      const services = ['Service 1', 'Service 2', 'Service 3']
      for (const service of services) {
        await tx.allocationCounter.upsert({
          where: { serviceType: service },
          update: { lastIndex: 0 },
          create: { serviceType: service, lastIndex: 0 }
        })
      }

      // Record webhook receipt for idempotency
      if (eventId) {
        await tx.webhookReceipt.create({
          data: { eventId }
        })
      }

      return { resetCount: resetProviders.count }
    })

    // Broadcast quota reset event for real-time updates
    broadcastEvent({
      type: 'quotas_reset',
      message: 'All provider quotas have been reset to 10',
      timestamp: new Date().toISOString()
    })

    return Response.json({ 
      message: 'Provider quotas reset successfully',
      success: true,
      providersReset: result.resetCount,
      eventId: eventId || 'none'
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return Response.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
}