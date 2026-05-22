const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data in correct order (due to foreign key constraints)
  console.log('Cleaning existing data...')
  await prisma.leadAssignment.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.provider.deleteMany()
  await prisma.allocationCounter.deleteMany()
  await prisma.webhookReceipt.deleteMany()

  console.log('Creating providers...')
  
  // Create providers for Service 1
  const service1Providers = [
    { name: 'Provider 1', serviceType: 'Service 1', isMandatory: true },
    { name: 'Provider 2', serviceType: 'Service 1', isMandatory: false },
    { name: 'Provider 3', serviceType: 'Service 1', isMandatory: false },
    { name: 'Provider 4', serviceType: 'Service 1', isMandatory: false },
  ]

  // Create providers for Service 2
  const service2Providers = [
    { name: 'Provider 5', serviceType: 'Service 2', isMandatory: true },
    { name: 'Provider 6', serviceType: 'Service 2', isMandatory: false },
    { name: 'Provider 7', serviceType: 'Service 2', isMandatory: false },
    { name: 'Provider 8', serviceType: 'Service 2', isMandatory: false },
  ]

  // Create providers for Service 3
  const service3Providers = [
    { name: 'Provider 1', serviceType: 'Service 3', isMandatory: true },
    { name: 'Provider 4', serviceType: 'Service 3', isMandatory: true },
    { name: 'Provider 2', serviceType: 'Service 3', isMandatory: false },
    { name: 'Provider 3', serviceType: 'Service 3', isMandatory: false },
    { name: 'Provider 5', serviceType: 'Service 3', isMandatory: false },
    { name: 'Provider 6', serviceType: 'Service 3', isMandatory: false },
    { name: 'Provider 7', serviceType: 'Service 3', isMandatory: false },
    { name: 'Provider 8', serviceType: 'Service 3', isMandatory: false },
  ]

  // Combine all providers
  const allProviders = [...service1Providers, ...service2Providers, ...service3Providers]

  // Insert all providers
  await prisma.provider.createMany({
  data: allProviders.map((provider) => ({
    name: provider.name,
    serviceType: provider.serviceType,
    monthlyQuota: 10,
    leadsAssigned: 0,
    isMandatory: provider.isMandatory,
  })),
})

  console.log(`✅ Created ${allProviders.length} providers`)

  // Initialize allocation counters for fair distribution
  console.log('Initializing allocation counters...')
  const services = ['Service 1', 'Service 2', 'Service 3']
  
 await prisma.allocationCounter.createMany({
  data: services.map((service) => ({
    serviceType: service,
    lastIndex: 0,
  })),
})

  console.log('✅ Allocation counters initialized')
  console.log('\n📊 Seeding Summary:')
  console.log(`- Total Providers: ${allProviders.length}`)
  console.log(`  • Service 1: ${service1Providers.length} providers`)
  console.log(`  • Service 2: ${service2Providers.length} providers`)
  console.log(`  • Service 3: ${service3Providers.length} providers`)
  console.log(`- Mandatory providers configured`)
  console.log(`- Monthly quota: 10 leads per provider`)
  console.log(`- Allocation counters: Round-robin ready`)
  console.log('\n✨ Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })