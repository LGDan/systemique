import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Component } from '../models/Component.js'

export const useComponentLibraryStore = defineStore('componentLibrary', () => {
  const components = ref(new Map()) // Map<componentId, Component>
  const categories = ref(['Hardware', 'Software', 'Network', 'Storage', 'Custom'])
  const isLoading = ref(false)
  const loadError = ref(null)

  /**
   * Load component library from JSON file or data
   */
  async function loadFromJSON(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      
      if (!data.components || !Array.isArray(data.components)) {
        throw new Error('Invalid library format: missing components array')
      }

      // Clear existing components
      components.value.clear()

      // Load components from JSON
      data.components.forEach(compData => {
        try {
          const component = Component.fromJSON(compData)
          components.value.set(component.id, component)
        } catch (err) {
          console.warn(`Failed to load component ${compData.id}:`, err)
        }
      })

      return { success: true, count: components.value.size }
    } catch (error) {
      console.error('Failed to load component library:', error)
      throw error
    }
  }

  /**
   * Load component library from server
   */
  async function loadFromServer(url = '/component-library.json') {
    isLoading.value = true
    loadError.value = null

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to load library: ${response.statusText}`)
      }

      const data = await response.json()
      const result = await loadFromJSON(data)
      
      isLoading.value = false
      return result
    } catch (error) {
      loadError.value = error.message
      isLoading.value = false
      console.error('Failed to load component library from server:', error)
      // Fall back to defaults if server load fails
      initializeDefaults()
      throw error
    }
  }

  /**
   * Export component library to JSON
   */
  function exportToJSON() {
    const componentsArray = Array.from(components.value.values()).map(comp => comp.toJSON())
    
    return {
      version: '1.0',
      components: componentsArray
    }
  }

  /**
   * Download component library as JSON file
   */
  function downloadJSON(filename = 'component-library.json') {
    const data = exportToJSON()
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Import component library from file
   */
  async function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const jsonData = e.target.result
          const result = await loadFromJSON(jsonData)
          resolve(result)
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

  /**
   * Initialize with default components (fallback)
   */
  function initializeDefaults() {
    // This is kept as a fallback if server loading fails
    // The actual defaults are now in the JSON file
    console.log('Using fallback default components')
  }

  function addComponent(component) {
    components.value.set(component.id, component)
  }

  function removeComponent(componentId) {
    components.value.delete(componentId)
  }

  function getComponent(componentId) {
    return components.value.get(componentId)
  }

  function getAllComponents() {
    return Array.from(components.value.values())
  }

  function getComponentsByCategory(category) {
    // For now, return all components. Can be extended with category metadata
    return getAllComponents()
  }

  function createComponentFromTemplate(templateId, newId, position = { x: 0, y: 0 }) {
    const template = components.value.get(templateId)
    if (!template) {
      return null
    }

    // Deep clone the component
    const templateData = template.toJSON()
    const newComponent = Component.fromJSON(templateData)
    newComponent.id = newId
    newComponent.position = position
    
    return newComponent
  }

  // Load from server on initialization
  loadFromServer().catch(err => {
    console.warn('Failed to load library from server, using defaults:', err.message)
  })

  return {
    components,
    categories,
    isLoading,
    loadError,
    addComponent,
    removeComponent,
    getComponent,
    getAllComponents,
    getComponentsByCategory,
    createComponentFromTemplate,
    loadFromJSON,
    loadFromServer,
    exportToJSON,
    downloadJSON,
    importFromFile
  }
})

