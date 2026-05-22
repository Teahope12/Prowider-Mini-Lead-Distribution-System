import { prisma } from '@/lib/prisma'
import { getMandatoryProviders } from '@/lib/allocation/mandatoryRules'
import { getNextProviders } from '@/lib/allocation/fairAllocation'
import { broadcastEvent } from '../sse/route'

export async function POST(request) {
  try {
    const { count = 10 } = await request.json()
    const results = []
    const createdLeads = []

    // Generate unique leads with timestamp to avoid duplicates
    const timestamp = Date.now()
    
    for (let i = 1; i <= count; i++) {
      // Create truly unique phone number using timestamp + index
      const uniqueNumber = `${timestamp}${String(i).padStart(2, '0')}`.slice(-10)
      const serviceType = ['Service 1', 'Service 2', 'Service 3'][(i - 1) % 3]
      
      const leadData = {
        name: `Test User ${i}`,
        phoneNumber: uniqueNumber,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][(i - 1) % 5],
        serviceType: serviceType,
        description: `Bulk test lead #${i} generated at ${new Date().toISOString()}`
      }

      try {
        // Check for duplicate (should never happen with unique numbers)
        const existingLead = await prisma.lead.findUnique({
          where: {
            phoneNumber_serviceType: {
              phoneNumber: leadData.phoneNumber,
              serviceType: leadData.serviceType
            }
          }
        })

        if (existingLead) {
          results.push({ 
            phoneNumber: leadData.phoneNumber, 
            serviceType: leadData.serviceType,
            status: 'duplicate' 
          })
          continue
        }

        // Create lead with allocation
        const result = await prisma.$transaction(async (tx) => {
          const lead = await tx.lead.create({ data: leadData })

          const mandatoryProviderNames = getMandatoryProviders(leadData.serviceType)
          const mandatoryProviders = await tx.provider.findMany({
            where: {
              name: { in: mandatoryProviderNames },
              serviceType: leadData.serviceType,
              leadsAssigned: { lt: 10 }
            }
          })

          if (mandatoryProviders.length !== mandatoryProviderNames.length) {
            throw new Error(`Mandatory providers not available for ${leadData.serviceType}`)
          }

          const remainingSlots = 3 - mandatoryProviders.length
          let fairProviders = []
          
          if (remainingSlots > 0) {
            fairProviders = await getNextProviders(leadData.serviceType, remainingSlots, mandatoryProviderNames)
            if (fairProviders.length !== remainingSlots) {
              throw new Error('Not enough providers available for fair allocation')
            }
          }

          const allProviders = [...mandatoryProviders, ...fairProviders]
          
          for (const provider of allProviders) {
            await tx.leadAssignment.create({
              data: { leadId: lead.id, providerId: provider.id }
            })
            await tx.provider.update({
              where: { id: provider.id },
              data: { leadsAssigned: { increment: 1 } }
            })
          }

          return { lead, providers: allProviders }
        })

        createdLeads.push(result)
        results.push({ 
          phoneNumber: leadData.phoneNumber, 
          serviceType: leadData.serviceType,
          status: 'success',
          assignedTo: result.providers.map(p => p.name).join(', ')
        })
        
        // Broadcast each lead for real-time updates
        broadcastEvent({
          type: 'lead_assigned',
          leadId: result.lead.id,
          customerName: result.lead.name,
          serviceType: result.lead.serviceType,
          assignedProviders: result.providers.map(p => ({ name: p.name })),
          timestamp: new Date().toISOString()
        })
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        results.push({ 
          phoneNumber: leadData.phoneNumber, 
          serviceType: leadData.serviceType,
          status: 'failed', 
          error: error.message 
        })
      }
    }

    return Response.json({
      success: true,
      message: `Generated ${createdLeads.length} out of ${count} leads`,
      results,
      totalCreated: createdLeads.length,
      totalFailed: results.filter(r => r.status === 'failed').length,
      totalDuplicate: results.filter(r => r.status === 'duplicate').length
    })

  } catch (error) {
    console.error('Test generation error:', error)
    return Response.json(
      { error: error.message || 'Failed to generate leads' },
      { status: 500 }
    )
  }
}