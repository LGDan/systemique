import { System } from '../models/System.js'
import { importFromDrawio } from './drawioImport.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { useInterfaceRulesStore } from '../stores/interfaceRulesStore.js'

const STORAGE_KEY = 'systemique-design-state'

/**
 * Persistence Service - Handles localStorage persistence for system designs
 */
export class PersistenceService {
  /**
   * Save system to localStorage
   * Uses the same format as ExportService for consistency
   */
  static saveToLocalStorage(system) {
    try {
      const typesStore = useInterfaceTypesStore()
      const rulesStore = useInterfaceRulesStore()
      
      const exportData = {
        version: '1.0',
        savedAt: new Date().toISOString(),
        system: system.toJSON(),
        interfaceTypes: typesStore.getAllTypes().map(t => t.toJSON()),
        interfaceRules: rulesStore.getAllRules()
      }
      
      const jsonString = JSON.stringify(exportData, null, 2)
      localStorage.setItem(STORAGE_KEY, jsonString)
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  }

  /**
   * Load system from localStorage
   * Returns the system object or null if not found/invalid
   * Also restores interface types and rules if present
   */
  static loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) {
        return null
      }

      const data = JSON.parse(stored)
      
      // Validate structure
      if (!data.system) {
        console.warn('Invalid stored data format')
        return null
      }

      // Restore interface types if present
      if (data.interfaceTypes && Array.isArray(data.interfaceTypes)) {
        const typesStore = useInterfaceTypesStore()
        typesStore.importTypes(data.interfaceTypes)
      }

      // Restore interface rules if present
      if (data.interfaceRules && typeof data.interfaceRules === 'object') {
        const rulesStore = useInterfaceRulesStore()
        // Clear existing rules
        rulesStore.clearAllRules()
        // Load the rules
        Object.entries(data.interfaceRules).forEach(([key, value]) => {
          const [type1, type2] = key.split('-')
          if (type1 && type2) {
            rulesStore.setRule(type1, type2, value)
          }
        })
      }

      // Reconstruct system from JSON
      const system = System.fromJSON(data.system)
      return system
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return null
    }
  }

  /**
   * Clear stored system from localStorage
   */
  static clearLocalStorage() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      return false
    }
  }

  /**
   * Check if there's a saved system in localStorage
   */
  static hasStoredSystem() {
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  /**
   * Import system from JSON string (same format as export)
   * Also imports interface types and rules if present
   * Returns an object with { system, interfaceTypes, interfaceRules }
   */
  static importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString)
      
      // Support both direct system JSON and wrapped export format
      let systemData
      if (data.system) {
        systemData = data.system
      } else if (data.id && data.components) {
        // Direct system JSON
        systemData = data
      } else {
        throw new Error('Invalid JSON format')
      }

      const system = System.fromJSON(systemData)
      
      return {
        system,
        interfaceTypes: data.interfaceTypes || null,
        interfaceRules: data.interfaceRules || null
      }
    } catch (error) {
      console.error('Failed to import from JSON:', error)
      throw new Error(`Failed to import system: ${error.message}`)
    }
  }

  /**
   * Import interface types and rules into their respective stores
   */
  static importInterfaceConfig(interfaceTypes, interfaceRules) {
    const typesStore = useInterfaceTypesStore()
    const rulesStore = useInterfaceRulesStore()

    // Import interface types
    if (interfaceTypes && Array.isArray(interfaceTypes)) {
      typesStore.importTypes(interfaceTypes)
    }

    // Import interface rules
    if (interfaceRules && typeof interfaceRules === 'object') {
      // Clear existing rules
      rulesStore.clearAllRules()
      // Load the rules
      Object.entries(interfaceRules).forEach(([key, value]) => {
        const [type1, type2] = key.split('-')
        if (type1 && type2) {
          rulesStore.setRule(type1, type2, value)
        }
      })
    }
  }

  /**
   * Import system from file
   */
  static async importFromFile(file) {
    try {
      const text = await file.text()
      const system = this.importFromJSON(text)
      return system
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`)
    }
  }

  /**
   * Import system from draw.io XML file (exported from Systemique).
   * Returns { system }; no interface types/rules in draw.io format.
   */
  static async importFromDrawioFile(file) {
    const text = await file.text()
    return importFromDrawio(text)
  }
}

