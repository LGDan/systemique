<script setup>
import { computed } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'

const systemStore = useSystemStore()

const breadcrumbs = computed(() => {
  const crumbs = []
  let currentId = systemStore.currentSystemId
  
  // Build breadcrumb trail by following parentSystemId
  while (currentId) {
    const system = systemStore.getSystem(currentId)
    if (system) {
      crumbs.unshift({ id: currentId, name: system.name })
      currentId = system.parentSystemId
    } else {
      break
    }
  }
  
  return crumbs
})

function navigateToSystem(systemId) {
  // Navigate to system by finding path
  const targetIndex = breadcrumbs.value.findIndex(c => c.id === systemId)
  if (targetIndex >= 0) {
    // Pop navigation stack until we reach the target
    while (systemStore.navigationStack.value.length > targetIndex) {
      systemStore.drillUp()
    }
    systemStore.setCurrentSystem(systemId)
  }
}
</script>

<template>
  <div class="breadcrumb-nav">
    <button
      v-if="systemStore.canGoBack"
      @click="systemStore.drillUp"
      class="back-button"
    >
      ← Back
    </button>
    
    <div class="breadcrumb-list">
      <span
        v-for="(crumb, index) in breadcrumbs"
        :key="crumb.id"
        class="breadcrumb-item"
      >
        <button
          v-if="index < breadcrumbs.length - 1"
          @click="navigateToSystem(crumb.id)"
          class="breadcrumb-link"
        >
          {{ crumb.name }}
        </button>
        <span v-else class="breadcrumb-current">{{ crumb.name }}</span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">/</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.breadcrumb-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #ddd;
}

.back-button {
  padding: 6px 12px;
  background: #4ECDC4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.back-button:hover {
  background: #3AB8B0;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: #4ECDC4;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 4px;
  text-decoration: underline;
}

.breadcrumb-link:hover {
  color: #3AB8B0;
}

.breadcrumb-current {
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.breadcrumb-separator {
  color: #999;
  font-size: 12px;
  margin: 0 4px;
}
</style>

