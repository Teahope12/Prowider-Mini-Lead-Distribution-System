import { prisma } from '../prisma'

export async function checkDuplicateLead(phoneNumber, serviceType) {
  try {
    const existingLead = await prisma.lead.findUnique({
      where: {
        phoneNumber_serviceType: {
          phoneNumber,
          serviceType
        }
      }
    })
    
    if (existingLead) {
      return {
        isDuplicate: true,
        existingLead,
        message: `A lead with phone number ${phoneNumber} already exists for ${serviceType}`
      }
    }
    
    return {
      isDuplicate: false,
      message: 'No duplicate found'
    }
  } catch (error) {
    console.error('Duplicate check error:', error)
    return {
      isDuplicate: false,
      error: error.message
    }
  }
}

export async function validateLeadData(leadData) {
  const errors = []
  
  if (!leadData.name || leadData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters')
  }
  
  if (!leadData.phoneNumber) {
    errors.push('Phone number is required')
  } else if (!/^\d{10}$/.test(leadData.phoneNumber)) {
    errors.push('Phone number must be exactly 10 digits')
  }
  
  if (!leadData.city || leadData.city.trim().length < 2) {
    errors.push('City must be at least 2 characters')
  }
  
  const validServices = ['Service 1', 'Service 2', 'Service 3']
  if (!leadData.serviceType || !validServices.includes(leadData.serviceType)) {
    errors.push(`Service type must be one of: ${validServices.join(', ')}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}