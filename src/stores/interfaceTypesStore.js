import { defineStore } from 'pinia'
import { ref } from 'vue'
import { InterfaceType } from '../models/InterfaceType.js'
import { DEFAULT_INTERFACE_TYPES } from '../config/defaultInterfaceTypes.js'

/**
 * Interface Types Store
 * Manages editable interface types
 */
export const useInterfaceTypesStore = defineStore('interfaceTypes', () => {
  const interfaceTypes = ref([])
  const STORAGE_KEY = 'systemique-interface-types'

  // Load types from localStorage or use defaults
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        interfaceTypes.value = data.map(t => InterfaceType.fromJSON(t))
      } else {
        // Initialize with defaults
        interfaceTypes.value = [...DEFAULT_INTERFACE_TYPES]
        saveToLocalStorage()
      }
    } catch (error) {
      console.error('Failed to load interface types from localStorage:', error)
      interfaceTypes.value = [...DEFAULT_INTERFACE_TYPES]
    }
  }

  // Save types to localStorage
  function saveToLocalStorage() {
    try {
      const data = interfaceTypes.value.map(t => t.toJSON())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save interface types to localStorage:', error)
    }
  }

  // Initialize
  loadFromLocalStorage()

  function getAllTypes() {
    return interfaceTypes.value
  }

  function getType(id) {
    return interfaceTypes.value.find(t => t.id === id) || interfaceTypes.value.find(t => t.id === 'custom')
  }

  function updateType(id, updates) {
    const type = interfaceTypes.value.find(t => t.id === id)
    if (type) {
      Object.assign(type, updates)
      saveToLocalStorage()
    }
  }

  function addType(name, description = '', color = '#999999', icon = '⚙️') {
    // Generate a unique ID from the name
    const baseId = name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
    let id = baseId
    let counter = 1
    
    // Ensure unique ID
    while (interfaceTypes.value.some(t => t.id === id)) {
      id = `${baseId}-${counter}`
      counter++
    }
    
    const newType = new InterfaceType(id, name, color, icon, description)
    interfaceTypes.value.push(newType)
    saveToLocalStorage()
    return newType
  }

  function removeType(id) {
    const index = interfaceTypes.value.findIndex(t => t.id === id)
    if (index > -1) {
      interfaceTypes.value.splice(index, 1)
      saveToLocalStorage()
      return true
    }
    return false
  }

  function updateTypeColor(id, color) {
    updateType(id, { color })
  }

  /**
   * Import types from JSON array
   * Merges with existing types - updates if ID exists, adds if new
   */
  function importTypes(typesData) {
    if (!Array.isArray(typesData)) {
      console.error('Invalid types data for import')
      return
    }

    typesData.forEach(typeData => {
      try {
        const type = InterfaceType.fromJSON(typeData)
        const existingType = interfaceTypes.value.find(t => t.id === type.id)
        
        if (existingType) {
          // Update existing type
          updateType(type.id, {
            name: type.name,
            description: type.description,
            color: type.color,
            icon: type.icon
          })
        } else {
          // Add new type - but preserve the original ID
          // We need to add it directly to maintain the ID
          interfaceTypes.value.push(type)
          saveToLocalStorage()
        }
      } catch (error) {
        console.error('Failed to import interface type:', typeData, error)
      }
    })
  }

  return {
    getAllTypes,
    getType,
    updateType,
    addType,
    removeType,
    updateTypeColor,
    importTypes
  }
})

