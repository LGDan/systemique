<script setup>
import { ref, computed } from 'vue'
import { Interface } from '../models/Interface.js'
import { getAllInterfaceTypes } from '../config/defaultInterfaceTypes.js'

const props = defineProps({
  interface: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'remove'])

const interfaceTypes = getAllInterfaceTypes()

const localInterface = ref({
  name: props.interface.name,
  type: props.interface.type,
  direction: props.interface.direction,
  position: props.interface.position || (props.interface.direction === 'input' ? 'left' : 'right'),
  validationRules: { ...props.interface.validationRules }
})

function updateInterface() {
  emit('update', {
    ...props.interface,
    ...localInterface.value
  })
}

function removeInterface() {
  emit('remove', props.interface.id)
}
</script>

<template>
  <div class="interface-editor">
    <div class="interface-header">
      <input
        v-model="localInterface.name"
        type="text"
        placeholder="Interface name"
        class="interface-name-input"
        @blur="updateInterface"
      />
      <button @click="removeInterface" class="remove-button">×</button>
    </div>
    
    <div class="interface-fields">
      <div class="field">
        <label>Type</label>
        <select v-model="localInterface.type" @change="updateInterface" class="field-input">
          <option v-for="type in interfaceTypes" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>
      
      <div class="field">
        <label>Direction</label>
        <select v-model="localInterface.direction" @change="updateInterface" class="field-input">
          <option value="input">Input</option>
          <option value="output">Output</option>
        </select>
      </div>

      <div class="field">
        <label>Position</label>
        <select v-model="localInterface.position" @change="updateInterface" class="field-input">
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.interface-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  background: #f9f9f9;
}

.interface-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.interface-name-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}

.remove-button {
  width: 24px;
  height: 24px;
  border: none;
  background: #ff6b6b;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.remove-button:hover {
  background: #ff5252;
}

.interface-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 11px;
  color: #666;
  font-weight: 600;
}

.field-input {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
}
</style>

