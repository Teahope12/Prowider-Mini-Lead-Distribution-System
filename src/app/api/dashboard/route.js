import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const providerName = searchParams.get('provider')

    if (providerName) {
      // Get specific provider data
      const provider = await prisma.provider.findFirst({
        where: { name: providerName },
        include: {
          leads: {
            include: {
              lead: true
            },
            orderBy: {
              assignedAt: 'desc'
            }
          }
        }
      })

      if (!provider) {
        return Response.json({ error: 'Provider not found' }, { status: 404 })
      }

      return Response.json({
        id: provider.id,
        name: provider.name,
        serviceType: provider.serviceType,
        leadsAssigned: provider.leadsAssigned,
        monthlyQuota: provider.monthlyQuota,
        remainingQuota: provider.monthlyQuota - provider.leadsAssigned,
        leads: provider.leads.map(assignment => ({
          id: assignment.lead.id,
          name: assignment.lead.name,
          phoneNumber: assignment.lead.phoneNumber,
          city: assignment.lead.city,
          serviceType: assignment.lead.serviceType,
          description: assignment.lead.description,
          createdAt: assignment.lead.createdAt
        }))
      })
    }

    // Get all providers grouped by service
    const providers = await prisma.provider.findMany({
      include: {
        leads: {
          include: {
            lead: true
          },
          orderBy: {
            assignedAt: 'desc'
          }
        }
      },
      orderBy: [
        { serviceType: 'asc' },
        { name: 'asc' }
      ]
    })

    const formattedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name,
      serviceType: provider.serviceType,
      leadsAssigned: provider.leadsAssigned,
      monthlyQuota: provider.monthlyQuota,
      remainingQuota: provider.monthlyQuota - provider.leadsAssigned,
      isMandatory: provider.isMandatory,
      leads: provider.leads.map(assignment => ({
        id: assignment.lead.id,
        name: assignment.lead.name,
        phoneNumber: assignment.lead.phoneNumber,
        city: assignment.lead.city,
        serviceType: assignment.lead.serviceType,
        description: assignment.lead.description,
        createdAt: assignment.lead.createdAt
      }))
    }))

    return Response.json(formattedProviders)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return Response.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}