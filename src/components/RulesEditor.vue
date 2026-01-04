<script setup>
import { computed } from 'vue'
import { getAllInterfaceTypes } from '../config/defaultInterfaceTypes.js'
import { useInterfaceRulesStore } from '../stores/interfaceRulesStore.js'
import { areTypesCompatible } from '../utils/interfaceCompatibility.js'

const interfaceTypes = getAllInterfaceTypes()
const rulesStore = useInterfaceRulesStore()

/**
 * Get the state for a cell (source type -> target type)
 * Returns: 'default' | 'allow' | 'deny'
 */
function getCellState(sourceType, targetType) {
  const rule = rulesStore.getRule(sourceType, targetType)
  
  if (rule === true) return 'allow'
  if (rule === false) return 'deny'
  
  // Default: no explicit rule set, show as 'default'
  return 'default'
}

/**
 * Get the effective state (what actually happens) for display
 */
function getEffectiveState(sourceType, targetType) {
  const rule = rulesStore.getRule(sourceType, targetType)
  
  if (rule === true) return 'allow'
  if (rule === false) return 'deny'
  
  // Default: check compatibility matrix
  // If types match, default is allow
  if (sourceType === targetType) return 'allow'
  
  // Otherwise check compatibility matrix
  return areTypesCompatible(sourceType, targetType) ? 'allow' : 'deny'
}

function handleCellClick(sourceType, targetType) {
  rulesStore.cycleRule(sourceType, targetType)
}

function getCellClass(sourceType, targetType) {
  const state = getCellState(sourceType, targetType)
  const effective = getEffectiveState(sourceType, targetType)
  
  if (state === 'default') {
    return {
      'cell-default': true,
      'cell-default-allow': effective === 'allow',
      'cell-default-deny': effective === 'deny'
    }
  }
  
  return {
    'cell-allow': state === 'allow',
    'cell-deny': state === 'deny'
  }
}

function getCellEmoji(sourceType, targetType) {
  const state = getCellState(sourceType, targetType)
  
  if (state === 'allow') return '✓'
  if (state === 'deny') return '✗'
  return '○'
}

function getCellTitle(sourceType, targetType) {
  const state = getCellState(sourceType, targetType)
  const effective = getEffectiveState(sourceType, targetType)
  const sourceName = interfaceTypes.find(t => t.id === sourceType)?.name || sourceType
  const targetName = interfaceTypes.find(t => t.id === targetType)?.name || targetType
  
  if (state === 'allow') {
    return `${sourceName} → ${targetName}: Explicitly Allowed (click to change)`
  }
  if (state === 'deny') {
    return `${sourceName} → ${targetName}: Explicitly Denied (click to change)`
  }
  return `${sourceName} → ${targetName}: Default (${effective === 'allow' ? 'Allowed' : 'Denied'} via compatibility matrix) - Click to set explicit rule`
}
</script>

<template>
  <div class="rules-editor">
    <div class="rules-header">
      <h2>Interface Type Connection Rules</h2>
      <p class="rules-description">
        Click cells to toggle connection rules between interface types. 
        <strong>Default</strong> (○) uses compatibility matrix, <strong>Allow</strong> (✓) always allows, <strong>Deny</strong> (✗) always blocks.
        Click again to cycle: Default → Allow → Deny → Default
      </p>
      <button @click="rulesStore.clearAllRules()" class="clear-all-button">
        Clear All Rules
      </button>
    </div>

    <div class="matrix-container">
      <div class="matrix-table">
        <!-- Header row -->
        <div class="matrix-row header-row">
          <div class="matrix-cell header-cell corner"></div>
          <div 
            v-for="targetType in interfaceTypes" 
            :key="targetType.id"
            class="matrix-cell header-cell"
            :style="{ borderLeftColor: targetType.color }"
          >
            <div class="type-label">{{ targetType.name }}</div>
            <div class="type-id">{{ targetType.id }}</div>
          </div>
        </div>

        <!-- Data rows -->
        <div 
          v-for="sourceType in interfaceTypes" 
          :key="sourceType.id"
          class="matrix-row"
        >
          <!-- Source type label -->
          <div 
            class="matrix-cell header-cell source-label"
            :style="{ borderTopColor: sourceType.color }"
          >
            <div class="type-label">{{ sourceType.name }}</div>
            <div class="type-id">{{ sourceType.id }}</div>
          </div>

          <!-- Rule cells -->
          <div
            v-for="targetType in interfaceTypes"
            :key="`${sourceType.id}-${targetType.id}`"
            class="matrix-cell rule-cell"
            :class="getCellClass(sourceType.id, targetType.id)"
            :title="getCellTitle(sourceType.id, targetType.id)"
            @click="handleCellClick(sourceType.id, targetType.id)"
          >
            <span class="cell-emoji">{{ getCellEmoji(sourceType.id, targetType.id) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rules-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
}

.rules-header {
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.rules-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.clear-all-button {
  align-self: flex-start;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;
}

.clear-all-button:hover {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}

.matrix-container {
  flex: 1;
  overflow: auto;
  padding: 16px;
  display: flex;
  justify-content: center;
}

.matrix-table {
  display: inline-block;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
  background: white;
}

.matrix-row {
  display: flex;
}

.matrix-cell {
  min-width: 80px;
  min-height: 60px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.matrix-cell:last-child {
  border-right: none;
}

.matrix-row:last-child .matrix-cell {
  border-bottom: none;
}

.header-cell {
  background: #f5f5f5;
  font-weight: 600;
  font-size: 11px;
  text-align: center;
  border-width: 2px;
  flex-direction: column;
  gap: 4px;
}

.header-cell.corner {
  background: #e0e0e0;
  min-width: 120px;
}

.header-cell.source-label {
  min-width: 120px;
  border-right-width: 2px;
}

.type-label {
  font-size: 12px;
  color: #333;
  font-weight: 600;
}

.type-id {
  font-size: 9px;
  color: #999;
  text-transform: uppercase;
}

.rule-cell {
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  position: relative;
}

.rule-cell:hover {
  transform: scale(1.1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.cell-default {
  background: #f0f0f0;
  color: #999;
}

.cell-default-allow {
  background: #e8f5e9;
  color: #2e7d32;
}

.cell-default-deny {
  background: #ffebee;
  color: #c62828;
}

.cell-allow {
  background: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
  border-width: 2px;
}

.cell-deny {
  background: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
  border-width: 2px;
}

.cell-emoji {
  font-size: 20px;
  line-height: 1;
}
</style>
