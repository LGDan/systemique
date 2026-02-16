const BASE_URL = import.meta.env.BASE_URL || '/'

/**
 * Read a URL parameter from the current page. Supports both camelCase and kebab-case.
 * Only runs in browser (returns default when window is undefined).
 */
function getUrlParam(camelKey, kebabKey, defaultUrl) {
  if (!globalThis.window?.location?.search) return defaultUrl
  const params = new URLSearchParams(globalThis.window.location.search)
  const value = params.get(camelKey) ?? params.get(kebabKey)
  return value != null && value.trim() !== '' ? value.trim() : defaultUrl
}

/**
 * URL for the component library JSON. Overridable via query:
 * - componentLibrary=https://...
 * - component-library=https://...
 */
export function getComponentLibraryUrl() {
  return getUrlParam('componentLibrary', 'component-library', BASE_URL + 'component-library.json')
}

/**
 * URL for the architecture library manifest JSON. Overridable via query:
 * - architectureLibrary=https://...
 * - architecture-library=https://...
 */
export function getArchitectureLibraryUrl() {
  return getUrlParam('architectureLibrary', 'architecture-library', BASE_URL + 'architecture-library.json')
}

/**
 * Whether the interface types URL was explicitly set via query param.
 */
export function hasInterfaceTypesUrlParam() {
  if (!globalThis.window?.location?.search) return false
  const params = new URLSearchParams(globalThis.window.location.search)
  const value = params.get('interfaceTypes') ?? params.get('interface-types')
  return value != null && value.trim() !== ''
}

/**
 * URL for the interface types JSON. Overridable via query:
 * - interfaceTypes=https://...
 * - interface-types=https://...
 */
export function getInterfaceTypesUrl() {
  return getUrlParam('interfaceTypes', 'interface-types', BASE_URL + 'interface-types.json')
}

/**
 * Whether the interface rules URL was explicitly set via query param.
 */
export function hasInterfaceRulesUrlParam() {
  if (!globalThis.window?.location?.search) return false
  const params = new URLSearchParams(globalThis.window.location.search)
  const value = params.get('interfaceRules') ?? params.get('interface-rules')
  return value != null && value.trim() !== ''
}

/**
 * URL for the interface rules JSON. Overridable via query:
 * - interfaceRules=https://...
 * - interface-rules=https://...
 */
export function getInterfaceRulesUrl() {
  return getUrlParam('interfaceRules', 'interface-rules', BASE_URL + 'interface-rules.json')
}
