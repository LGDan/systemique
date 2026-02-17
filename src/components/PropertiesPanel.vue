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

const selectedNodes = computed(() => getSelectedNodes.value)
const selectedNode = computed(() => {
  const nodes = selectedNodes.value
  return nodes.length > 0 ? nodes[0] : null
})
const isMultipleSelection = computed(() => selectedNodes.value.length > 1)

const selectedComponents = computed(() => {
  const nodes = selectedNodes.value
  return nodes
    .map((n) => systemStore.getComponent(n.id))
    .filter((c) => c != null)
})

const allSameType = computed(() => {
  const comps = selectedComponents.value
  if (comps.length <= 1) return false
  const firstType = comps[0].type
  return comps.every((c) => c.type === firstType)
})

const multiEditComponents = computed(() => {
  const comps = selectedComponents.value
  if (comps.length > 1 && allSameType.value) return comps
  return null
})

const component = computed(() => {
  if (selectedNode.value && selectedNode.value.data) {
    return systemStore.getComponent(selectedNode.value.id)
  }
  return null
})

const effectiveComponent = computed(() => {
  const multi = multiEditComponents.value
  if (multi && multi.length > 0) return multi[0]
  return component.value
})

const sameInterfaceCount = computed(() => {
  const multi = multiEditComponents.value
  if (!multi || multi.length === 0) return true
  const len = multi[0].interfaces.length
  return multi.every((c) => c.interfaces.length === len)
})

const interfacesList = computed(() => {
  const comp = effectiveComponent.value
  if (!comp) return []
  return comp.interfaces
})

const canEditInterfaces = computed(() => {
  const multi = multiEditComponents.value
  if (!multi) return true
  return sameInterfaceCount.value
})

const localProperties = ref({
  name: '',
  type: '',
  icon: null,
  properties: {},
  description: '',
  trust: null
})

// Model fields when nothing is selected (sync from store)
const modelTitle = ref('')
const modelDescription = ref('')

watch(
  () => [selectedNodes.value.length, systemStore.currentSystem],
  () => {
    if (selectedNodes.value.length === 0 && systemStore.currentSystem) {
      modelTitle.value = systemStore.currentSystem.name ?? ''
      const meta = systemStore.currentSystem.metadata
      modelDescription.value = (meta && meta.description) ?? ''
    }
  },
  { immediate: true, deep: true }
)

function commitModelTitle() {
  systemStore.updateCurrentSystemName(modelTitle.value)
}

function commitModelDescription() {
  systemStore.updateCurrentSystemDescription(modelDescription.value)
}

watch(effectiveComponent, (newComponent) => {
  if (newComponent) {
    localProperties.value = {
      name: newComponent.name,
      type: newComponent.type,
      icon: newComponent.icon,
      properties: { ...newComponent.properties },
      description: newComponent.description || '',
      trust: newComponent.trust || null
    }
  }
}, { immediate: true })

const interfaceTypes = computed(() => typesStore.getAllTypes())

function updateComponent() {
  const multi = multiEditComponents.value
  const props = localProperties.value
  if (multi && multi.length > 0) {
    multi.forEach((c) => {
      c.type = props.type
      c.icon = props.icon
      c.properties = { ...props.properties }
      c.description = props.description
      c.trust = props.trust
    })
    systemStore.saveToLocalStorage()
  } else if (component.value) {
    component.value.name = props.name
    component.value.type = props.type
    component.value.icon = props.icon
    component.value.properties = props.properties
    component.value.description = props.description
    component.value.trust = props.trust
    systemStore.saveToLocalStorage()
  }
}

function addInterface() {
  const multi = multiEditComponents.value
  if (multi && multi.length > 0) {
    multi.forEach((comp) => {
      const newInterfaceId = `interface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newInterface = new Interface(newInterfaceId, 'New Interface', 'custom', 'input')
      comp.addInterface(newInterface)
    })
    systemStore.saveToLocalStorage()
    return
  }
  if (!component.value) return
  const newInterfaceId = `interface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newInterface = new Interface(newInterfaceId, 'New Interface', 'custom', 'input')
  component.value.addInterface(newInterface)
  systemStore.saveToLocalStorage()
}

function updateInterface(updatedInterface, index) {
  const multi = multiEditComponents.value
  if (multi && multi.length > 0 && typeof index === 'number') {
    const rest = { ...updatedInterface }
    delete rest.id
    multi.forEach((comp) => {
      if (comp.interfaces[index]) {
        Object.assign(comp.interfaces[index], rest)
      }
    })
    systemStore.saveToLocalStorage()
    return
  }
  if (!component.value) return
  const iface = component.value.getInterface(updatedInterface.id)
  if (iface) {
    Object.assign(iface, updatedInterface)
    systemStore.saveToLocalStorage()
  }
}

function removeInterface(interfaceId, index) {
  const multi = multiEditComponents.value
  if (multi && multi.length > 0 && typeof index === 'number') {
    multi.forEach((comp) => {
      if (comp.interfaces[index]) {
        const idToRemove = comp.interfaces[index].id
        comp.removeInterface(idToRemove)
      }
    })
    systemStore.saveToLocalStorage()
    return
  }
  if (!component.value) return
  component.value.removeInterface(interfaceId)
  systemStore.saveToLocalStorage()
}

function duplicateInterface(interfaceId, index) {
  const multi = multiEditComponents.value
  if (multi && multi.length > 0 && typeof index === 'number') {
    multi.forEach((comp) => {
      const sourceInterface = comp.interfaces[index]
      if (!sourceInterface) return
      const newInterfaceId = `interface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const incrementedName = incrementInterfaceName(sourceInterface.name)
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
      comp.addInterface(newInterface)
    })
    systemStore.saveToLocalStorage()
    return
  }
  if (!component.value) return
  const sourceInterface = component.value.getInterface(interfaceId)
  if (!sourceInterface) return
  const newInterfaceId = `interface-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const incrementedName = incrementInterfaceName(sourceInterface.name)
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
    const number = Number.parseInt(match[2], 10)
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

    <div v-if="selectedNodes.length === 0" class="no-selection">
      <div class="property-section model-section">
        <h4>Model</h4>
        <div class="field">
          <label for="model-title">Title</label>
          <input
            id="model-title"
            v-model="modelTitle"
            type="text"
            class="field-input"
            @blur="commitModelTitle"
          />
        </div>
        <div class="field">
          <label for="model-description">Description</label>
          <textarea
            id="model-description"
            v-model="modelDescription"
            class="field-input field-textarea"
            rows="3"
            placeholder="Brief description of the model"
            @blur="commitModelDescription"
          />
        </div>
      </div>
      <p class="no-selection-hint">Select a component to edit its properties</p>
    </div>

    <div v-else-if="isMultipleSelection && !allSameType" class="no-selection">
      <p>Multiple Items Selected</p>
      <p class="selection-count">{{ selectedNodes.length }} components</p>
    </div>

    <div v-else class="properties-content">
      <div class="property-section">
        <h4>Component</h4>

        <div v-if="!multiEditComponents" class="field">
          <label for="component-name">Name</label>
          <input
            id="component-name"
            v-model="localProperties.name"
            type="text"
            class="field-input"
            @blur="updateComponent"
          />
        </div>

        <div class="field">
          <label for="component-type">Type</label>
          <input
            id="component-type"
            v-model="localProperties.type"
            type="text"
            class="field-input"
            @blur="updateComponent"
          />
        </div>

        <div class="field">
          <label for="component-icon">Icon</label>
          <IconPicker
            id="component-icon"
            v-model="localProperties.icon"
            @update:modelValue="updateComponent"
          />
        </div>

        <div class="field">
          <label for="component-description">Description</label>
          <textarea
            id="component-description"
            v-model="localProperties.description"
            class="field-input field-textarea"
            rows="4"
            placeholder="Enter component description..."
            @blur="updateComponent"
          />
        </div>

        <div class="field">
          <label for="component-trust">Trust</label>
          <select
            id="component-trust"
            v-model="localProperties.trust"
            class="field-input"
            @change="updateComponent"
          >
            <option :value="null">Unset</option>
            <option value="trusted">Trusted</option>
            <option value="untrusted">Untrusted</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
      </div>

      <div class="property-section">
        <div class="section-header">
          <h4>Interfaces</h4>
          <button v-if="canEditInterfaces" @click="addInterface" class="add-button">+ Add</button>
        </div>
        <p v-if="multiEditComponents && !sameInterfaceCount" class="interfaces-vary-note">
          Interfaces vary; select one component to edit interfaces.
        </p>
        <div v-else class="interfaces-list">
          <InterfaceEditor
            v-for="(iface, index) in interfacesList"
            :key="multiEditComponents ? `multi-${index}` : iface.id"
            :interface="iface"
            @update="(upd) => updateInterface(upd, multiEditComponents ? index : undefined)"
            @remove="(id) => removeInterface(id, multiEditComponents ? index : undefined)"
            @duplicate="(id) => duplicateInterface(id, multiEditComponents ? index : undefined)"
          />
        </div>
      </div>

      <div class="property-section">
        <h4>Metadata</h4>
        <div class="metadata-info">
          <template v-if="multiEditComponents">
            <div class="info-item">
              <span class="info-label">Editing</span>
              <span class="info-value">{{ multiEditComponents.length }} components</span>
            </div>
          </template>
          <template v-else-if="effectiveComponent">
            <div class="info-item">
              <span class="info-label">Component ID:</span>
              <span class="info-value">{{ effectiveComponent.id }}</span>
            </div>
            <div v-if="effectiveComponent.hasNestedSystem()" class="info-item">
              <span class="info-label">Has nested system:</span>
              <span class="info-value">Yes</span>
            </div>
          </template>
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

.no-selection .model-section {
  text-align: left;
  margin-bottom: 0;
}

.no-selection-hint {
  margin-top: 16px;
  font-size: 13px;
}

.selection-count {
  margin-top: 8px;
  font-size: 12px;
  color: #bbb;
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
  background: #2f7d78;
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

.field-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  line-height: 1.4;
}

.interfaces-vary-note {
  margin: 0;
  font-size: 12px;
  color: #666;
  font-style: italic;
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

