import { ExportService } from './exportService.js'
import { System } from '../models/System.js'

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
      const exportData = {
        version: '1.0',
        savedAt: new Date().toISOString(),
        system: system.toJSON()
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
      return system
    } catch (error) {
      console.error('Failed to import from JSON:', error)
      throw new Error(`Failed to import system: ${error.message}`)
    }
  }

  /**
   * Import system from file
   */
  static async importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const system = this.importFromJSON(event.target.result)
          resolve(system)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file)
    })
  }
}

