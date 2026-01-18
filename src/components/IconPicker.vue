<script setup>
import { ref, computed } from 'vue'
import { getAvailableIcons } from '../config/iconLibrary.js'
import MdiIcon from './MdiIcon.vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const showPicker = ref(false)
const searchQuery = ref('')

const availableIcons = getAvailableIcons()

const filteredIcons = computed(() => {
  if (!searchQuery.value) {
    return availableIcons
  }
  const query = searchQuery.value.toLowerCase()
  return availableIcons.filter(icon => icon.includes(query))
})

function selectIcon(iconName) {
  emit('update:modelValue', iconName)
  showPicker.value = false
  searchQuery.value = ''
}

function clearIcon() {
  emit('update:modelValue', null)
  showPicker.value = false
}

function togglePicker() {
  showPicker.value = !showPicker.value
  if (!showPicker.value) {
    searchQuery.value = ''
  }
}
</script>

<template>
  <div class="icon-picker">
    <div class="current-icon" @click="togglePicker">
      <div v-if="modelValue" class="icon-preview">
        <MdiIcon :name="modelValue" :size="24" />
        <span class="icon-name">{{ modelValue }}</span>
      </div>
      <div v-else class="no-icon">
        <span>No icon</span>
      </div>
      <span class="picker-arrow">{{ showPicker ? '▲' : '▼' }}</span>
    </div>

    <div v-if="showPicker" class="picker-dropdown">
      <div class="picker-header">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search icons..."
          class="icon-search"
          @click.stop
        />
        <button 
          v-if="modelValue" 
          @click.stop="clearIcon" 
          class="clear-button"
          title="Clear icon"
        >
          ✕
        </button>
      </div>

      <div class="icons-grid">
        <div
          v-for="icon in filteredIcons"
          :key="icon"
          class="icon-option"
          :class="{ selected: icon === modelValue }"
          @click.stop="selectIcon(icon)"
          :title="icon"
        >
          <MdiIcon :name="icon" :size="24" />
          <span class="icon-label">{{ icon }}</span>
        </div>
      </div>

      <div v-if="filteredIcons.length === 0" class="no-results">
        No icons found
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-picker {
  position: relative;
}

.current-icon {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  min-height: 40px;
  transition: border-color 0.2s;
}

.current-icon:hover {
  border-color: #2A8A84;
}

.icon-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.icon-name {
  font-size: 12px;
  color: #333;
}

.no-icon {
  color: #999;
  font-size: 12px;
  font-style: italic;
  flex: 1;
}

.picker-arrow {
  font-size: 10px;
  color: #666;
  margin-left: 8px;
}

.picker-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  display: flex;
  flex-direction: column;
}

.picker-header {
  padding: 8px;
  border-bottom: 1px solid #eee;
  display: flex;
  gap: 4px;
}

.icon-search {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.icon-search:focus {
  outline: none;
  border-color: #2A8A84;
}

.clear-button {
  padding: 4px 8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}

.clear-button:hover {
  background: #d32f2f;
}

.icons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 4px;
  padding: 8px;
  overflow-y: auto;
  max-height: 240px;
}

.icon-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-option:hover {
  background: #f0f0f0;
  border-color: #2A8A84;
}

.icon-option.selected {
  background: #E0F7F6;
  border-color: #2A8A84;
}

.icon-label {
  font-size: 9px;
  color: #666;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-results {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 12px;
  font-style: italic;
}
</style>

