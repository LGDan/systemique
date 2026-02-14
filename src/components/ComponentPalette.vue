<script setup>
import { ref, computed } from 'vue'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'
import { useSystemStore } from '../stores/systemStore.js'
import MdiIcon from './MdiIcon.vue'

const libraryStore = useComponentLibraryStore()
const systemStore = useSystemStore()

const searchQuery = ref('')
const fileInputRef = ref(null)
// Track which category sections are expanded (default: all collapsed)
const expandedCategories = ref({})

const searchLower = computed(() => searchQuery.value.trim().toLowerCase())

function isCategoryExpanded(category) {
  return expandedCategories.value[category] === true
}

function toggleCategory(category) {
  expandedCategories.value = {
    ...expandedCategories.value,
    [category]: !isCategoryExpanded(category)
  }
}

// Components in a category, filtered by search
function getComponentsForCategory(category) {
  let components = libraryStore.getComponentsByCategory(category)
  if (searchLower.value) {
    components = components.filter(c =>
      c.name.toLowerCase().includes(searchLower.value) ||
      (c.type && c.type.toLowerCase().includes(searchLower.value))
    )
  }
  return components
}

// Categories that have at least one component (after search filter)
const visibleCategories = computed(() => {
  const cats = libraryStore.categories || []
  if (!searchLower.value) return cats
  return cats.filter(cat => getComponentsForCategory(cat).length > 0)
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
    </div>

    <div v-if="libraryStore.isLoading" class="loading-message">
      Loading library...
    </div>

    <div v-else-if="libraryStore.loadError" class="error-message">
      {{ libraryStore.loadError }}
    </div>

    <div v-else class="components-list">
      <template v-if="visibleCategories.length === 0">
        <div class="empty-message">
          {{ searchQuery ? 'No components match your search.' : 'No categories in library.' }}
        </div>
      </template>
      <div
        v-for="category in visibleCategories"
        :key="category"
        class="category-section"
      >
        <button
          type="button"
          class="category-header"
          :aria-expanded="isCategoryExpanded(category)"
          @click="toggleCategory(category)"
        >
          <span class="category-chevron" :class="{ expanded: isCategoryExpanded(category) }">›</span>
          <span class="category-name">{{ category }}</span>
          <span class="category-count">{{ getComponentsForCategory(category).length }}</span>
        </button>
        <div v-show="isCategoryExpanded(category)" class="category-content">
          <div
            v-for="component in getComponentsForCategory(category)"
            :key="component.id"
            class="component-item"
            draggable="true"
            @dragstart="handleDragStart($event, component)"
          >
            <div class="component-icon">
              <MdiIcon 
                v-if="component.icon" 
                :name="component.icon" 
                :size="32"
                color="white"
              />
              <span v-else>{{ component.type?.charAt(0)?.toUpperCase() ?? '?' }}</span>
            </div>
            <div class="component-info">
              <div class="component-name">{{ component.name }}</div>
              <div class="component-type">{{ component.type }}</div>
              <div class="component-interfaces">
                {{ component.getInputInterfaces().length }} in / {{ component.getOutputInterfaces().length }} out
              </div>
            </div>
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
  border-color: #2A8A84;
}

.palette-controls {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #ddd;
}

.search-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  box-sizing: border-box;
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
  color: #b83e30;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  margin: 8px;
}

.components-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 8px;
}

.empty-message {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.category-section {
  margin-bottom: 4px;
}

.category-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: #e8e8e8;
  color: #333;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}

.category-header:hover {
  background: #ddd;
}

.category-chevron {
  flex-shrink: 0;
  width: 16px;
  font-size: 14px;
  line-height: 1;
  transition: transform 0.2s;
}

.category-chevron.expanded {
  transform: rotate(90deg);
}

.category-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-count {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 500;
  color: #666;
  background: rgba(0, 0, 0, 0.08);
  padding: 2px 6px;
  border-radius: 10px;
}

.category-content {
  padding: 4px 0 4px 8px;
  border-left: 2px solid #e0e0e0;
  margin-left: 6px;
  margin-top: 2px;
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
  border-color: #2A8A84;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.component-item:active {
  cursor: grabbing;
}

.component-icon {
  width: 40px;
  height: 40px;
  background: #2b726d;
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

