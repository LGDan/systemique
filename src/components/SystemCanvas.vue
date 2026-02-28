<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import SystemNode from './SystemNode.vue'
import CustomEdge from '../CustomEdge.vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useToastStore } from '../stores/toastStore.js'
import { useClipboardStore } from '../stores/clipboardStore.js'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'
import { validateConnectionAttempt } from '../utils/connectionValidator.js'
import { Connection } from '../models/Connection.js'
import { Component } from '../models/Component.js'

const systemStore = useSystemStore()
const clipboardStore = useClipboardStore()
const libraryStore = useComponentLibraryStore()
const vueFlow = useVueFlow()
const { getSelectedNodes, onConnect, addEdges, removeEdges, onNodesChange, onEdgesChange, addNodes, screenToFlowCoordinate, onNodeDragStop, fitView } = vueFlow

const nodes = ref([])
const edges = ref([])
const spacePressed = ref(false)

const NODE_WIDTH = 120
const NODE_HEIGHT = 80
const PASTE_OFFSET = { x: 40, y: 40 }

// Configurable axis overlay labels
const AXIS_LABELS = {
  yBottom: 'Less Abstract',
  yTop: 'More Abstract',
  xLeft: 'Closer to People',
  xRight: 'Further from People'
}

const panOnDrag = computed(() => (spacePressed.value ? [0, 1, 2] : [1, 2]))

// Watch for system changes and update canvas
watch(() => systemStore.currentSystem, (system) => {
  if (system) {
    const vueFlowData = system.toVueFlow()
    nodes.value = vueFlowData.nodes
    edges.value = vueFlowData.edges
  }
}, { immediate: true, deep: true })

// When requested from security audit (or elsewhere), select the component on the canvas and pan to it
watch(
  () => [systemStore.navigateToComponentId, nodes.value.length],
  ([componentId]) => {
    if (!componentId || !nodes.value.length) return
    const node = nodes.value.find((n) => n.id === componentId)
    if (!node) return
    const updated = nodes.value.map((n) => ({
      ...n,
      selected: n.id === componentId
    }))
    nodes.value = updated
    systemStore.clearNavigateToComponent()
    if (fitView) {
      nextTick(() => {
        fitView({ nodes: [componentId], padding: 0.2, duration: 300 })
      })
    }
  },
  { immediate: true }
)

// Watch for changes in connections array length to catch additions
watch(() => systemStore.currentSystem?.connections.length, () => {
  const system = systemStore.currentSystem
  if (system) {
    const vueFlowData = system.toVueFlow()
    edges.value = vueFlowData.edges
  }
})

// Handle node drag stop - persist positions for all dragged nodes (supports multi-select)
if (onNodeDragStop) {
  onNodeDragStop((event) => {
    const nodesToUpdate = event.nodes?.length ? event.nodes : [event.node]
    let anyUpdated = false
    for (const node of nodesToUpdate) {
      const component = systemStore.getComponent(node.id)
      if (component && node.position) {
        component.position = { x: node.position.x, y: node.position.y }
        anyUpdated = true
      }
    }
    if (anyUpdated) {
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
    useToastStore().show(`Connection failed: ${validation.reason}`, 'error')
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

function isInputLike(el) {
  if (!el || !el.tagName) return false
  const tag = el.tagName.toLowerCase()
  const role = el.getAttribute?.('role')
  return tag === 'input' || tag === 'textarea' || tag === 'select' || role === 'textbox' || el.isContentEditable
}

function alignHorizontalCenter() {
  const selected = getSelectedNodes.value
  if (selected.length < 2) return
  const system = systemStore.currentSystem
  if (!system) return
  const components = selected.map((n) => systemStore.getComponent(n.id)).filter(Boolean)
  if (components.length < 2) return
  const minX = Math.min(...components.map((c) => c.position.x))
  const maxRight = Math.max(...components.map((c) => c.position.x + NODE_WIDTH))
  const centerX = (minX + maxRight) / 2
  components.forEach((comp) => {
    comp.position.x = centerX - NODE_WIDTH / 2
  })
  systemStore.saveToLocalStorage()
}

function alignVerticalMiddle() {
  const selected = getSelectedNodes.value
  if (selected.length < 2) return
  const system = systemStore.currentSystem
  if (!system) return
  const components = selected.map((n) => systemStore.getComponent(n.id)).filter(Boolean)
  if (components.length < 2) return
  const minY = Math.min(...components.map((c) => c.position.y))
  const maxBottom = Math.max(...components.map((c) => c.position.y + NODE_HEIGHT))
  const centerY = (minY + maxBottom) / 2
  components.forEach((comp) => {
    comp.position.y = centerY - NODE_HEIGHT / 2
  })
  systemStore.saveToLocalStorage()
}

const CLIPBOARD_MARKER = '__systemique_clipboard'

function copySelection() {
  const selected = getSelectedNodes.value
  if (selected.length === 0) return
  const system = systemStore.currentSystem
  if (!system) return
  const selectedIds = new Set(selected.map((n) => n.id))
  const components = selected.map((node) => {
    const comp = systemStore.getComponent(node.id)
    return comp ? comp.toJSON() : null
  }).filter(Boolean)
  const connections = system.connections
    .filter((c) => selectedIds.has(c.sourceComponentId) && selectedIds.has(c.targetComponentId))
    .map((c) => c.toJSON())
  clipboardStore.setClipboard(components, connections)
  const payload = { [CLIPBOARD_MARKER]: true, version: 1, components, connections }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(JSON.stringify(payload)).catch(() => {})
  }
}

function cutSelection() {
  copySelection()
  const selected = getSelectedNodes.value
  selected.forEach((node) => systemStore.removeComponent(node.id))
}

async function pasteSelection() {
  let comps = []
  let conns = []
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
      const text = await navigator.clipboard.readText()
      const data = JSON.parse(text)
      if (data && data[CLIPBOARD_MARKER] && Array.isArray(data.components)) {
        comps = data.components
        conns = data.connections ?? []
        clipboardStore.setClipboard(comps, conns)
      }
    }
  } catch {
    // ignore: not our format or permission denied
  }
  if (comps.length === 0) {
    const clip = clipboardStore.getClipboard()
    comps = clip.components
    conns = clip.connections
  }
  if (comps.length === 0) return
  const system = systemStore.currentSystem
  if (!system) return
  const compIdMap = new Map()
  const ifaceIdMap = new Map()
  comps.forEach((c) => {
    const newCompId = `component-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    compIdMap.set(c.id, newCompId)
    ;(c.interfaces || []).forEach((i) => {
      ifaceIdMap.set(i.id, `interface-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`)
    })
  })
  const newCompIds = []
  comps.forEach((c) => {
    const json = { ...c }
    json.id = compIdMap.get(c.id)
    json.position = {
      x: (c.position?.x ?? 0) + PASTE_OFFSET.x,
      y: (c.position?.y ?? 0) + PASTE_OFFSET.y
    }
    json.interfaces = (json.interfaces || []).map((i) => ({
      ...i,
      id: ifaceIdMap.get(i.id) ?? i.id
    }))
    const newComp = Component.fromJSON(json)
    systemStore.addComponent(newComp)
    newCompIds.push(newComp.id)
  })
  conns.forEach((conn) => {
    const newConnId = `connection-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const sourceCompId = compIdMap.get(conn.sourceComponentId)
    const targetCompId = compIdMap.get(conn.targetComponentId)
    const sourceIfaceId = ifaceIdMap.get(conn.sourceInterfaceId)
    const targetIfaceId = ifaceIdMap.get(conn.targetInterfaceId)
    if (sourceCompId && targetCompId && sourceIfaceId && targetIfaceId) {
      systemStore.addConnection(
        new Connection(newConnId, sourceCompId, sourceIfaceId, targetCompId, targetIfaceId, conn.metadata || {})
      )
    }
  })
  nextTick(() => {
    nodes.value = nodes.value.map((n) => ({
      ...n,
      selected: newCompIds.includes(n.id)
    }))
  })
}

function duplicateSelection() {
  const selected = getSelectedNodes.value
  if (selected.length === 0) return
  const system = systemStore.currentSystem
  if (!system) return
  const newIds = []
  selected.forEach((node) => {
    const comp = systemStore.getComponent(node.id)
    if (!comp) return
    const json = comp.toJSON()
    const newCompId = `component-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    json.id = newCompId
    json.position = { x: (json.position?.x ?? 0) + 30, y: (json.position?.y ?? 0) + 30 }
    json.interfaces = (json.interfaces || []).map((i) => ({
      ...i,
      id: `interface-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    }))
    const newComp = Component.fromJSON(json)
    systemStore.addComponent(newComp)
    newIds.push(newCompId)
  })
  nextTick(() => {
    nodes.value = nodes.value.map((n) => ({
      ...n,
      selected: newIds.includes(n.id)
    }))
  })
}

function handleKeyDown(event) {
  if (isInputLike(event.target)) return
  if (event.key === ' ') {
    spacePressed.value = true
    event.preventDefault()
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    const selected = getSelectedNodes.value
    if (selected.length > 0) {
      event.preventDefault()
      selected.forEach((node) => systemStore.removeComponent(node.id))
    }
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'x') {
    event.preventDefault()
    cutSelection()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'c') {
    event.preventDefault()
    copySelection()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'h') {
    event.preventDefault()
    alignHorizontalCenter()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'v') {
    event.preventDefault()
    alignVerticalMiddle()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'v') {
    event.preventDefault()
    pasteSelection()
    return
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd') {
    event.preventDefault()
    duplicateSelection()
  }
}

function handleKeyUp(event) {
  if (event.key === ' ') {
    spacePressed.value = false
    event.preventDefault()
  }
}

defineExpose({ copySelection, cutSelection, pasteSelection })

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
  // Set up drag and drop on the viewport
  const viewport = document.querySelector('.vue-flow__viewport')
  if (viewport) {
    viewport.addEventListener('drop', handleDrop)
    viewport.addEventListener('dragover', handleDragOver)
  }
  
  // Close context menus when clicking on canvas
  const canvas = document.querySelector('.system-canvas')
  if (canvas) {
    canvas.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('close-context-menus'))
    })
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
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
      :pan-on-drag="panOnDrag"
      :selection-on-drag="true"
      :multi-selection-key-code="['Meta', 'Control']"
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

    <div class="canvas-axis-overlays" aria-hidden="true">
      <div class="axis-float axis-float-y">
        <span class="axis-label axis-label-y-top"><span class="axis-label-text">{{ AXIS_LABELS.yTop }}</span></span>
        <div class="axis-gradient axis-gradient-y"></div>
        <span class="axis-label axis-label-y-bottom"><span class="axis-label-text">{{ AXIS_LABELS.yBottom }}</span></span>
      </div>
      <div class="axis-float axis-float-x">
        <span class="axis-label axis-label-x-left">{{ AXIS_LABELS.xLeft }}</span>
        <div class="axis-gradient axis-gradient-x"></div>
        <span class="axis-label axis-label-x-right">{{ AXIS_LABELS.xRight }}</span>
      </div>
    </div>
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

/* Axis overlays: floating containers with shadow, text at ends, gradient in middle */
.canvas-axis-overlays {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.axis-float {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}

/* Y axis: left side — label at top, gradient (middle), label at bottom */
.axis-float-y {
  left: 8px;
  top: 8px;
  bottom: 8px;
  width: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
}

.axis-label-y-top {
  flex-shrink: 0;
  height: 22px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
}

.axis-label-y-top .axis-label-text {
  position: absolute;
  left: 50%;
  width: 120px;
  text-align: center;
  white-space: nowrap;
  font-size: 11px;
  color: #555;
  transform: translateX(-50%) rotate(90deg);
  transform-origin: center center;
}

.axis-gradient-y {
  flex: 1;
  min-height: 0;
  width: 12px;
  border-radius: 6px;
  background: linear-gradient(to top, #1F6B66, #fff);
}

.axis-label-y-bottom {
  flex-shrink: 0;
  height: 22px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
}

.axis-label-y-bottom .axis-label-text {
  position: absolute;
  left: 50%;
  width: 120px;
  text-align: center;
  white-space: nowrap;
  font-size: 11px;
  color: #555;
  transform: translateX(-50%) rotate(-90deg);
  transform-origin: center center;
}

/* X axis: bottom — label, gradient (middle), label */
.axis-float-x {
  left: 8px;
  right: 8px;
  bottom: 8px;
  height: 32px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 10px;
}

.axis-label-x-left {
  flex-shrink: 0;
  font-size: 11px;
  color: #555;
  margin-right: 8px;
}

.axis-gradient-x {
  flex: 1;
  min-width: 48px;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, #fff, #1F6B66);
}

.axis-label-x-right {
  flex-shrink: 0;
  font-size: 11px;
  color: #555;
  margin-left: 8px;
}

/* Dark theme: floating panel and gradient */
html[data-theme='dark'] .axis-float {
  background: rgba(45, 45, 45, 0.95);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
}

html[data-theme='dark'] .axis-gradient-y {
  background: linear-gradient(to top, #1F6B66, #2d2d2d);
}

html[data-theme='dark'] .axis-gradient-x {
  background: linear-gradient(to right, #2d2d2d, #1F6B66);
}

html[data-theme='dark'] .axis-label-y-bottom .axis-label-text,
html[data-theme='dark'] .axis-label-y-top .axis-label-text,
html[data-theme='dark'] .axis-label-x-left,
html[data-theme='dark'] .axis-label-x-right {
  color: #b0b0b0;
}
</style>

