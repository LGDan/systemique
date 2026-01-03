<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Position } from '@vue-flow/core'
import InterfaceHandle from './InterfaceHandle.vue'
import ContextMenu from './ContextMenu.vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'
import { Component } from '../models/Component.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  }
})

const systemStore = useSystemStore()
const libraryStore = useComponentLibraryStore()

const component = computed(() => {
  return props.data.component
})

// Group interfaces by position
const interfacesByPosition = computed(() => {
  const interfaces = component.value?.interfaces || []
  return {
    top: interfaces.filter(i => i.position === 'top'),
    bottom: interfaces.filter(i => i.position === 'bottom'),
    left: interfaces.filter(i => i.position === 'left'),
    right: interfaces.filter(i => i.position === 'right')
  }
})

const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

const contextMenuItems = computed(() => {
  return [
    {
      id: 'send-to-library',
      label: 'Send to Library',
      icon: '📚',
      action: 'sendToLibrary'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      action: 'delete'
    }
  ]
})

function handleContextMenu(event) {
  event.preventDefault()
  event.stopPropagation()
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

function handleMenuSelect(item) {
  if (item.action === 'sendToLibrary') {
    handleSendToLibrary()
  } else if (item.action === 'delete') {
    systemStore.removeComponent(component.value.id)
  }
  contextMenuVisible.value = false
}

let closeMenuHandler = null

onMounted(() => {
  // Close context menu when clicking elsewhere
  closeMenuHandler = () => {
    contextMenuVisible.value = false
  }
  document.addEventListener('close-context-menus', closeMenuHandler)
})

onUnmounted(() => {
  if (closeMenuHandler) {
    document.removeEventListener('close-context-menus', closeMenuHandler)
  }
})

/**
 * Generate a unique ID
 */
function generateUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function handleSendToLibrary() {
  try {
    const originalComponent = component.value
    if (!originalComponent) {
      alert('No component selected to send to library.')
      return
    }

    const templateId = generateUniqueId('template')
    const templateComponent = Component.fromJSON(originalComponent.toJSON())
    templateComponent.id = templateId
    templateComponent.position = { x: 0, y: 0 }
    templateComponent.nestedSystemId = null // Clear any nested system references

    libraryStore.addComponent(templateComponent)
    alert(`Component "${originalComponent.name}" has been added to the library!`)
  } catch (error) {
    console.error('Error sending component to library:', error)
    alert(`Failed to add component to library: ${error.message}`)
  }
}
</script>

<template>
  <div class="system-node" @contextmenu.prevent="handleContextMenu">
    <!-- Top interfaces -->
    <div v-if="interfacesByPosition.top.length > 0" class="interfaces interfaces-top">
      <InterfaceHandle
        v-for="iface in interfacesByPosition.top"
        :key="iface.id"
        :interface="iface"
        :position="Position.Top"
      />
    </div>

    <div class="node-main-row">
      <!-- Left interfaces -->
      <div v-if="interfacesByPosition.left.length > 0" class="interfaces interfaces-left">
        <InterfaceHandle
          v-for="iface in interfacesByPosition.left"
          :key="iface.id"
          :interface="iface"
          :position="Position.Left"
        />
      </div>

      <!-- Node content -->
      <div class="node-content">
        <div class="node-header">
          <div class="node-name">{{ component.name }}</div>
          <div v-if="component.type !== 'generic'" class="node-type">{{ component.type }}</div>
        </div>
      </div>

      <!-- Right interfaces -->
      <div v-if="interfacesByPosition.right.length > 0" class="interfaces interfaces-right">
        <InterfaceHandle
          v-for="iface in interfacesByPosition.right"
          :key="iface.id"
          :interface="iface"
          :position="Position.Right"
        />
      </div>
    </div>

    <!-- Bottom interfaces -->
    <div v-if="interfacesByPosition.bottom.length > 0" class="interfaces interfaces-bottom">
      <InterfaceHandle
        v-for="iface in interfacesByPosition.bottom"
        :key="iface.id"
        :interface="iface"
        :position="Position.Bottom"
      />
    </div>
    
    <Teleport to="body">
      <ContextMenu
        :visible="contextMenuVisible"
        :x="contextMenuPosition.x"
        :y="contextMenuPosition.y"
        :items="contextMenuItems"
        @close="contextMenuVisible = false"
        @select="handleMenuSelect"
      />
    </Teleport>
  </div>
</template>

<style scoped>
.system-node {
  min-width: 150px;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  user-select: none;
  /* Add margin to ensure labels don't get cut off */
  margin: 30px;
}

.node-main-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 100px;
}

.node-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.node-type {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}

.interfaces {
  display: flex;
  gap: 16px;
}

.interfaces-top,
.interfaces-bottom {
  flex-direction: row;
  justify-content: center;
}

.interfaces-left,
.interfaces-right {
  flex-direction: column;
  min-width: 60px;
}

.nested-indicator,
.drill-down-button {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
}

.nested-indicator {
  background-color: #E3F2FD;
  color: #1976D2;
}

.drill-down-button {
  background-color: #F5F5F5;
  color: #666;
}

.nested-indicator:hover {
  background-color: #BBDEFB;
}

.drill-down-button:hover {
  background-color: #E0E0E0;
}
</style>

