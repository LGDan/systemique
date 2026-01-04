<script setup>
import { computed } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  componentId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close'])

const systemStore = useSystemStore()
const typesStore = useInterfaceTypesStore()

const component = computed(() => {
  if (!props.componentId) return null
  return systemStore.getComponent(props.componentId)
})

const system = computed(() => systemStore.currentSystem)

// Get interface type name
function getTypeName(typeId) {
  const type = typesStore.getType(typeId)
  return type ? type.name : typeId
}

// Get connected interfaces
const connectedInterfaces = computed(() => {
  if (!component.value || !system.value) return []
  
  const connected = []
  component.value.interfaces.forEach(iface => {
    const connection = system.value.connections.find(conn => 
      (conn.sourceComponentId === component.value.id && conn.sourceInterfaceId === iface.id) ||
      (conn.targetComponentId === component.value.id && conn.targetInterfaceId === iface.id)
    )
    
    if (connection) {
      const isSource = connection.sourceComponentId === component.value.id
      const otherComponentId = isSource ? connection.targetComponentId : connection.sourceComponentId
      const otherComponent = system.value.getComponent(otherComponentId)
      const otherInterfaceId = isSource ? connection.targetInterfaceId : connection.sourceInterfaceId
      const otherInterface = otherComponent ? otherComponent.getInterface(otherInterfaceId) : null
      
      connected.push({
        interface: iface,
        connection,
        otherComponent,
        otherInterface,
        isSource
      })
    }
  })
  
  return connected
})

// Get disconnected interfaces
const disconnectedInterfaces = computed(() => {
  if (!component.value || !system.value) return []
  
  return component.value.interfaces.filter(iface => {
    return !system.value.connections.some(conn => 
      (conn.sourceComponentId === component.value.id && conn.sourceInterfaceId === iface.id) ||
      (conn.targetComponentId === component.value.id && conn.targetInterfaceId === iface.id)
    )
  })
})

// Generate implementation instructions
const implementationInstructions = computed(() => {
  if (!component.value || !system.value) return []
  
  const instructions = []
  
  connectedInterfaces.value.forEach(({ interface: iface, otherComponent, otherInterface, isSource }) => {
    if (otherComponent && otherInterface) {
      const interfaceTypeName = getTypeName(iface.type)
      const instruction = `Connect ${iface.name} to ${otherComponent.name}, ${otherInterface.name} via ${interfaceTypeName}`
      instructions.push(instruction)
    }
  })
  
  return instructions
})

function handleClose() {
  emit('close')
}

function handleBackdropClick(event) {
  if (event.target === event.currentTarget) {
    handleClose()
  }
}
</script>

<template>
  <div v-if="visible" class="modal-overlay" @click="handleBackdropClick">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>{{ component?.name }} Installation Guide</h2>
        <button @click="handleClose" class="close-button">×</button>
      </div>
      
      <div class="modal-body">
        <div v-if="component?.description" class="section">
          <p class="description">{{ component.description }}</p>
        </div>
        
        <div v-if="connectedInterfaces.length > 0" class="section">
          <h3>Connected Interfaces</h3>
          <ul class="interface-list">
            <li v-for="({ interface: iface, otherComponent, otherInterface }, index) in connectedInterfaces" :key="index" class="interface-item">
              <span class="interface-name">{{ iface.name }}</span>
              <span class="interface-connection">
                → {{ otherComponent?.name }}, {{ otherInterface?.name }}
              </span>
            </li>
          </ul>
        </div>
        
        <div v-if="disconnectedInterfaces.length > 0" class="section">
          <h3>Disconnected Interfaces</h3>
          <ul class="interface-list">
            <li v-for="iface in disconnectedInterfaces" :key="iface.id" class="interface-item">
              <span class="interface-name">{{ iface.name }}</span>
              <span class="interface-type">({{ getTypeName(iface.type) }})</span>
            </li>
          </ul>
        </div>
        
        <div v-if="implementationInstructions.length > 0" class="section">
          <h3>Implementation Instructions</h3>
          <ol class="instructions-list">
            <li v-for="(instruction, index) in implementationInstructions" :key="index" class="instruction-item">
              {{ instruction }}
            </li>
          </ol>
        </div>
        
        <div v-if="implementationInstructions.length === 0 && disconnectedInterfaces.length === 0 && !component?.description" class="empty-state">
          <p>No installation information available for this component.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #ddd;
  background: #f9f9f9;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 28px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  line-height: 1;
}

.close-button:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #4ECDC4;
}

.description {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.interface-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.interface-item {
  padding: 10px 12px;
  background: #f9f9f9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.interface-name {
  font-weight: 600;
  color: #333;
}

.interface-connection {
  color: #666;
}

.interface-type {
  color: #999;
  font-size: 12px;
}

.instructions-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.instruction-item {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  padding-left: 4px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}
</style>

