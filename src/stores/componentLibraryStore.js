import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Component } from '../models/Component.js'

/**
 * Initialize with default components (fallback)
 */
function initializeDefaults() {
  // This is kept as a fallback if server loading fails
  // The actual defaults are now in the JSON file
  console.log('Using fallback default components')
}

export const useComponentLibraryStore = defineStore('componentLibrary', () => {
  const components = ref(new Map()) // Map<componentId, Component>
  const isLoading = ref(false)
  const loadError = ref(null)

  /**
   * Dynamically compute all unique categories from components
   */
  const categories = computed(() => {
    const categorySet = new Set()
    
    for (const component of components.value.values()) {
      if (component.categories && Array.isArray(component.categories)) {
        component.categories.forEach(cat => categorySet.add(cat))
      }
    }
    
    // Return sorted array of categories
    return Array.from(categorySet).sort((a, b) => a.localeCompare(b))
  })

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
  async function loadFromServer(url = import.meta.env.BASE_URL + 'component-library.json') {
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
    link.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * Import component library from file
   */
  async function importFromFile(file) {
    try {
      const jsonData = await file.text()
      const result = await loadFromJSON(jsonData)
      return result
    } catch (error) {
      throw new Error('Failed to read file: ' + error.message)
    }
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
    return getAllComponents().filter(component => {
      // Check if component has the specified category
      return component.categories && 
             Array.isArray(component.categories) && 
             component.categories.includes(category)
    })
  }

  function createComponentFromTemplate(templateId, newId, position = null) {
    const defaultPosition = position || { x: 0, y: 0 }
    const template = components.value.get(templateId)
    if (!template) {
      return null
    }

    // Deep clone the component
    const templateData = template.toJSON()
    const newComponent = Component.fromJSON(templateData)
    newComponent.id = newId
    newComponent.position = defaultPosition
    
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

