/**
 * Icon Library - Maps icon names to Material Design Icons
 */
import {
  mdiServer,
  mdiRouterNetwork,
  mdiDatabase,
  mdiPowerSocketUs,
  mdiServerNetwork,
  mdiApi,
  mdiApplicationBracesOutline,
  mdiNetworkOutline,
  mdiCubeOutline,
  mdiServerPlus,
  mdiServerMinus,
  mdiServerSecurity,
  mdiCloudOutline,
  mdiCog,
  mdiMemory
} from '@mdi/js'

/**
 * Icon registry - maps simple names to MDI icon paths
 */
export const iconRegistry = {
  // Server & Infrastructure
  'server': mdiServer,
  'rack': mdiServer, // Using server icon for rack
  'server-rack': mdiServer,
  'server-network': mdiServerNetwork,
  'server-plus': mdiServerPlus,
  'server-minus': mdiServerMinus,
  'server-security': mdiServerSecurity,
  
  // Network
  'switch': mdiRouterNetwork,
  'network': mdiNetworkOutline,
  'router': mdiRouterNetwork,
  
  // Storage & Data
  'database': mdiDatabase,
  'storage': mdiCubeOutline,
  
  // Power
  'pdu': mdiPowerSocketUs,
  'power': mdiPowerSocketUs,
  
  // Services & Software
  'api': mdiApi,
  'api-service': mdiApi,
  'application': mdiApplicationBracesOutline,
  'cloud': mdiCloudOutline,
  'service': mdiCog,
  
  // Hardware
  'memory': mdiMemory,
  'component': mdiCubeOutline,
}

/**
 * Get icon path by name
 * @param {string} iconName - The icon name (e.g., 'server', 'database')
 * @returns {string|null} - The SVG path data or null if not found
 */
export function getIconPath(iconName) {
  if (!iconName) return null
  return iconRegistry[iconName.toLowerCase()] || null
}

/**
 * Check if an icon exists
 * @param {string} iconName - The icon name
 * @returns {boolean}
 */
export function hasIcon(iconName) {
  return iconName && iconRegistry.hasOwnProperty(iconName.toLowerCase())
}

/**
 * Get all available icon names
 * @returns {string[]}
 */
export function getAvailableIcons() {
  return Object.keys(iconRegistry)
}

