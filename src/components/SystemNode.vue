<script setup>
import { computed } from 'vue'
import { Position } from '@vue-flow/core'
import InterfaceHandle from './InterfaceHandle.vue'
import { useSystemStore } from '../stores/systemStore.js'

const props = defineProps({
  id: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    required: true
  }
})

const systemStore = useSystemStore()

const component = computed(() => {
  return props.data.component
})

const inputInterfaces = computed(() => {
  return component.value?.getInputInterfaces() || []
})

const outputInterfaces = computed(() => {
  return component.value?.getOutputInterfaces() || []
})

const hasNestedSystem = computed(() => {
  return component.value?.hasNestedSystem() || false
})

function handleDrillDown() {
  if (hasNestedSystem.value) {
    systemStore.drillDown(component.value.id)
  } else {
    // Create nested system if it doesn't exist
    const systemName = `${component.value.name} - Internal`
    systemStore.createNestedSystem(component.value.id, systemName)
    systemStore.drillDown(component.value.id)
  }
}
</script>

<template>
  <div class="system-node">
    <!-- Input interfaces on the left -->
    <div class="interfaces inputs">
      <InterfaceHandle
        v-for="iface in inputInterfaces"
        :key="iface.id"
        :interface="iface"
        :position="Position.Left"
      />
    </div>

    <!-- Node content -->
    <div class="node-content">
      <div class="node-header">
        <div class="node-name">{{ component.name }}</div>
        <div v-if="component.type !== 'generic'" class="node-type">{{ component.type }}</div>
      </div>
      
      <div v-if="hasNestedSystem" class="nested-indicator" @click="handleDrillDown">
        <span>🔽</span> Has nested system
      </div>
      <div v-else class="drill-down-button" @click="handleDrillDown">
        <span>➕</span> Create nested system
      </div>
    </div>

    <!-- Output interfaces on the right -->
    <div class="interfaces outputs">
      <InterfaceHandle
        v-for="iface in outputInterfaces"
        :key="iface.id"
        :interface="iface"
        :position="Position.Right"
      />
    </div>
  </div>
</template>

<style scoped>
.system-node {
  min-width: 150px;
  background: white;
  border: 2px solid #333;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.node-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.node-type {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
}

.interfaces {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 60px;
}

.nested-indicator,
.drill-down-button {
  font-size: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.2s;
}

.nested-indicator {
  background-color: #E3F2FD;
  color: #1976D2;
}

.drill-down-button {
  background-color: #F5F5F5;
  color: #666;
}

.nested-indicator:hover {
  background-color: #BBDEFB;
}

.drill-down-button:hover {
  background-color: #E0E0E0;
}
</style>

