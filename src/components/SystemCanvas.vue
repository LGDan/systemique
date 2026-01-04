<script setup>
import { ref, onMounted, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import SystemNode from './SystemNode.vue'
import CustomEdge from '../CustomEdge.vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'
import { validateConnectionAttempt } from '../utils/connectionValidator.js'
import { Connection } from '../models/Connection.js'

const systemStore = useSystemStore()
const libraryStore = useComponentLibraryStore()
const vueFlow = useVueFlow()
const { onConnect, addEdges, removeEdges, onNodesChange, onEdgesChange, addNodes, screenToFlowCoordinate, onNodeDragStop } = vueFlow

const nodes = ref([])
const edges = ref([])

// Watch for system changes and update canvas
watch(() => systemStore.currentSystem, (system) => {
  if (system) {
    const vueFlowData = system.toVueFlow()
    nodes.value = vueFlowData.nodes
    edges.value = vueFlowData.edges
  }
}, { immediate: true, deep: true })

// Watch for changes in connections array length to catch additions
watch(() => systemStore.currentSystem?.connections.length, () => {
  const system = systemStore.currentSystem
  if (system) {
    const vueFlowData = system.toVueFlow()
    edges.value = vueFlowData.edges
  }
})

// Handle node drag stop - this fires when dragging ends
if (onNodeDragStop) {
  onNodeDragStop((event) => {
    const component = systemStore.getComponent(event.node.id)
    if (component && event.node.position) {
      // Update component position
      component.position = {
        x: event.node.position.x,
        y: event.node.position.y
      }
      // Save to localStorage
      systemStore.saveToLocalStorage()
    }
  })
}

// Handle node changes (position updates, deletion, etc.)
onNodesChange((changes) => {
  let positionChanged = false
  
  changes.forEach(change => {
    if (change.type === 'position' && change.dragging === false) {
      // Fallback: handle position changes when dragging ends
      const component = systemStore.getComponent(change.id)
      if (component && change.position) {
        component.position = {
          x: change.position.x,
          y: change.position.y
        }
        positionChanged = true
      }
    } else if (change.type === 'remove') {
      systemStore.removeComponent(change.id)
    }
  })
  
  // Save position changes to localStorage (only once per batch)
  if (positionChanged) {
    systemStore.saveToLocalStorage()
  }
})

// Handle edge changes
onEdgesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      systemStore.removeConnection(change.id)
    }
  })
})

// Helper function to generate unique IDs
function generateUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to recursively clone a system and all its nested systems
function cloneSystemRecursively(system, baseId, systemIdMap = new Map(), componentIdMap = new Map()) {
  if (systemIdMap.has(system.id)) {
    return systemIdMap.get(system.id)
  }

  const systemData = system.toJSON()
  const newSystemId = generateUniqueId(`${baseId}-system`)
  const newSystem = System.fromJSON(systemData)
  newSystem.id = newSystemId
  newSystem.parentSystemId = systemStore.currentSystemId.value

  systemIdMap.set(system.id, newSystem)

  // Clone all components and update their IDs
  const clonedComponents = []
  for (const comp of newSystem.components) {
    const oldComponentId = comp.id
    const newComponentId = generateUniqueId(`${baseId}-comp`)
    componentIdMap.set(oldComponentId, newComponentId)

    comp.id = newComponentId
    comp.position = { ...comp.position } // Create new position object

    // Recursively clone nested systems
    if (comp.nestedSystemId) {
      const originalNestedSystem = systemStore.getSystem(comp.nestedSystemId)
      if (originalNestedSystem) {
        const clonedNestedSystem = cloneSystemRecursively(originalNestedSystem, baseId, systemIdMap, componentIdMap)
        comp.nestedSystemId = clonedNestedSystem.id
        systemStore.systems.value.set(clonedNestedSystem.id, clonedNestedSystem)
      } else {
        console.warn(`Nested system with ID ${comp.nestedSystemId} not found`)
        comp.nestedSystemId = null
      }
    }
    clonedComponents.push(comp)
  }
  newSystem.components = clonedComponents

  // Clone all connections and update their component references
  const clonedConnections = []
  for (const conn of newSystem.connections) {
    const newConnectionId = generateUniqueId(`${baseId}-conn`)
    const newConn = Connection.fromJSON(conn.toJSON())
    newConn.id = newConnectionId

    // Update component references
    if (componentIdMap.has(newConn.sourceComponentId)) {
      newConn.sourceComponentId = componentIdMap.get(newConn.sourceComponentId)
    }
    if (componentIdMap.has(newConn.targetComponentId)) {
      newConn.targetComponentId = componentIdMap.get(newConn.targetComponentId)
    }
    clonedConnections.push(newConn)
  }
  newSystem.connections = clonedConnections

  return newSystem
}

// Handle new connections
onConnect((params) => {
  const sourceComponent = systemStore.getComponent(params.source)
  const targetComponent = systemStore.getComponent(params.target)
  
  if (!sourceComponent || !targetComponent) {
    return
  }

  // Validate connection
  const validation = validateConnectionAttempt(
    sourceComponent,
    params.sourceHandle,
    targetComponent,
    params.targetHandle
  )

  if (!validation.valid) {
    alert(`Connection failed: ${validation.reason}`)
    return
  }

  // Create connection
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const connection = new Connection(
    connectionId,
    params.source,
    params.sourceHandle,
    params.target,
    params.targetHandle
  )
  connection.validated = true

  systemStore.addConnection(connection)
  
  // Force update of edges
  const system = systemStore.currentSystem
  if (system) {
    const vueFlowData = system.toVueFlow()
    edges.value = vueFlowData.edges
  }
})

// Handle drag and drop from palette
function handleDrop(event) {
  event.preventDefault()
  const componentId = event.dataTransfer.getData('application/systemique-component')
  
  if (!componentId) {
    return
  }

  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY
  })

  const newComponentId = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const newComponent = libraryStore.createComponentFromTemplate(componentId, newComponentId, position)
  
  if (newComponent) {
    // Clear any nested system references from templates
    newComponent.nestedSystemId = null
    systemStore.addComponent(newComponent)
  }
}

function handleDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'copy'
}

onMounted(() => {
  // Set up drag and drop on the viewport
  const viewport = document.querySelector('.vue-flow__viewport')
  if (viewport) {
    viewport.addEventListener('drop', handleDrop)
    viewport.addEventListener('dragover', handleDragOver)
  }
  
  // Close context menus when clicking on canvas
  const canvas = document.querySelector('.system-canvas')
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      // Close any open context menus by dispatching a custom event
      document.dispatchEvent(new CustomEvent('close-context-menus'))
    })
  }
})
</script>

<template>
  <div class="system-canvas">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      fit-view-on-init
      class="vue-flow-system"
      :default-zoom="1.5"
      :min-zoom="0.2"
      :max-zoom="4"
      :pan-on-drag="[1, 2]"
      :selection-on-drag="true"
      :pan-on-scroll="true"
      :nodes-draggable="true"
      :nodes-connectable="true"
    >
      <Background pattern-color="#aaa" :gap="8" />
      <MiniMap />
      <Controls />

      <template #node-system="nodeProps">
        <SystemNode v-bind="nodeProps" />
      </template>

      <template #edge-custom="edgeProps">
        <CustomEdge v-bind="edgeProps" />
      </template>
    </VueFlow>
  </div>
</template>

<style scoped>
.system-canvas {
  flex: 1;
  position: relative;
  min-height: 0;
}

.vue-flow-system {
  width: 100%;
  height: 100%;
}
</style>

