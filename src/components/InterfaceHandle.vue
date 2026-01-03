<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import { getInterfaceType } from '../config/defaultInterfaceTypes.js'

const props = defineProps({
  interface: {
    type: Object,
    required: true
  },
  position: {
    type: String,
    default: Position.Top
  }
})

const interfaceType = computed(() => {
  return getInterfaceType(props.interface.type)
})

const handleStyle = computed(() => {
  return {
    backgroundColor: interfaceType.value?.color || '#DDA0DD',
    border: '2px solid #fff',
    borderRadius: '50%',
    width: '12px',
    height: '12px'
  }
})
</script>

<template>
  <div class="interface-handle-wrapper" :class="`interface-${interface.direction}`">
    <Handle
      :id="interface.id"
      :type="interface.direction === 'output' ? 'source' : 'target'"
      :position="position"
      :style="handleStyle"
      class="interface-handle"
    />
    <div class="interface-label">
      {{ interface.name }}
    </div>
  </div>
</template>

<style scoped>
.interface-handle-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.interface-handle-wrapper.interface-input {
  flex-direction: row;
}

.interface-handle-wrapper.interface-output {
  flex-direction: row-reverse;
}

.interface-handle {
  flex-shrink: 0;
}

.interface-label {
  font-size: 10px;
  color: #333;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 500;
}
</style>

