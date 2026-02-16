import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { System } from '../models/System.js'
import { PersistenceService } from '../utils/persistenceService.js'

export const useSystemStore = defineStore('system', () => {
  // Current system being viewed
  const currentSystemId = ref(null)
  const systems = ref(new Map()) // Map<systemId, System>
  
  // Navigation stack for drill-down
  const navigationStack = ref([]) // Array of systemIds

  // Initialize with a root system
  const rootSystemId = 'root'
  let rootSystem = new System(rootSystemId, 'Root System')
  
  // Try to load from localStorage on initialization
  const storedSystem = PersistenceService.loadFromLocalStorage()
  const showNewModelModal = ref(false)
  const newModelModalReason = ref(null)

  if (storedSystem) {
    rootSystem = storedSystem
    if (storedSystem.id === rootSystemId) {
      systems.value.set(rootSystemId, rootSystem)
      currentSystemId.value = rootSystemId
    } else {
      systems.value.set(storedSystem.id, storedSystem)
      currentSystemId.value = storedSystem.id
    }
  } else {
    systems.value.set(rootSystemId, rootSystem)
    currentSystemId.value = rootSystemId
    showNewModelModal.value = true
    newModelModalReason.value = 'first-load'
  }

  function requestNewModelModal() {
    showNewModelModal.value = true
    newModelModalReason.value = 'new'
  }

  function applyNewModelInfo({ name, description }) {
    const system = currentSystem.value
    if (system) {
      system.name = name ?? system.name
      if (!system.metadata) system.metadata = {}
      system.metadata.description = description ?? system.metadata.description
      saveToLocalStorage()
    }
    showNewModelModal.value = false
    newModelModalReason.value = null
  }

  function closeNewModelModal() {
    showNewModelModal.value = false
    newModelModalReason.value = null
  }

  function updateCurrentSystemName(name) {
    const system = currentSystem.value
    if (system) {
      system.name = name
      saveToLocalStorage()
    }
  }

  function updateCurrentSystemDescription(description) {
    const system = currentSystem.value
    if (system) {
      if (!system.metadata) system.metadata = {}
      system.metadata.description = description
      saveToLocalStorage()
    }
  }

  // Computed
  const currentSystem = computed(() => {
    return systems.value.get(currentSystemId.value)
  })

  const canGoBack = computed(() => {
    return navigationStack.value.length > 0
  })

  // Actions
  function createSystem(name, parentSystemId = null) {
    const id = `system-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
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
      autoSave()
    }
  }

  function removeComponent(componentId) {
    const system = currentSystem.value
    if (system) {
      system.removeComponent(componentId)
      autoSave()
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
      autoSave()
    }
  }

  function removeConnection(connectionId) {
    const system = currentSystem.value
    if (system) {
      system.removeConnection(connectionId)
      autoSave()
    }
  }

  function drillDown(componentId) {
    const component = getComponent(componentId)
    if (component?.nestedSystemId) {
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
    currentSystemId.value = system.id
    saveToLocalStorage()
    return system.id
  }

  // Save current system to localStorage
  function saveToLocalStorage() {
    const system = currentSystem.value
    if (system) {
      PersistenceService.saveToLocalStorage(system)
    }
  }

  // Load system from localStorage
  function loadFromLocalStorage() {
    const storedSystem = PersistenceService.loadFromLocalStorage()
    if (storedSystem) {
      systems.value.set(storedSystem.id, storedSystem)
      currentSystemId.value = storedSystem.id
      return true
    }
    return false
  }

  // Clear localStorage
  function clearLocalStorage() {
    PersistenceService.clearLocalStorage()
  }

  // Debounced auto-save
  let saveTimeout = null
  function autoSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      saveToLocalStorage()
    }, 500) // Debounce by 500ms
  }

  // Watch for changes to the current system and auto-save
  watch(
    () => currentSystem.value,
    () => {
      if (currentSystem.value) {
        autoSave()
      }
    },
    { deep: true }
  )

  return {
    // State
    currentSystemId,
    systems,
    navigationStack,
    rootSystemId,
    showNewModelModal,
    newModelModalReason,

    // Computed
    currentSystem,
    canGoBack,

    // Actions
    requestNewModelModal,
    applyNewModelInfo,
    closeNewModelModal,
    updateCurrentSystemName,
    updateCurrentSystemDescription,
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
    importSystem,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
})

