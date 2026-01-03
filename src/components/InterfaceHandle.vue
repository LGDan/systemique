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

// Determine label position class based on interface position
const labelPositionClass = computed(() => {
  switch(props.position) {
    case Position.Top:
      return 'label-top'
    case Position.Bottom:
      return 'label-bottom'
    case Position.Left:
      return 'label-left'
    case Position.Right:
      return 'label-right'
    default:
      return ''
  }
})
</script>

<template>
  <div 
    class="interface-handle-wrapper" 
    :class="[`interface-${interface.direction}`, labelPositionClass]"
  >
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

.interface-handle {
  flex-shrink: 0;
  z-index: 10;
}

.interface-label {
  font-size: 10px;
  color: #333;
  white-space: nowrap;
  pointer-events: none;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Label positioning for different sides */
.label-left .interface-label {
  position: absolute;
  right: 100%;
  margin-right: 12px;
}

.label-right .interface-label {
  position: absolute;
  left: 100%;
  margin-left: 12px;
}

.label-top .interface-label {
  position: absolute;
  bottom: 100%;
  margin-bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.label-bottom .interface-label {
  position: absolute;
  top: 100%;
  margin-top: 12px;
  left: 50%;
  transform: translateX(-50%);
}
</style>

