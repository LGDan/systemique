import { InterfaceType } from '../models/InterfaceType.js'

/**
 * Default interface types for IT systems
 */
export const DEFAULT_INTERFACE_TYPES = [
  new InterfaceType('power', 'Power', '#FF6B6B', '⚡', 'Electrical power connection'),
  new InterfaceType('network', 'Network', '#4ECDC4', '🌐', 'Network/data connection'),
  new InterfaceType('data', 'Data', '#45B7D1', '💾', 'Data structure or database connection'),
  new InterfaceType('physical', 'Physical', '#96CEB4', '📦', 'Physical/spatial relationship'),
  new InterfaceType('api', 'API', '#FFEAA7', '🔌', 'API or service interface'),
  new InterfaceType('custom', 'Custom', '#DDA0DD', '⚙️', 'Custom interface type')
]

/**
 * Get interface type by ID
 * Note: For editable types, use useInterfaceTypesStore() directly in Vue components
 */
export function getInterfaceType(id) {
  return DEFAULT_INTERFACE_TYPES.find(t => t.id === id) || DEFAULT_INTERFACE_TYPES.find(t => t.id === 'custom')
}

/**
 * Get all interface types
 * Note: For editable types, use useInterfaceTypesStore() directly in Vue components
 * This function returns the default static types
 */
export function getAllInterfaceTypes() {
  return DEFAULT_INTERFACE_TYPES
}

