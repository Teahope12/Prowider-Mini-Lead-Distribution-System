import { prisma } from '../prisma'

export async function checkProviderQuota(providerId, requiredSlots = 1) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId }
  })
  
  if (!provider) {
    throw new Error(`Provider ${providerId} not found`)
  }
  
  const remainingQuota = provider.monthlyQuota - provider.leadsAssigned
  
  if (remainingQuota < requiredSlots) {
    return {
      available: false,
      remaining: remainingQuota,
      message: `Provider ${provider.name} has only ${remainingQuota} quota remaining`
    }
  }
  
  return {
    available: true,
    remaining: remainingQuota,
    message: 'Quota available'
  }
}

export async function checkMultipleProvidersQuota(providerIds, requiredSlots = 1) {
  const results = {}
  let allAvailable = true
  
  for (const providerId of providerIds) {
    const check = await checkProviderQuota(providerId, requiredSlots)
    results[providerId] = check
    if (!check.available) allAvailable = false
  }
  
  return {
    allAvailable,
    results
  }
}

export async function getProviderQuotaStatus(serviceType) {
  const providers = await prisma.provider.findMany({
    where: { serviceType },
    select: {
      id: true,
      name: true,
      leadsAssigned: true,
      monthlyQuota: true,
      isMandatory: true
    }
  })
  
  return providers.map(p => ({
    ...p,
    remaining: p.monthlyQuota - p.leadsAssigned,
    percentageUsed: (p.leadsAssigned / p.monthlyQuota) * 100
  }))
}