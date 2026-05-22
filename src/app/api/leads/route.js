import { prisma } from '@/lib/prisma'
import { getMandatoryProviders } from '@/lib/allocation/mandatoryRules'
import { getNextProviders } from '@/lib/allocation/fairAllocation'
import { broadcastEvent } from '../sse/route'

export async function POST(request) {
  try {
    const body = await request.json()
    const { name, phoneNumber, city, serviceType, description } = body

    // Validate required fields
    if (!name || !phoneNumber || !city || !serviceType) {
      return Response.json(
        { error: 'Missing required fields: name, phoneNumber, city, serviceType' },
        { status: 400 }
      )
    }

    // Validate phone number format (10 digits)
    if (!/^\d{10}$/.test(phoneNumber)) {
      return Response.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      )
    }

    // Validate service type
    const validServices = ['Service 1', 'Service 2', 'Service 3']
    if (!validServices.includes(serviceType)) {
      return Response.json(
        { error: 'Invalid service type. Must be Service 1, Service 2, or Service 3' },
        { status: 400 }
      )
    }

    // Check for duplicate (same phone + same service)
    const existingLead = await prisma.lead.findUnique({
      where: {
        phoneNumber_serviceType: {
          phoneNumber,
          serviceType
        }
      }
    })

    if (existingLead) {
      return Response.json(
        { error: 'Duplicate lead: Same phone number and service already exists' },
        { status: 400 }
      )
    }

    // Use transaction for consistency and atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create the lead
      const lead = await tx.lead.create({
        data: {
          name,
          phoneNumber,
          city,
          serviceType,
          description: description || null
        }
      })

      // Step 2: Get mandatory providers for this service
      const mandatoryProviderNames = getMandatoryProviders(serviceType)
      
      const mandatoryProviders = await tx.provider.findMany({
        where: {
          name: { in: mandatoryProviderNames },
          serviceType: serviceType,
          leadsAssigned: { lt: 10 }
        }
      })

      // Check if all mandatory providers are available and have quota
      if (mandatoryProviders.length !== mandatoryProviderNames.length) {
        const foundNames = mandatoryProviders.map(p => p.name)
        const missingNames = mandatoryProviderNames.filter(name => !foundNames.includes(name))
        throw new Error(`Mandatory providers not available: ${missingNames.join(', ')}`)
      }

      // Step 3: Calculate remaining slots (need total 3 providers)
      const remainingSlots = 3 - mandatoryProviders.length

      // Step 4: Get fair allocation for remaining slots
      let fairProviders = []
      if (remainingSlots > 0) {
        fairProviders = await getNextProviders(serviceType, remainingSlots, mandatoryProviderNames)
        
        if (fairProviders.length !== remainingSlots) {
          throw new Error(`Not enough providers available for fair allocation. Need ${remainingSlots} but found ${fairProviders.length}`)
        }
      }

      // Step 5: Create lead assignments and update provider quotas
      const allProviders = [...mandatoryProviders, ...fairProviders]
      
      // Create assignments first
      for (const provider of allProviders) {
        await tx.leadAssignment.create({
          data: {
            leadId: lead.id,
            providerId: provider.id
          }
        })
      }
      
      // Then update quotas
      for (const provider of allProviders) {
        await tx.provider.update({
          where: { id: provider.id },
          data: { leadsAssigned: { increment: 1 } }
        })
      }

      return { 
        lead, 
        providers: allProviders,
        mandatoryCount: mandatoryProviders.length,
        fairCount: fairProviders.length
      }
    })

    // Broadcast real-time event
    broadcastEvent({
      type: 'lead_assigned',
      leadId: result.lead.id,
      customerName: result.lead.name,
      phoneNumber: result.lead.phoneNumber,
      city: result.lead.city,
      serviceType: result.lead.serviceType,
      assignedProviders: result.providers.map(p => ({ 
        id: p.id, 
        name: p.name,
        serviceType: p.serviceType
      })),
      timestamp: new Date().toISOString()
    })

    return Response.json({
      success: true,
      message: 'Lead created and assigned successfully',
      lead: {
        id: result.lead.id,
        name: result.lead.name,
        phoneNumber: result.lead.phoneNumber,
        city: result.lead.city,
        serviceType: result.lead.serviceType,
        createdAt: result.lead.createdAt
      },
      assignedProviders: result.providers.map(p => ({ 
        id: p.id, 
        name: p.name,
        serviceType: p.serviceType
      })),
      allocationDetails: {
        mandatoryCount: result.mandatoryCount,
        fairCount: result.fairCount,
        totalAssigned: result.providers.length
      }
    })

  } catch (error) {
    console.error('Error creating lead:', error)
    
    if (error.message.includes('Mandatory provider')) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    
    if (error.message.includes('quota')) {
      return Response.json({ error: error.message }, { status: 429 })
    }
    
    return Response.json(
      { error: 'Failed to create lead. Please try again.' },
      { status: 500 }
    )
  }
}