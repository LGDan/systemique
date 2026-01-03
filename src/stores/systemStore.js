import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { System } from '../models/System.js'
import { Component } from '../models/Component.js'
import { Connection } from '../models/Connection.js'
import { Interface } from '../models/Interface.js'

export const useSystemStore = defineStore('system', () => {
  // Current system being viewed
  const currentSystemId = ref(null)
  const systems = ref(new Map()) // Map<systemId, System>
  
  // Navigation stack for drill-down
  const navigationStack = ref([]) // Array of systemIds

  // Initialize with a root system
  const rootSystemId = 'root'
  const rootSystem = new System(rootSystemId, 'Root System')
  systems.value.set(rootSystemId, rootSystem)
  currentSystemId.value = rootSystemId

  // Computed
  const currentSystem = computed(() => {
    return systems.value.get(currentSystemId.value)
  })

  const canGoBack = computed(() => {
    return navigationStack.value.length > 0
  })

  // Actions
  function createSystem(name, parentSystemId = null) {
    const id = `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const system = new System(id, name, parentSystemId)
    systems.value.set(id, system)
    return id
  }

  function getSystem(systemId) {
    return systems.value.get(systemId)
  }

  function setCurrentSystem(systemId) {
    if (systems.value.has(systemId)) {
      currentSystemId.value = systemId
    }
  }

  function addComponent(component) {
    const system = currentSystem.value
    if (system) {
      system.addComponent(component)
    }
  }

  function removeComponent(componentId) {
    const system = currentSystem.value
    if (system) {
      system.removeComponent(componentId)
    }
  }

  function getComponent(componentId) {
    const system = currentSystem.value
    return system ? system.getComponent(componentId) : null
  }

  function addConnection(connection) {
    const system = currentSystem.value
    if (system) {
      system.addConnection(connection)
    }
  }

  function removeConnection(connectionId) {
    const system = currentSystem.value
    if (system) {
      system.removeConnection(connectionId)
    }
  }

  function drillDown(componentId) {
    const component = getComponent(componentId)
    if (component && component.nestedSystemId) {
      // Push current system to navigation stack
      navigationStack.value.push(currentSystemId.value)
      // Navigate to nested system
      setCurrentSystem(component.nestedSystemId)
    }
  }

  function drillUp() {
    if (navigationStack.value.length > 0) {
      const parentSystemId = navigationStack.value.pop()
      setCurrentSystem(parentSystemId)
    }
  }

  function createNestedSystem(componentId, systemName) {
    const component = getComponent(componentId)
    if (component) {
      const nestedSystemId = createSystem(systemName, currentSystemId.value)
      component.nestedSystemId = nestedSystemId
      return nestedSystemId
    }
    return null
  }

  // Export system to JSON
  function exportSystem(systemId = null) {
    const targetSystemId = systemId || currentSystemId.value
    const system = systems.value.get(targetSystemId)
    return system ? system.toJSON() : null
  }

  // Import system from JSON
  function importSystem(json) {
    const system = System.fromJSON(json)
    systems.value.set(system.id, system)
    return system.id
  }

  return {
    // State
    currentSystemId,
    systems,
    navigationStack,
    rootSystemId,
    
    // Computed
    currentSystem,
    canGoBack,
    
    // Actions
    createSystem,
    getSystem,
    setCurrentSystem,
    addComponent,
    removeComponent,
    getComponent,
    addConnection,
    removeConnection,
    drillDown,
    drillUp,
    createNestedSystem,
    exportSystem,
    importSystem
  }
})

