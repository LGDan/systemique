<script setup>
import { computed, ref, inject, onMounted, onUnmounted } from 'vue'
import { Position } from '@vue-flow/core'
import InterfaceHandle from './InterfaceHandle.vue'
import ContextMenu from './ContextMenu.vue'
import InstallationGuideModal from './InstallationGuideModal.vue'
import MdiIcon from './MdiIcon.vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useToastStore } from '../stores/toastStore.js'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'
import { Component } from '../models/Component.js'
import { marked } from 'marked'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const systemStore = useSystemStore()
const toastStore = useToastStore()
const libraryStore = useComponentLibraryStore()

const component = computed(() => {
  return props.data.component
})

// Trust level class for background color
const trustClass = computed(() => {
  const trust = component.value?.trust
  if (trust === 'trusted') return 'trust-trusted'
  if (trust === 'untrusted') return 'trust-untrusted'
  if (trust === 'ignored') return 'trust-ignored'
  return null
})

const isNote = computed(() => component.value?.type === 'note')

const noteBodyHtml = computed(() => {
  if (!isNote.value) return ''
  const desc = component.value?.description
  if (desc == null || desc === '') return ''
  return marked(desc)
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
const installationGuideVisible = ref(false)
const clipboardActions = inject('clipboardActions', null)
const hasClipboard = inject('hasClipboard', false)

const contextMenuItems = computed(() => {
  const items = [
    {
      id: 'installation-guide',
      label: 'Installation Guide',
      icon: '📖',
      action: 'installationGuide'
    },
    {
      id: 'copy-as-json',
      label: 'Copy as JSON',
      icon: '📋',
      action: 'copyAsJSON'
    },
    {
      id: 'copy-as-json-template',
      label: 'Copy as JSON (Template)',
      icon: '📄',
      action: 'copyAsJSONTemplate'
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '📑',
      action: 'duplicate'
    },
    {
      id: 'cut',
      label: 'Cut',
      icon: '✂️',
      action: 'cut',
      shortcut: 'Ctrl+X'
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: '📋',
      action: 'copy',
      shortcut: 'Ctrl+C'
    },
    {
      id: 'paste',
      label: 'Paste',
      icon: '📄',
      action: 'paste',
      shortcut: 'Ctrl+V',
      disabled: !(hasClipboard?.value ?? hasClipboard ?? false)
    },
    {
      id: 'send-to-library',
      label: 'Send to Library',
      icon: '📚',
      action: 'sendToLibrary'
    },
    {
      id: 'interface-flip-lr',
      label: 'Interface Flip (LR)',
      icon: '↔️',
      action: 'interfaceFlipLR'
    },
    {
      id: 'interface-flip-tb',
      label: 'Interface Flip (TB)',
      icon: '↕️',
      action: 'interfaceFlipTB'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: '🗑️',
      action: 'delete'
    }
  ]
  return items
})

function handleContextMenu(event) {
  event.preventDefault()
  event.stopPropagation()
  contextMenuPosition.value = { x: event.clientX, y: event.clientY }
  contextMenuVisible.value = true
}

function handleMenuSelect(item) {
  if (item.action === 'installationGuide') {
    installationGuideVisible.value = true
  } else if (item.action === 'copyAsJSON') {
    handleCopyAsJSON()
  } else if (item.action === 'copyAsJSONTemplate') {
    handleCopyAsJSONTemplate()
  } else if (item.action === 'duplicate') {
    handleDuplicate()
  } else if (item.action === 'cut' && clipboardActions?.cut) {
    clipboardActions.cut()
  } else if (item.action === 'copy' && clipboardActions?.copy) {
    clipboardActions.copy()
  } else if (item.action === 'paste' && clipboardActions?.paste) {
    clipboardActions.paste()
  } else if (item.action === 'sendToLibrary') {
    handleSendToLibrary()
  } else if (item.action === 'interfaceFlipLR') {
    handleInterfaceFlipLR()
  } else if (item.action === 'interfaceFlipTB') {
    handleInterfaceFlipTB()
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

/**
 * Convert a string to a slug (lowercase, hyphenated, no special chars)
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '') // Remove special characters
    .replaceAll(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replaceAll(/(?:^-+)|(?:-+$)/g, '') // Remove leading/trailing hyphens
}

async function handleCopyAsJSON() {
  try {
    const componentToCopy = component.value
    if (!componentToCopy) {
      toastStore.show('No component selected to copy.', 'error')
      return
    }

    const jsonData = componentToCopy.toJSON()
    const jsonString = JSON.stringify(jsonData, null, 2)
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString)
      toastStore.show(`Component "${componentToCopy.name}" JSON copied to clipboard!`, 'success')
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = jsonString
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      toastStore.show(`Component "${componentToCopy.name}" JSON copied to clipboard!`, 'success')
    }
  } catch (error) {
    console.error('Error copying component to clipboard:', error)
    toastStore.show(`Failed to copy component to clipboard: ${error.message}`, 'error')
  }
}

async function handleCopyAsJSONTemplate() {
  try {
    const componentToCopy = component.value
    if (!componentToCopy) {
      toastStore.show('No component selected to copy.', 'error')
      return
    }

    // Create template format - remove instance-specific data
    const jsonData = componentToCopy.toJSON()
    
    // Generate a template-friendly ID (lowercase, hyphenated)
    const templateId = `${componentToCopy.name.toLowerCase().replaceAll(/\s+/g, '-')}-template`
    
    // Create template object matching component-library.json format
    const templateData = {
      id: templateId,
      name: jsonData.name,
      type: jsonData.type,
      properties: jsonData.properties || {},
      icon: jsonData.icon || null,
      categories: jsonData.categories || [],
      interfaces: jsonData.interfaces.map(iface => {
        // Generate a simple slug-ified ID from the interface name
        const interfaceId = slugify(iface.name)
        
        const interfaceObj = {
          id: interfaceId,
          name: iface.name,
          type: iface.type,
          direction: iface.direction,
          position: iface.position,
          rules: iface.validationRules || {},
          metadata: iface.metadata || {}
        }
        // Include icon and access if they exist (optional fields)
        if (iface.icon) {
          interfaceObj.icon = iface.icon
        }
        if (iface.access) {
          interfaceObj.access = iface.access
        }
        return interfaceObj
      }),
      nestedSystemId: null,
      position: { x: 0, y: 0 },
      metadata: jsonData.metadata || {}
    }
    
    const jsonString = JSON.stringify(templateData, null, 2)
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString)
      toastStore.show(`Component "${componentToCopy.name}" template JSON copied to clipboard!`, 'success')
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = jsonString
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      textArea.remove()
      toastStore.show(`Component "${componentToCopy.name}" template JSON copied to clipboard!`, 'success')
    }
  } catch (error) {
    console.error('Error copying component template to clipboard:', error)
    toastStore.show(`Failed to copy component template to clipboard: ${error.message}`, 'error')
  }
}

function handleDuplicate() {
  try {
    const originalComponent = component.value
    if (!originalComponent) {
      toastStore.show('No component selected to duplicate.', 'error')
      return
    }

    // Create a deep copy of the component
    const componentData = originalComponent.toJSON()
    const duplicatedComponent = Component.fromJSON(componentData)
    
    // Generate new unique ID for the component
    duplicatedComponent.id = generateUniqueId('component')
    
    // Offset position so duplicate doesn't overlap (offset by 50px)
    duplicatedComponent.position = {
      x: originalComponent.position.x + 50,
      y: originalComponent.position.y + 50
    }
    
    // Clear nested system reference (duplicate shouldn't share nested system)
    duplicatedComponent.nestedSystemId = null
    
    // Generate new IDs for all interfaces to avoid conflicts
    duplicatedComponent.interfaces = duplicatedComponent.interfaces.map(iface => {
      const newInterfaceId = generateUniqueId('interface')
      iface.id = newInterfaceId
      return iface
    })
    
    // Add the duplicated component to the system
    systemStore.addComponent(duplicatedComponent)
  } catch (error) {
    console.error('Error duplicating component:', error)
    toastStore.show(`Failed to duplicate component: ${error.message}`, 'error')
  }
}

function handleInterfaceFlipLR() {
  const comp = component.value
  if (!comp?.interfaces?.length) return
  comp.interfaces.forEach((iface) => {
    if (iface.position === 'left') iface.position = 'right'
    else if (iface.position === 'right') iface.position = 'left'
  })
  systemStore.saveToLocalStorage()
}

function handleInterfaceFlipTB() {
  const comp = component.value
  if (!comp?.interfaces?.length) return
  comp.interfaces.forEach((iface) => {
    if (iface.position === 'top') iface.position = 'bottom'
    else if (iface.position === 'bottom') iface.position = 'top'
  })
  systemStore.saveToLocalStorage()
}

function handleSendToLibrary() {
  try {
    const originalComponent = component.value
    if (!originalComponent) {
      toastStore.show('No component selected to send to library.', 'error')
      return
    }

    const templateId = generateUniqueId('template')
    const templateComponent = Component.fromJSON(originalComponent.toJSON())
    templateComponent.id = templateId
    templateComponent.position = { x: 0, y: 0 }
    templateComponent.nestedSystemId = null // Clear any nested system references

    libraryStore.addComponent(templateComponent)
    toastStore.show(`Component "${originalComponent.name}" has been added to the library!`, 'success')
  } catch (error) {
    console.error('Error sending component to library:', error)
    toastStore.show(`Failed to add component to library: ${error.message}`, 'error')
  }
}
</script>

<template>
  <div class="system-node" :class="[trustClass, { 'node-selected': selected }]" @contextmenu.prevent="handleContextMenu">
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
      <div class="node-content" :class="{ 'node-content-note': isNote }">
        <template v-if="isNote">
          <div class="node-note-title">{{ component.name }}</div>
          <div v-if="noteBodyHtml" class="node-note-body" v-html="noteBodyHtml"></div>
        </template>
        <template v-else>
          <div class="node-header">
            <div class="node-title-row">
              <MdiIcon 
                v-if="component.icon" 
                :name="component.icon" 
                :size="20"
                class="node-icon"
              />
              <div class="node-name">{{ component.name }}</div>
            </div>
            <div v-if="component.type !== 'generic'" class="node-type">{{ component.type }}</div>
          </div>
        </template>
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
      <InstallationGuideModal
        :visible="installationGuideVisible"
        :component-id="component?.id"
        @close="installationGuideVisible = false"
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
}

.system-node.trust-trusted {
  background: #ccf2cf;
}

.system-node.trust-untrusted {
  background: #f1bcc4;
}

.system-node.trust-ignored {
  background: #cecece;
}

/* Selected state: highlight border */
.system-node.node-selected {
  border-color: #1F6B66;
  border-width: 3px;
  box-shadow: 0 0 0 1px #1F6B66, 0 2px 8px rgba(0, 0, 0, 0.15);
}

html[data-theme='dark'] .system-node.node-selected {
  border-color: #5ab8b0;
  box-shadow: 0 0 0 1px #5ab8b0, 0 2px 12px rgba(0, 0, 0, 0.4);
}

/* Dark mode: darker trust backgrounds so light text stays legible */
html[data-theme='dark'] .system-node.trust-trusted {
  background: #1e3b20;
}

html[data-theme='dark'] .system-node.trust-untrusted {
  background: #4a2024;
}

html[data-theme='dark'] .system-node.trust-ignored {
  background: #3d3d3d;
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

.node-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  flex-shrink: 0;
  color: #666;
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

/* Note variant: title + markdown body */
.node-content-note {
  min-width: 180px;
  max-width: 320px;
}

.node-note-title {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

html[data-theme='dark'] .node-note-title {
  color: #e0e0e0;
  border-bottom-color: rgba(255, 255, 255, 0.15);
}

.node-note-body {
  font-size: 12px;
  color: #444;
  line-height: 1.45;
  max-height: 200px;
  overflow-y: auto;
  text-align: left;
}

.node-note-body :deep(p) {
  margin: 0 0 0.5em;
}

.node-note-body :deep(p:last-child) {
  margin-bottom: 0;
}

.node-note-body :deep(ul),
.node-note-body :deep(ol) {
  margin: 0.25em 0;
  padding-left: 1.25em;
}

.node-note-body :deep(code) {
  font-size: 0.9em;
  background: rgba(0, 0, 0, 0.06);
  padding: 0.15em 0.35em;
  border-radius: 4px;
}

html[data-theme='dark'] .node-note-body {
  color: #c0c0c0;
}

html[data-theme='dark'] .node-note-body :deep(code) {
  background: rgba(255, 255, 255, 0.1);
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
  color: #145ea9;
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

