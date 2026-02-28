<script setup>
import { ref } from 'vue'
import InterfaceAccessAudit from './InterfaceAccessAudit.vue'
import BoundaryAudit from './BoundaryAudit.vue'
import ComplexityReview from './ComplexityReview.vue'

const emit = defineEmits(['navigate-to-component'])
const activeView = ref('interface-access-audit')

function handleNavigateToComponent(componentId) {
  emit('navigate-to-component', componentId)
}
</script>

<template>
  <div class="security-panel">
    <div class="security-navbar">
      <h3 class="navbar-title">Security Tools</h3>
      <nav class="navbar-menu">
        <button 
          @click="activeView = 'interface-access-audit'"
          :class="['nav-item', { active: activeView === 'interface-access-audit' }]"
        >
          Interface Access Audit
        </button>
        <button 
          @click="activeView = 'boundary-audit'"
          :class="['nav-item', { active: activeView === 'boundary-audit' }]"
        >
          Boundary Audit
        </button>
        <button 
          @click="activeView = 'complexity-review'"
          :class="['nav-item', { active: activeView === 'complexity-review' }]"
        >
          Complexity Review
        </button>
      </nav>
    </div>
    
    <div class="security-content">
      <InterfaceAccessAudit
        v-if="activeView === 'interface-access-audit'"
        @navigate-to-component="handleNavigateToComponent"
      />
      <BoundaryAudit
        v-if="activeView === 'boundary-audit'"
        @navigate-to-component="handleNavigateToComponent"
      />
      <ComplexityReview v-if="activeView === 'complexity-review'" />
    </div>
  </div>
</template>

<style scoped>
.security-panel {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: white;
}

.security-navbar {
  width: 220px;
  background: #f9f9f9;
  border-right: 1px solid #ddd;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.navbar-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.navbar-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: #666;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #e9e9e9;
  color: #333;
}

.nav-item.active {
  background: #31817c;
  color: white;
  font-weight: 600;
}

.security-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}
</style>

