export const getMandatoryProviders = (serviceType) => {
  const rules = {
    'Service 1': ['Provider 1'],
    'Service 2': ['Provider 5'],
    'Service 3': ['Provider 1', 'Provider 4'],
  }
  return rules[serviceType] || []
}

export const getAvailableProvidersPool = (serviceType) => {
  const pools = {
    'Service 1': ['Provider 2', 'Provider 3', 'Provider 4'],
    'Service 2': ['Provider 6', 'Provider 7', 'Provider 8'],
    'Service 3': ['Provider 2', 'Provider 3', 'Provider 5', 'Provider 6', 'Provider 7', 'Provider 8'],
  }
  return pools[serviceType] || []
}

export const isProviderMandatory = (serviceType, providerName) => {
  const mandatoryProviders = getMandatoryProviders(serviceType)
  return mandatoryProviders.includes(providerName)
}