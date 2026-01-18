<script setup>
import { ref } from 'vue'
import { Component } from '../models/Component.js'
import { useSystemStore } from '../stores/systemStore.js'
import { useComponentLibraryStore } from '../stores/componentLibraryStore.js'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  selectedComponentIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'created'])

const systemStore = useSystemStore()
const libraryStore = useComponentLibraryStore()

const groupName = ref('')
const groupType = ref('grouped')

function createGroup() {
  if (!groupName.value.trim() || props.selectedComponentIds.length < 2) {
    return
  }

  // Create a new component that represents the group
  const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const groupComponent = new Component(groupId, groupName.value, groupType.value)
  
  // Determine interfaces from selected components
  // For now, we'll create a simple grouped component
  // In a full implementation, we'd analyze connections and create appropriate interfaces
  
  // Add to current system
  systemStore.addComponent(groupComponent)
  
  // Optionally save to library
  libraryStore.addComponent(groupComponent)
  
  emit('created', groupComponent)
  emit('close')
  
  // Reset form
  groupName.value = ''
  groupType.value = 'grouped'
}

function cancel() {
  emit('close')
  groupName.value = ''
}
</script>

<template>
  <div v-if="visible" class="group-dialog-overlay" @click="cancel">
    <div class="group-dialog" @click.stop>
      <div class="dialog-header">
        <h3>Group Components</h3>
        <button @click="cancel" class="close-button">×</button>
      </div>
      
      <div class="dialog-content">
        <p class="info-text">
          Grouping {{ selectedComponentIds.length }} components into a reusable component.
        </p>
        
        <div class="field">
          <label for="group-name-input">Component Name</label>
          <input
            id="group-name-input"
            v-model="groupName"
            type="text"
            placeholder="Enter component name"
            class="field-input"
          />
        </div>
        
        <div class="field">
          <label for="group-type-input">Component Type</label>
          <input
            id="group-type-input"
            v-model="groupType"
            type="text"
            placeholder="e.g., subsystem, module"
            class="field-input"
          />
        </div>
      </div>
      
      <div class="dialog-actions">
        <button @click="cancel" class="cancel-button">Cancel</button>
        <button @click="createGroup" class="create-button" :disabled="!groupName.trim()">
          Create Group
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.group-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.group-dialog {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
}

.close-button:hover {
  color: #333;
}

.dialog-content {
  padding: 16px;
}

.info-text {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: #666;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.field label {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.field-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid #ddd;
}

.cancel-button,
.create-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.cancel-button {
  background: #f5f5f5;
  color: #333;
}

.cancel-button:hover {
  background: #e0e0e0;
}

.create-button {
  background: #2f7d78;
  color: white;
}

.create-button:hover:not(:disabled) {
  background: #3AB8B0;
}

.create-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>

