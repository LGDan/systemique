<script setup>
import { ref, computed, onMounted, watch } from 'vue'
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
const { onConnect, addEdges, removeEdges, onNodesChange, onEdgesChange, addNodes, screenToFlowCoordinate } = vueFlow

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

// Handle node changes (position updates, deletion, etc.)
onNodesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'position' && change.dragging === false) {
      const component = systemStore.getComponent(change.id)
      if (component && change.position) {
        component.position = change.position
      }
    } else if (change.type === 'remove') {
      systemStore.removeComponent(change.id)
    }
  })
})

// Handle edge changes
onEdgesChange((changes) => {
  changes.forEach(change => {
    if (change.type === 'remove') {
      systemStore.removeConnection(change.id)
    }
  })
})

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
    systemStore.addComponent(newComponent)
    // The watch will automatically update nodes and edges
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

