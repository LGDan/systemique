/**
 * Utility functions for filtering table data in audit components.
 * Reduces cognitive complexity by extracting filter logic into separate functions.
 */

/**
 * Generic filter function that checks if a value matches a filter.
 * Returns true if filter is 'all' or if the value matches the filter.
 * 
 * @param {any} value - The value to check
 * @param {any} filterValue - The filter value ('all' means no filter)
 * @returns {boolean}
 */
export function matchesFilter(value, filterValue) {
  if (filterValue === 'all') return true
  return value === filterValue
}

/**
 * Filter function for access values with special handling for 'Unset'.
 * 
 * @param {Object} item - The item to check
 * @param {string} filterValue - The filter value ('all', 'Unset', 'trusted', 'untrusted', 'ignored')
 * @returns {boolean}
 */
export function matchesAccess(item, filterValue) {
  if (filterValue === 'all') return true
  const itemAccess = item.access || 'Unset'
  if (filterValue === 'Unset' && itemAccess !== 'Unset') return false
  if (filterValue !== 'Unset' && itemAccess !== filterValue) return false
  return true
}

/**
 * Filter function for connection status (connected/disconnected).
 * 
 * @param {Object} item - The item to check (must have a 'connected' boolean property)
 * @param {string} filterValue - The filter value ('all', 'connected', 'disconnected')
 * @returns {boolean}
 */
export function matchesConnection(item, filterValue) {
  if (filterValue === 'all') return true
  if (filterValue === 'connected' && !item.connected) return false
  if (filterValue === 'disconnected' && item.connected) return false
  return true
}

/**
 * Filter function for direction values.
 * 
 * @param {Object} item - The item to check (must have a 'direction' property)
 * @param {string} filterValue - The filter value ('all', 'input', 'output')
 * @returns {boolean}
 */
export function matchesDirection(item, filterValue) {
  if (filterValue === 'all') return true
  return item.direction === filterValue
}

/**
 * Filter function for interface type values.
 * 
 * @param {Object} item - The item to check (must have an 'interfaceType' property)
 * @param {string} filterValue - The filter value ('all' or a specific type ID)
 * @returns {boolean}
 */
export function matchesInterfaceType(item, filterValue) {
  if (filterValue === 'all') return true
  return item.interfaceType === filterValue
}

/**
 * Filter function for trust values with special handling for 'unset'.
 * 
 * @param {Object} item - The item to check
 * @param {string} propertyName - The property name to check (e.g., 'sourceTrust', 'targetTrust')
 * @param {string} filterValue - The filter value ('all', 'trusted', 'untrusted', 'ignored', 'unset')
 * @returns {boolean}
 */
export function matchesTrust(item, propertyName, filterValue) {
  if (filterValue === 'all') return true
  const itemTrust = item[propertyName] || 'unset'
  return itemTrust === filterValue
}

/**
 * Filter function for risk status values.
 * 
 * @param {Object} item - The item to check (must have a 'riskStatus' property)
 * @param {string} filterValue - The filter value ('all', 'secure', 'at-risk', 'unset')
 * @returns {boolean}
 */
export function matchesRiskStatus(item, filterValue) {
  if (filterValue === 'all') return true
  return item.riskStatus === filterValue
}

/**
 * Filter function for boundary type values.
 * 
 * @param {Object} item - The item to check (must have a 'boundaryType' property)
 * @param {string} filterValue - The filter value ('all' or a specific boundary type)
 * @returns {boolean}
 */
export function matchesBoundaryType(item, filterValue) {
  if (filterValue === 'all') return true
  return item.boundaryType === filterValue
}
