<script setup>
import { ref, computed } from 'vue'
import { Interface } from '../models/Interface.js'
import { getAllInterfaceTypes } from '../config/defaultInterfaceTypes.js'
import IconPicker from './IconPicker.vue'

const props = defineProps({
  interface: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'remove', 'duplicate'])

const interfaceTypes = getAllInterfaceTypes()

const localInterface = ref({
  name: props.interface.name,
  type: props.interface.type,
  direction: props.interface.direction,
  position: props.interface.position || (props.interface.direction === 'input' ? 'left' : 'right'),
  icon: props.interface.icon || null,
  access: props.interface.access || null,
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

function duplicateInterface() {
  emit('duplicate', props.interface.id)
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
      <button @click="duplicateInterface" class="duplicate-button" title="Duplicate interface">⎘</button>
      <button @click="removeInterface" class="remove-button" title="Remove interface">×</button>
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

      <div class="field">
        <label>Access</label>
        <select v-model="localInterface.access" @change="updateInterface" class="field-input">
          <option :value="null">Unset</option>
          <option value="trusted">Trusted</option>
          <option value="untrusted">Untrusted</option>
          <option value="ignored">Ignored</option>
        </select>
      </div>

      <div class="field">
        <label>Icon</label>
        <IconPicker 
          v-model="localInterface.icon"
          @update:modelValue="updateInterface"
        />
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

.duplicate-button {
  width: 24px;
  height: 24px;
  border: none;
  background: #4ECDC4;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.duplicate-button:hover {
  background: #3AB8B0;
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

