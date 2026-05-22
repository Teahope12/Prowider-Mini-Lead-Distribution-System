import { prisma } from '../prisma'

export async function getNextProviders(serviceType, count, excludeProviderNames = []) {
  // Get current allocation counter
  let counter = await prisma.allocationCounter.findUnique({
    where: { serviceType }
  })
  
  if (!counter) {
    counter = await prisma.allocationCounter.create({
      data: { serviceType, lastIndex: 0 }
    })
  }

  // Get available providers (non-mandatory, with quota left)
  const availableProviders = await prisma.provider.findMany({
    where: {
      serviceType,
      isMandatory: false,
      leadsAssigned: { lt: 10 },
      name: { notIn: excludeProviderNames }
    },
    orderBy: { name: 'asc' }
  })

  if (availableProviders.length === 0) return []

  // Round-robin selection
  const selected = []
  let currentIndex = counter.lastIndex

  for (let i = 0; i < count * 3 && selected.length < count; i++) {
    const provider = availableProviders[currentIndex % availableProviders.length]
    if (!selected.find(p => p.id === provider.id)) {
      selected.push(provider)
    }
    currentIndex++
  }

  // Update counter for next time
  await prisma.allocationCounter.update({
    where: { serviceType },
    data: { lastIndex: currentIndex }
  })

  return selected
}