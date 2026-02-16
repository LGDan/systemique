<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import ComponentPalette from './components/ComponentPalette.vue'
import SystemCanvas from './components/SystemCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import GroupDialog from './components/GroupDialog.vue'
import NewModelModal from './components/NewModelModal.vue'
import RulesEditor from './components/RulesEditor.vue'
import SecurityPanel from './components/SecurityPanel.vue'
import ArchitectureLibrary from './components/ArchitectureLibrary.vue'
import MenuBar from './components/MenuBar.vue'
import { useSystemStore } from './stores/systemStore.js'
import { useInterfaceTypesStore } from './stores/interfaceTypesStore.js'
import { useInterfaceRulesStore } from './stores/interfaceRulesStore.js'
import { useVueFlow } from '@vue-flow/core'
import { ExportService } from './utils/exportService.js'
import { hasInterfaceTypesUrlParam, hasInterfaceRulesUrlParam, getInterfaceTypesUrl, getInterfaceRulesUrl } from './utils/urlConfig.js'
import { PersistenceService } from './utils/persistenceService.js'
import { System } from './models/System.js'

const systemStore = useSystemStore()
const { getSelectedNodes } = useVueFlow()

const logoUrl = `${import.meta.env.BASE_URL}systemique-logo.svg`

const tips = ref([])
const currentTip = ref('')
let tipIntervalId = null

async function loadTips() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}tips.json`)
    if (res.ok) {
      const data = await res.json()
      tips.value = Array.isArray(data) ? data : (data.tips || [])
      pickRandomTip()
    }
  } catch (err) {
    console.warn('Could not load tips:', err)
  }
}

function pickRandomTip() {
  if (tips.value.length === 0) return
  const i = Math.floor(Math.random() * tips.value.length)
  currentTip.value = tips.value[i]
}

const THEME_STORAGE_KEY = 'systemique-theme'
const savedTheme = () => {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(THEME_STORAGE_KEY)
  return stored ?? 'light'
}
const theme = ref(savedTheme())

function applyTheme(value) {
  document.documentElement.dataset.theme = value
}

function setTheme(value) {
  theme.value = value
  applyTheme(value)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, value)
  } catch {
    /* localStorage may be disabled or full */
  }
}
function toggleTheme() {
  setTheme(theme.value === 'dark' ? 'light' : 'dark')
}

const showGroupDialog = ref(false)
const importFileInputRef = ref(null)
const activeTab = ref('design') // 'design', 'rules', or 'security'

const selectedComponentIds = computed(() => {
  return getSelectedNodes.value.map(n => n.id)
})

function handleNewSystem() {
  systemStore.requestNewModelModal()
}

function handleNewModelSubmit({ title, description }) {
  const reason = systemStore.newModelModalReason
  if (reason === 'first-load') {
    systemStore.applyNewModelInfo({ name: title, description })
  } else if (reason === 'new') {
    const newSystem = new System(`system-${Date.now()}`, title)
    if (!newSystem.metadata) newSystem.metadata = {}
    newSystem.metadata.description = description ?? ''
    systemStore.importSystem(newSystem.toJSON())
    systemStore.closeNewModelModal()
  }
}

function handleNewModelClose() {
  systemStore.closeNewModelModal()
}

function handleSaveAs() {
  const system = systemStore.currentSystem
  if (system) {
    ExportService.downloadJSON(system)
  }
}

function handleImportClick() {
  importFileInputRef.value?.click()
}

async function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const result = await PersistenceService.importFromFile(file)
    systemStore.importSystem(result.system.toJSON())
    
    // Import interface types and rules if present
    if (result.interfaceTypes || result.interfaceRules) {
      PersistenceService.importInterfaceConfig(result.interfaceTypes, result.interfaceRules)
    }
    
    const message = result.interfaceTypes || result.interfaceRules
      ? `Successfully imported system: ${result.system.name}\nInterface types and rules have been imported.`
      : `Successfully imported system: ${result.system.name}`
    alert(message)
  } catch (error) {
    console.error('Failed to import system:', error)
    alert('Failed to import system: ' + error.message)
  }

  // Clear the file input
  event.target.value = ''
}

function handleGroup() {
  if (selectedComponentIds.value.length >= 2) {
    showGroupDialog.value = true
  }
}

function handleViewTab(tab) {
  activeTab.value = tab
}

function handleOpenDesign() {
  activeTab.value = 'design'
}

function handleNavigateToComponent(componentId) {
  activeTab.value = 'design'
  systemStore.requestNavigateToComponent(componentId)
}

onMounted(() => {
  applyTheme(theme.value)
  loadTips()
  tipIntervalId = setInterval(pickRandomTip, 10_000)

  // Load interface types/rules from URL when query params are set
  const typesStore = useInterfaceTypesStore()
  const rulesStore = useInterfaceRulesStore()
  if (hasInterfaceTypesUrlParam()) {
    typesStore.loadFromServer(getInterfaceTypesUrl()).catch((err) => {
      console.warn('Failed to load interface types from URL:', err.message)
    })
  }
  if (hasInterfaceRulesUrlParam()) {
    rulesStore.loadFromServer(getInterfaceRulesUrl()).catch((err) => {
      console.warn('Failed to load interface rules from URL:', err.message)
    })
  }
})

onUnmounted(() => {
  if (tipIntervalId) clearInterval(tipIntervalId)
})

// Default node size for alignment (right/center/bottom use this)
const NODE_WIDTH = 120
const NODE_HEIGHT = 80

function handleArrangeAlignHorizontal(mode) {
  const ids = selectedComponentIds.value
  if (ids.length < 2) return
  const system = systemStore.currentSystem
  if (!system) return

  const components = ids.map(id => systemStore.getComponent(id)).filter(Boolean)
  if (components.length < 2) return

  const minX = Math.min(...components.map(c => c.position.x))
  const maxRight = Math.max(...components.map(c => c.position.x + NODE_WIDTH))
  const centerX = (minX + maxRight) / 2

  components.forEach(comp => {
    if (mode === 'left') {
      comp.position.x = minX
    } else if (mode === 'center') {
      comp.position.x = centerX - NODE_WIDTH / 2
    } else if (mode === 'right') {
      comp.position.x = maxRight - NODE_WIDTH
    }
  })
  systemStore.saveToLocalStorage()
}

function handleArrangeFlipHorizontal() {
  const system = systemStore.currentSystem
  if (!system?.components?.length) return

  const components = system.components
  const minX = Math.min(...components.map(c => c.position.x))
  const maxRight = Math.max(...components.map(c => c.position.x + NODE_WIDTH))
  const centerX = (minX + maxRight) / 2

  components.forEach((comp) => {
    comp.position.x = 2 * centerX - comp.position.x - NODE_WIDTH
    ;(comp.interfaces || []).forEach((iface) => {
      if (iface.position === 'left') iface.position = 'right'
      else if (iface.position === 'right') iface.position = 'left'
    })
  })
  systemStore.saveToLocalStorage()
  window.location.reload()
}

function handleArrangeAlignVertical(mode) {
  const ids = selectedComponentIds.value
  if (ids.length < 2) return
  const system = systemStore.currentSystem
  if (!system) return

  const components = ids.map(id => systemStore.getComponent(id)).filter(Boolean)
  if (components.length < 2) return

  const minY = Math.min(...components.map(c => c.position.y))
  const maxBottom = Math.max(...components.map(c => c.position.y + NODE_HEIGHT))
  const centerY = (minY + maxBottom) / 2

  components.forEach(comp => {
    if (mode === 'top') {
      comp.position.y = minY
    } else if (mode === 'middle') {
      comp.position.y = centerY - NODE_HEIGHT / 2
    } else if (mode === 'bottom') {
      comp.position.y = maxBottom - NODE_HEIGHT
    }
  })
  systemStore.saveToLocalStorage()
}
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="header-left">
        <div class="app-brand">
          <img :src="logoUrl" alt="" class="app-logo" width="32" height="32" />
          <h1 class="app-title">Systemique</h1>
        </div>
        <div class="tabs">
          <button 
            @click="activeTab = 'design'"
            :class="['tab-button', { active: activeTab === 'design' }]"
          >
            Design
          </button>
          <button 
            @click="activeTab = 'rules'"
            :class="['tab-button', { active: activeTab === 'rules' }]"
          >
            Interface Management
          </button>
          <button 
            @click="activeTab = 'security'"
            :class="['tab-button', { active: activeTab === 'security' }]"
          >
            Security
          </button>
          <button 
            @click="activeTab = 'library'"
            :class="['tab-button', { active: activeTab === 'library' }]"
          >
            Architecture Library
          </button>
        </div>
      </div>
      <div v-if="currentTip" class="header-tip">
        <span class="header-tip-label">Tip:</span>
        <span class="header-tip-text">{{ currentTip }}</span>
      </div>
    </div>

    <MenuBar
      :selected-component-ids="selectedComponentIds"
      :active-tab="activeTab"
      :dark-theme="theme === 'dark'"
      @group-components="handleGroup"
      @toggle-theme="toggleTheme"
      @import-file="handleImportClick"
      @import-file-change="handleImportFile"
      @new-system="handleNewSystem"
      @save-as="handleSaveAs"
      @view-tab="handleViewTab"
      @arrange-align-horizontal="handleArrangeAlignHorizontal"
      @arrange-align-vertical="handleArrangeAlignVertical"
      @arrange-flip-horizontal="handleArrangeFlipHorizontal"
    />

    <div v-if="activeTab === 'design'" class="app-content">
      <ComponentPalette />
      <SystemCanvas />
      <PropertiesPanel />
    </div>

    <div v-else-if="activeTab === 'rules'" class="app-content rules-content">
      <RulesEditor />
    </div>

    <div v-else-if="activeTab === 'security'" class="app-content security-content">
      <SecurityPanel @navigate-to-component="handleNavigateToComponent" />
    </div>

    <div v-else-if="activeTab === 'library'" class="app-content library-content">
      <ArchitectureLibrary @open-design="handleOpenDesign" />
    </div>

    <GroupDialog
      :visible="showGroupDialog"
      :selected-component-ids="selectedComponentIds"
      @close="showGroupDialog = false"
      @created="showGroupDialog = false"
    />

    <NewModelModal
      :visible="systemStore.showNewModelModal"
      :initial-title="systemStore.newModelModalReason === 'first-load' && systemStore.currentSystem ? systemStore.currentSystem.name : ''"
      :initial-description="systemStore.newModelModalReason === 'first-load' ? (systemStore.currentSystem?.metadata?.description ?? '') : ''"
      @submit="handleNewModelSubmit"
      @close="handleNewModelClose"
    />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #ddd;
  z-index: 10;
  gap: 16px;
}

.header-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 6px 12px;
  background: #f0f9f8;
  border: 1px solid #d0e8e6;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
}

.header-tip-label {
  font-weight: 600;
  color: #1F6B66;
  flex-shrink: 0;
}

.header-tip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.app-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-logo {
  display: block;
  flex-shrink: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  margin-left: 16px;
}

.tab-button {
  padding: 6px 16px;
  border: 1px solid #ddd;
  border-radius: 4px 4px 0 0;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
  border-bottom: none;
}

.tab-button:hover {
  background: #e9e9e9;
  color: #333;
}

.tab-button.active {
  background: white;
  color: #1F6B66;
  border-color: #1F6B66;
  border-bottom-color: white;
  position: relative;
  z-index: 1;
}

.app-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.action-button:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #2A8A84;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  background: #1F6B66;
  color: white;
  border-color: #1F6B66;
}

.action-button.primary:hover:not(:disabled) {
  background: #3AB8B0;
  border-color: #3AB8B0;
}

.app-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.rules-content,
.library-content {
  display: flex;
  flex-direction: column;
}
</style>
