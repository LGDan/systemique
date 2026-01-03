<script setup>
import { ref, computed } from 'vue'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'
import { useSystemStore } from '../stores/systemStore.js'

const libraryStore = useComponentLibraryStore()
const systemStore = useSystemStore()

const searchQuery = ref('')
const selectedCategory = ref('All')
const fileInputRef = ref(null)

const filteredComponents = computed(() => {
  let components = libraryStore.getAllComponents()
  
  if (selectedCategory.value !== 'All') {
    components = libraryStore.getComponentsByCategory(selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    components = components.filter(c => 
      c.name.toLowerCase().includes(query) ||
      c.type.toLowerCase().includes(query)
    )
  }
  
  return components
})

function handleDragStart(event, component) {
  event.dataTransfer.setData('application/systemique-component', component.id)
  event.dataTransfer.effectAllowed = 'copy'
}

function generateComponentId() {
  return `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function handleExport() {
  try {
    libraryStore.downloadJSON()
  } catch (error) {
    console.error('Failed to export library:', error)
    alert('Failed to export library: ' + error.message)
  }
}

function handleImportClick() {
  fileInputRef.value?.click()
}

async function handleImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const result = await libraryStore.importFromFile(file)
    alert(`Successfully imported ${result.count} components!`)
  } catch (error) {
    console.error('Failed to import library:', error)
    alert('Failed to import library: ' + error.message)
  }

  // Clear the file input
  event.target.value = ''
}

async function handleReload() {
  try {
    const result = await libraryStore.loadFromServer()
    alert(`Successfully loaded ${result.count} components from server!`)
  } catch (error) {
    console.error('Failed to reload library:', error)
    alert('Failed to reload library: ' + error.message)
  }
}
</script>

<template>
  <div class="component-palette">
    <div class="palette-header">
      <h3>Component Library</h3>
      <div class="header-actions">
        <button @click="handleReload" class="icon-button" title="Reload from server">
          🔄
        </button>
        <button @click="handleImportClick" class="icon-button" title="Import library">
          📁
        </button>
        <button @click="handleExport" class="icon-button" title="Export library">
          💾
        </button>
      </div>
    </div>
    
    <div class="palette-controls">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search components..."
        class="search-input"
      />
      
      <select v-model="selectedCategory" class="category-select">
        <option value="All">All Categories</option>
        <option v-for="category in libraryStore.categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>

    <div v-if="libraryStore.isLoading" class="loading-message">
      Loading library...
    </div>

    <div v-else-if="libraryStore.loadError" class="error-message">
      {{ libraryStore.loadError }}
    </div>

    <div v-else class="components-list">
      <div
        v-for="component in filteredComponents"
        :key="component.id"
        class="component-item"
        draggable="true"
        @dragstart="handleDragStart($event, component)"
      >
        <div class="component-icon">{{ component.type.charAt(0).toUpperCase() }}</div>
        <div class="component-info">
          <div class="component-name">{{ component.name }}</div>
          <div class="component-type">{{ component.type }}</div>
          <div class="component-interfaces">
            {{ component.getInputInterfaces().length }} in / {{ component.getOutputInterfaces().length }} out
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file input for import -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />
  </div>
</template>

<style scoped>
.component-palette {
  width: 250px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.palette-header {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.palette-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #f5f5f5;
  border-color: #4ECDC4;
}

.palette-controls {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-input,
.category-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.loading-message,
.error-message {
  padding: 16px;
  text-align: center;
  font-size: 12px;
}

.loading-message {
  color: #666;
}

.error-message {
  color: #e74c3c;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  margin: 8px;
}

.components-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: grab;
  transition: all 0.2s;
}

.component-item:hover {
  border-color: #4ECDC4;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.component-item:active {
  cursor: grabbing;
}

.component-icon {
  width: 40px;
  height: 40px;
  background: #4ECDC4;
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.component-info {
  flex: 1;
  min-width: 0;
}

.component-name {
  font-weight: 600;
  font-size: 13px;
  color: #333;
  margin-bottom: 2px;
}

.component-type {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.component-interfaces {
  font-size: 10px;
  color: #999;
}
</style>

