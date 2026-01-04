<script setup>
import { ref, computed } from 'vue'
import ComponentPalette from './components/ComponentPalette.vue'
import SystemCanvas from './components/SystemCanvas.vue'
import PropertiesPanel from './components/PropertiesPanel.vue'
import GroupDialog from './components/GroupDialog.vue'
import { useSystemStore } from './stores/systemStore.js'
import { useVueFlow } from '@vue-flow/core'
import { ExportService } from './utils/exportService.js'
import { PersistenceService } from './utils/persistenceService.js'

const systemStore = useSystemStore()
const { getSelectedNodes } = useVueFlow()

const showGroupDialog = ref(false)
const importFileInputRef = ref(null)

const selectedComponentIds = computed(() => {
  return getSelectedNodes.value.map(n => n.id)
})

function handleExport() {
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
    const system = await PersistenceService.importFromFile(file)
    systemStore.importSystem(system.toJSON())
    alert(`Successfully imported system: ${system.name}`)
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
</script>

<template>
  <div class="app-container">
    <div class="app-header">
      <div class="header-left">
        <h1 class="app-title">Systemique</h1>
      </div>
      <div class="header-actions">
        <button @click="handleGroup" :disabled="selectedComponentIds.length < 2" class="action-button">
          Group Components
        </button>
        <button @click="handleImportClick" class="action-button">
          Import System
        </button>
        <button @click="handleExport" class="action-button primary">
          Export System
        </button>
        <input
          ref="importFileInputRef"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleImportFile"
        />
      </div>
    </div>

    <div class="app-content">
      <ComponentPalette />
      <SystemCanvas />
      <PropertiesPanel />
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
</style>
