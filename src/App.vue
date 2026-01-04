<script setup>
import { ref, computed } from 'vue'
import ComponentPalette from './components/ComponentPalette.vue'
import SystemCanvas from './components/SystemCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import GroupDialog from './components/GroupDialog.vue'
import RulesEditor from './components/RulesEditor.vue'
import SecurityPanel from './components/SecurityPanel.vue'
import MenuBar from './components/MenuBar.vue'
import { useSystemStore } from './stores/systemStore.js'
import { useVueFlow } from '@vue-flow/core'
import { ExportService } from './utils/exportService.js'
import { PersistenceService } from './utils/persistenceService.js'
import { System } from './models/System.js'

const systemStore = useSystemStore()
const { getSelectedNodes } = useVueFlow()

const showGroupDialog = ref(false)
const importFileInputRef = ref(null)
const activeTab = ref('design') // 'design', 'rules', or 'security'

const selectedComponentIds = computed(() => {
  return getSelectedNodes.value.map(n => n.id)
})

function handleNewSystem() {
  if (confirm('Create a new system? Any unsaved changes will be lost.')) {
    const newSystem = new System(`system-${Date.now()}`, 'New System')
    systemStore.importSystem(newSystem.toJSON())
    systemStore.saveToLocalStorage()
  }
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
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="header-left">
        <h1 class="app-title">Systemique</h1>
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
        </div>
      </div>
    </div>

    <MenuBar
      :selected-component-ids="selectedComponentIds"
      :active-tab="activeTab"
      @group-components="handleGroup"
      @import-file="handleImportClick"
      @import-file-change="handleImportFile"
      @new-system="handleNewSystem"
      @save-as="handleSaveAs"
      @view-tab="handleViewTab"
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
      <SecurityPanel />
    </div>

    <GroupDialog
      :visible="showGroupDialog"
      :selected-component-ids="selectedComponentIds"
      @close="showGroupDialog = false"
      @created="showGroupDialog = false"
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
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
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
  color: #4ECDC4;
  border-color: #4ECDC4;
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
  border-color: #4ECDC4;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button.primary {
  background: #4ECDC4;
  color: white;
  border-color: #4ECDC4;
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

.rules-content {
  display: flex;
  flex-direction: column;
}
</style>
