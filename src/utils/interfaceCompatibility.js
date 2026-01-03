/**
 * Interface compatibility matrix - defines which interface types can connect
 */
const compatibilityMatrix = new Map()

// Default compatibility rules
const defaultCompatibility = {
  // Power interfaces can connect to power
  'power-power': true,
  
  // Network interfaces can connect to network
  'network-network': true,
  
  // Data interfaces can connect to data
  'data-data': true,
  
  // Physical interfaces can connect to physical
  'physical-physical': true,
  
  // API interfaces can connect to API
  'api-api': true,
  
  // Network and API can connect (APIs often use network)
  'network-api': true,
  'api-network': true,
  
  // Data and API can connect
  'data-api': true,
  'api-data': true,
  
  // Custom can connect to anything
  'custom-power': true,
  'custom-network': true,
  'custom-data': true,
  'custom-physical': true,
  'custom-api': true,
  'custom-custom': true,
  'power-custom': true,
  'network-custom': true,
  'data-custom': true,
  'physical-custom': true,
  'api-custom': true
}

// Initialize compatibility matrix
Object.entries(defaultCompatibility).forEach(([key, value]) => {
  compatibilityMatrix.set(key, value)
})

/**
 * Check if two interface types are compatible
 */
export function areTypesCompatible(type1, type2) {
  const key = `${type1}-${type2}`
  return compatibilityMatrix.get(key) || false
}

/**
 * Add a compatibility rule
 */
export function addCompatibilityRule(type1, type2, compatible = true) {
  const key = `${type1}-${type2}`
  compatibilityMatrix.set(key, compatible)
}

/**
 * Remove a compatibility rule
 */
export function removeCompatibilityRule(type1, type2) {
  const key = `${type1}-${type2}`
  compatibilityMatrix.delete(key)
}

/**
 * Get all compatibility rules
 */
export function getAllCompatibilityRules() {
  return Object.fromEntries(compatibilityMatrix)
}

