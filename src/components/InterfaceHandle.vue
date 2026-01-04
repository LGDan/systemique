<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'
import { getInterfaceType } from '../config/defaultInterfaceTypes.js'
import MdiIcon from './MdiIcon.vue'

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
  // If there's an icon, make the handle larger and transparent
  if (props.interface.icon) {
    return {
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }
  
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

// Determine label color class based on interface access
const labelAccessClass = computed(() => {
  const access = props.interface.access
  if (!access || access === 'Unset' || access === 'unset') {
    return '' // Default/unset - no special class
  }
  if (access === 'trusted') {
    return 'access-trusted'
  }
  if (access === 'untrusted') {
    return 'access-untrusted'
  }
  if (access === 'ignored') {
    return 'access-ignored'
  }
  return ''
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
    >
      <MdiIcon 
        v-if="interface.icon" 
        :name="interface.icon" 
        :size="16"
        :color="interfaceType?.color || '#666'"
        class="interface-icon"
      />
    </Handle>
    <div class="interface-label" :class="labelAccessClass">
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

.interface-icon {
  pointer-events: none;
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

.interface-label.access-trusted {
  color: #247c2a; /* Dark green */
}

.interface-label.access-untrusted {
  color: #b71c1c; /* Dark red */
}

.interface-label.access-ignored {
  color: #929292; /* Grey */
  text-decoration: line-through;
}

/* Label positioning for different sides */
.label-left .interface-label {
  position: absolute;
  right: 100%;
  margin-right: 20px;
}

.label-right .interface-label {
  position: absolute;
  left: 100%;
  margin-left: 20px;
}

.label-top .interface-label {
  position: absolute;
  left: -8px;
  bottom: calc(100% + 1px); /* Push it above the component */
  transform: rotate(-90deg);
  transform-origin: top left;
  white-space: nowrap;
}

.label-bottom .interface-label {
  position: absolute;
  left: -8px;
  top: calc(100% + 1px); /* Push it below the component */
  transform: rotate(90deg);
  transform-origin: bottom left;
  white-space: nowrap;
}
</style>

