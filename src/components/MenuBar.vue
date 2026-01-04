<script setup>
import { ref, computed } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { ExportService } from '../utils/exportService.js'
import { PersistenceService } from '../utils/persistenceService.js'

const props = defineProps({
  selectedComponentIds: {
    type: Array,
    default: () => []
  },
  activeTab: {
    type: String,
    default: 'design'
  }
})

const emit = defineEmits(['group-components', 'import-file', 'new-system', 'open-file', 'save-as'])

const systemStore = useSystemStore()
const activeMenu = ref(null)
const importFileInputRef = ref(null)
const saveAsFileInputRef = ref(null)

// Recent files (stored in localStorage)
const RECENT_FILES_KEY = 'systemique-recent-files'
const recentFiles = ref([])

// Load recent files on mount
function loadRecentFiles() {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY)
    if (stored) {
      recentFiles.value = JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load recent files:', error)
  }
}

// Save recent files
function saveRecentFiles() {
  try {
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(recentFiles.value))
  } catch (error) {
    console.error('Failed to save recent files:', error)
  }
}

// Add file to recent files
function addToRecentFiles(fileName, filePath = null) {
  const entry = {
    name: fileName,
    path: filePath,
    openedAt: new Date().toISOString()
  }
  
  // Remove if already exists
  recentFiles.value = recentFiles.value.filter(f => f.name !== fileName)
  // Add to beginning
  recentFiles.value.unshift(entry)
  // Keep only last 10
  recentFiles.value = recentFiles.value.slice(0, 10)
  saveRecentFiles()
}

// Initialize
loadRecentFiles()

function toggleMenu(menuName) {
  if (activeMenu.value === menuName) {
    activeMenu.value = null
  } else {
    activeMenu.value = menuName
  }
}

function closeMenu() {
  activeMenu.value = null
}

// Close menu when clicking outside
function handleClickOutside(event) {
  if (!event.target.closest('.menu-bar')) {
    closeMenu()
  }
}

// File menu actions
function handleNew() {
  if (confirm('Create a new system? Any unsaved changes will be lost.')) {
    emit('new-system')
    closeMenu()
  }
}

function handleOpen() {
  importFileInputRef.value?.click()
  closeMenu()
}

function handleOpenRecent(file) {
  // For now, just show a message - in a real app, you'd load the file
  alert(`Opening ${file.name}...\n\nNote: File path loading not yet implemented.`)
  closeMenu()
}

function handleSave() {
  systemStore.saveToLocalStorage()
  alert('System saved successfully!')
  closeMenu()
}

function handleSaveAs() {
  emit('save-as')
  closeMenu()
}

function handleImport() {
  emit('import-file')
  closeMenu()
}

function handleExport() {
  const system = systemStore.currentSystem
  if (system) {
    ExportService.downloadJSON(system)
  }
  closeMenu()
}

function handleExportBOM() {
  const system = systemStore.currentSystem
  if (system) {
    if (system.components.length === 0) {
      alert('No components to export in the current system.')
      return
    }
    ExportService.downloadBOMCSV(system)
  }
  closeMenu()
}

// Edit menu actions
function handleGroup() {
  emit('group-components')
  closeMenu()
}

// View menu actions
function handleViewDesign() {
  emit('view-tab', 'design')
  closeMenu()
}

function handleViewInterfaceManagement() {
  emit('view-tab', 'rules')
  closeMenu()
}

function handleViewSecurity() {
  emit('view-tab', 'security')
  closeMenu()
}

const isDesignTab = computed(() => props.activeTab === 'design')
const hasSelection = computed(() => props.selectedComponentIds.length > 0)
</script>

<template>
  <div class="menu-bar" @click="handleClickOutside">
    <div class="menu-item" @click="toggleMenu('file')">
      <span>File</span>
      <div v-if="activeMenu === 'file'" class="menu-dropdown">
        <div class="menu-option" @click="handleNew">
          <span>New</span>
          <span class="menu-shortcut">Ctrl+N</span>
        </div>
        <div class="menu-option" @click="handleOpen">
          <span>Open...</span>
          <span class="menu-shortcut">Ctrl+O</span>
        </div>
        <div v-if="recentFiles.length > 0" class="menu-separator"></div>
        <div v-if="recentFiles.length > 0" class="menu-submenu">
          <div class="menu-option menu-submenu-header">
            <span>Open Recent</span>
          </div>
          <div 
            v-for="(file, index) in recentFiles.slice(0, 5)" 
            :key="index"
            class="menu-option menu-submenu-item"
            @click="handleOpenRecent(file)"
          >
            <span>{{ file.name }}</span>
          </div>
        </div>
        <div class="menu-separator"></div>
        <div class="menu-option" @click="handleSave">
          <span>Save</span>
          <span class="menu-shortcut">Ctrl+S</span>
        </div>
        <div class="menu-option" @click="handleSaveAs">
          <span>Save As...</span>
          <span class="menu-shortcut">Ctrl+Shift+S</span>
        </div>
        <div class="menu-separator"></div>
        <div class="menu-option" @click="handleImport" :disabled="!isDesignTab">
          <span>Import System...</span>
        </div>
        <div class="menu-option" @click="handleExport" :disabled="!isDesignTab">
          <span>Export System...</span>
        </div>
        <div class="menu-option" @click="handleExportBOM" :disabled="!isDesignTab">
          <span>Export BOM (CSV)...</span>
        </div>
      </div>
    </div>

    <div class="menu-item" @click="toggleMenu('edit')">
      <span>Edit</span>
      <div v-if="activeMenu === 'edit'" class="menu-dropdown">
        <div class="menu-option" @click="handleGroup" :disabled="!hasSelection || !isDesignTab">
          <span>Group Components</span>
        </div>
      </div>
    </div>

    <div class="menu-item" @click="toggleMenu('view')">
      <span>View</span>
      <div v-if="activeMenu === 'view'" class="menu-dropdown">
        <div class="menu-option" @click="handleViewDesign" :class="{ active: activeTab === 'design' }">
          <span>Design</span>
        </div>
        <div class="menu-option" @click="handleViewInterfaceManagement" :class="{ active: activeTab === 'rules' }">
          <span>Interface Management</span>
        </div>
        <div class="menu-option" @click="handleViewSecurity" :class="{ active: activeTab === 'security' }">
          <span>Security</span>
        </div>
      </div>
    </div>

    <div class="menu-item" @click="toggleMenu('arrange')">
      <span>Arrange</span>
      <div v-if="activeMenu === 'arrange'" class="menu-dropdown">
        <div class="menu-option disabled">
          <span>Coming soon...</span>
        </div>
      </div>
    </div>

    <div class="menu-item" @click="toggleMenu('extras')">
      <span>Extras</span>
      <div v-if="activeMenu === 'extras'" class="menu-dropdown">
        <div class="menu-option disabled">
          <span>Coming soon...</span>
        </div>
      </div>
    </div>

    <div class="menu-item" @click="toggleMenu('help')">
      <span>Help</span>
      <div v-if="activeMenu === 'help'" class="menu-dropdown">
        <div class="menu-option disabled">
          <span>Coming soon...</span>
        </div>
      </div>
    </div>

    <input
      ref="importFileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="$emit('import-file-change', $event)"
    />
  </div>
</template>

<style scoped>
.menu-bar {
  display: flex;
  background: #f8f8f8;
  border-bottom: 1px solid #ddd;
  padding: 0;
  font-size: 13px;
  position: relative;
  z-index: 9;
}

.menu-item {
  position: relative;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  color: #333;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: #e9e9e9;
}

.menu-item:active {
  background: #ddd;
}

.menu-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 4px 0;
  z-index: 1000;
  margin-top: 2px;
}

.menu-option {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #333;
  transition: background-color 0.1s;
  font-size: 13px;
}

.menu-option:hover:not(.disabled):not(:disabled) {
  background: #f0f0f0;
}

.menu-option:active:not(.disabled):not(:disabled) {
  background: #e0e0e0;
}

.menu-option.disabled,
.menu-option:disabled {
  color: #999;
  cursor: not-allowed;
  opacity: 0.6;
}

.menu-option.active {
  background: #E3F2FD;
  color: #1976D2;
  font-weight: 600;
}

.menu-shortcut {
  color: #999;
  font-size: 11px;
  margin-left: 24px;
}

.menu-separator {
  height: 1px;
  background: #e0e0e0;
  margin: 4px 0;
}

.menu-submenu {
  padding: 0;
}

.menu-submenu-header {
  font-weight: 600;
  color: #666;
  background: #f5f5f5;
  padding: 6px 16px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.menu-submenu-item {
  padding-left: 24px;
  font-size: 12px;
}
</style>

