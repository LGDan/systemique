<script setup>
import { ref, computed, watch } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import { useSystemStore } from '../stores/systemStore.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { Interface } from '../models/Interface.js'
import InterfaceEditor from './InterfaceEditor.vue'
import IconPicker from './IconPicker.vue'

const { getSelectedNodes } = useVueFlow()
const systemStore = useSystemStore()
const typesStore = useInterfaceTypesStore()

const selectedNode = computed(() => {
  const nodes = getSelectedNodes.value
  return nodes.length > 0 ? nodes[0] : null
})

const component = computed(() => {
  if (selectedNode.value && selectedNode.value.data) {
    return systemStore.getComponent(selectedNode.value.id)
  }
  return null
})

const localProperties = ref({
  name: '',
  type: '',
  icon: null,
  properties: {}
})

watch(component, (newComponent) => {
  if (newComponent) {
    localProperties.value = {
      name: newComponent.name,
      type: newComponent.type,
      icon: newComponent.icon,
      properties: { ...newComponent.properties }
    }
  }
}, { immediate: true })

const interfaceTypes = computed(() => typesStore.getAllTypes())

function updateComponent() {
  if (component.value) {
    component.value.name = localProperties.value.name
    component.value.type = localProperties.value.type
    component.value.icon = localProperties.value.icon
    component.value.properties = localProperties.value.properties
    systemStore.saveToLocalStorage()
  }
}

function addInterface() {
  if (!component.value) return
  
  const newInterfaceId = `interface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newInterface = new Interface(newInterfaceId, 'New Interface', 'custom', 'input')
  component.value.addInterface(newInterface)
  systemStore.saveToLocalStorage()
}

function updateInterface(updatedInterface) {
  if (!component.value) return
  
  const iface = component.value.getInterface(updatedInterface.id)
  if (iface) {
    Object.assign(iface, updatedInterface)
    systemStore.saveToLocalStorage()
  }
}

function removeInterface(interfaceId) {
  if (!component.value) return
  component.value.removeInterface(interfaceId)
  systemStore.saveToLocalStorage()
}

function duplicateInterface(interfaceId) {
  if (!component.value) return
  
  const sourceInterface = component.value.getInterface(interfaceId)
  if (!sourceInterface) return
  
  // Generate new ID
  const newInterfaceId = `interface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Extract and increment number from name
  const incrementedName = incrementInterfaceName(sourceInterface.name)
  
  // Create new interface with all properties copied
  const newInterface = new Interface(
    newInterfaceId,
    incrementedName,
    sourceInterface.type,
    sourceInterface.direction,
    sourceInterface.validationRules
  )
  newInterface.position = sourceInterface.position
  newInterface.icon = sourceInterface.icon
  newInterface.access = sourceInterface.access
  newInterface.metadata = { ...sourceInterface.metadata }
  
  component.value.addInterface(newInterface)
  systemStore.saveToLocalStorage()
}

/**
 * Increment the number at the end of an interface name
 * Examples: "Port 1" -> "Port 2", "Network" -> "Network 2", "Outlet 10" -> "Outlet 11"
 */
function incrementInterfaceName(name) {
  // Match trailing digits
  const match = name.match(/^(.*\D)?(\d+)$/)
  
  if (match) {
    // Name has trailing number - increment it
    const prefix = match[1] || ''
    const number = parseInt(match[2], 10)
    return `${prefix}${number + 1}`
  } else {
    // No trailing number - add " 2"
    return `${name} 2`
  }
}
</script>

<template>
  <div class="properties-panel">
    <div class="panel-header">
      <h3>Properties</h3>
    </div>

    <div v-if="!component" class="no-selection">
      <p>Select a component to edit its properties</p>
    </div>

    <div v-else class="properties-content">
      <div class="property-section">
        <h4>Component</h4>
        
        <div class="field">
          <label>Name</label>
          <input
            v-model="localProperties.name"
            type="text"
            class="field-input"
            @blur="updateComponent"
          />
        </div>

        <div class="field">
          <label>Type</label>
          <input
            v-model="localProperties.type"
            type="text"
            class="field-input"
            @blur="updateComponent"
          />
        </div>

        <div class="field">
          <label>Icon</label>
          <IconPicker 
            v-model="localProperties.icon"
            @update:modelValue="updateComponent"
          />
        </div>
      </div>

      <div class="property-section">
        <div class="section-header">
          <h4>Interfaces</h4>
          <button @click="addInterface" class="add-button">+ Add</button>
        </div>

        <div class="interfaces-list">
          <InterfaceEditor
            v-for="iface in component.interfaces"
            :key="iface.id"
            :interface="iface"
            @update="updateInterface"
            @remove="removeInterface"
            @duplicate="duplicateInterface"
          />
        </div>
      </div>

      <div class="property-section">
        <h4>Metadata</h4>
        <div class="metadata-info">
          <div class="info-item">
            <span class="info-label">Component ID:</span>
            <span class="info-value">{{ component.id }}</span>
          </div>
          <div v-if="component.hasNestedSystem()" class="info-item">
            <span class="info-label">Has nested system:</span>
            <span class="info-value">Yes</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties-panel {
  width: 300px;
  background: #f5f5f5;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.panel-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #ddd;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.no-selection {
  padding: 24px;
  text-align: center;
  color: #999;
}

.properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.property-section {
  margin-bottom: 24px;
}

.property-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.add-button {
  padding: 4px 8px;
  background: #4ECDC4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
}

.add-button:hover {
  background: #3AB8B0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.field label {
  font-size: 11px;
  color: #666;
  font-weight: 600;
}

.field-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.interfaces-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metadata-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.info-label {
  color: #666;
}

.info-value {
  color: #333;
  font-weight: 600;
}
</style>

