<script setup>
import { ref, computed, watch } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useInterfaceRulesStore } from '../stores/interfaceRulesStore.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { areTypesCompatible } from '../utils/interfaceCompatibility.js'
import { validateConnection } from '../utils/connectionValidator.js'
import { InterfaceType } from '../models/InterfaceType.js'

const systemStore = useSystemStore()
const rulesStore = useInterfaceRulesStore()
const typesStore = useInterfaceTypesStore()

const interfaceTypes = computed(() => typesStore.getAllTypes())

// Local state for editing interface types
const editingTypes = ref(new Map())

// Initialize editing state
function initializeEditingState() {
  editingTypes.value.clear()
  interfaceTypes.value.forEach(type => {
    editingTypes.value.set(type.id, {
      name: type.name,
      description: type.description || '',
      color: type.color
    })
  })
}

// Watch for type changes and update editing state
watch(interfaceTypes, () => {
  initializeEditingState()
}, { deep: true })

// Initialize on mount
initializeEditingState()

// Check if a type is in use
function isTypeInUse(typeId) {
  const system = systemStore.currentSystem
  if (!system) return false
  
  return system.components.some(component => 
    component.interfaces.some(iface => iface.type === typeId)
  )
}

function updateTypeName(typeId, name) {
  const editState = editingTypes.value.get(typeId)
  if (editState) {
    editState.name = name
    typesStore.updateType(typeId, { name })
  }
}

function updateTypeDescription(typeId, description) {
  const editState = editingTypes.value.get(typeId)
  if (editState) {
    editState.description = description
    typesStore.updateType(typeId, { description })
  }
}

function updateTypeColor(typeId, color) {
  const editState = editingTypes.value.get(typeId)
  if (editState) {
    editState.color = color
    typesStore.updateTypeColor(typeId, color)
  }
}

// Add new type
const showAddTypeForm = ref(false)
const newTypeForm = ref({
  name: '',
  description: '',
  color: '#999999'
})

function handleAddType() {
  if (!newTypeForm.value.name.trim()) {
    alert('Please enter a type name')
    return
  }
  
  typesStore.addType(
    newTypeForm.value.name.trim(),
    newTypeForm.value.description.trim(),
    newTypeForm.value.color,
    '⚙️' // Default icon
  )
  
  // Reset form
  newTypeForm.value = {
    name: '',
    description: '',
    color: '#999999'
  }
  showAddTypeForm.value = false
}

function handleRemoveType(typeId) {
  if (isTypeInUse(typeId)) {
    if (!confirm(`This type is currently in use by interfaces in your design. Removing it may cause issues. Are you sure you want to remove it?`)) {
      return
    }
  } else {
    if (!confirm(`Are you sure you want to remove the "${typesStore.getType(typeId)?.name}" type?`)) {
      return
    }
  }
  
  typesStore.removeType(typeId)
}

// Rule Review
const reviewResults = ref(null)
const isReviewing = ref(false)

function runRuleReview() {
  isReviewing.value = true
  const system = systemStore.currentSystem
  if (!system) {
    reviewResults.value = { error: 'No system loaded' }
    isReviewing.value = false
    return
  }

  const results = {
    totalConnections: 0,
    validConnections: 0,
    invalidConnections: 0,
    issues: []
  }

  system.connections.forEach(connection => {
    results.totalConnections++
    
    const sourceComponent = system.getComponent(connection.sourceComponentId)
    const targetComponent = system.getComponent(connection.targetComponentId)
    
    if (!sourceComponent || !targetComponent) {
      results.invalidConnections++
      results.issues.push({
        connectionId: connection.id,
        type: 'missing_component',
        message: `Connection ${connection.id} references missing component`,
        severity: 'error'
      })
      return
    }

    const sourceInterface = sourceComponent.getInterface(connection.sourceInterfaceId)
    const targetInterface = targetComponent.getInterface(connection.targetInterfaceId)
    
    if (!sourceInterface || !targetInterface) {
      results.invalidConnections++
      results.issues.push({
        connectionId: connection.id,
        type: 'missing_interface',
        message: `Connection ${connection.id} references missing interface`,
        severity: 'error'
      })
      return
    }

    const validation = validateConnection(sourceInterface, targetInterface)
    
    if (validation.valid) {
      results.validConnections++
    } else {
      results.invalidConnections++
      results.issues.push({
        connectionId: connection.id,
        type: 'rule_violation',
        message: `Connection from ${sourceComponent.name}.${sourceInterface.name} (${sourceInterface.type}) to ${targetComponent.name}.${targetInterface.name} (${targetInterface.type}): ${validation.reason}`,
        severity: 'error',
        sourceComponent: sourceComponent.name,
        sourceInterface: sourceInterface.name,
        targetComponent: targetComponent.name,
        targetInterface: targetInterface.name
      })
    }
  })

  reviewResults.value = results
  isReviewing.value = false
}

/**
 * Get the state for a cell (source type -> target type)
 */
function getCellState(sourceType, targetType) {
  const rule = rulesStore.getRule(sourceType, targetType)
  if (rule === true) return 'allow'
  if (rule === false) return 'deny'
  return 'default'
}

function getEffectiveState(sourceType, targetType) {
  const rule = rulesStore.getRule(sourceType, targetType)
  if (rule === true) return 'allow'
  if (rule === false) return 'deny'
  if (sourceType === targetType) return 'allow'
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
  const sourceName = interfaceTypes.value.find(t => t.id === sourceType)?.name || sourceType
  const targetName = interfaceTypes.value.find(t => t.id === targetType)?.name || targetType
  
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
  <div class="interface-management">
    <div class="management-header">
      <h2>Interface Management</h2>
    </div>

    <div class="management-content">
      <!-- Left side: Rules Matrix -->
      <div class="left-panel">
        <div class="panel-section">
          <div class="section-header">
            <h3>Connection Rules Matrix</h3>
            <button @click="rulesStore.clearAllRules()" class="clear-all-button">
              Clear All Rules
            </button>
          </div>
          <p class="section-description">
            Click cells to toggle connection rules between interface types. 
            <strong>Default</strong> (○) uses compatibility matrix, <strong>Allow</strong> (✓) always allows, <strong>Deny</strong> (✗) always blocks.
          </p>

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
      </div>

      <!-- Right side: Interface Types & Rule Review -->
      <div class="right-panel">
        <!-- Interface Types Editor -->
        <div class="panel-section">
          <div class="section-header">
            <h3>Interface Types</h3>
            <button 
              @click="showAddTypeForm = !showAddTypeForm" 
              class="add-type-button"
              :class="{ active: showAddTypeForm }"
            >
              {{ showAddTypeForm ? 'Cancel' : '+ Add Type' }}
            </button>
          </div>
          <p class="section-description">
            Edit interface type names, descriptions, and colors. Add or remove types.
          </p>

          <!-- Add Type Form -->
          <div v-if="showAddTypeForm" class="add-type-form">
            <div class="field">
              <label>Name *</label>
              <input
                v-model="newTypeForm.name"
                type="text"
                placeholder="Type name"
                class="field-input"
              />
            </div>
            <div class="field">
              <label>Description</label>
              <textarea
                v-model="newTypeForm.description"
                class="field-input field-textarea"
                rows="2"
                placeholder="Enter description..."
              ></textarea>
            </div>
            <div class="field">
              <label>Color</label>
              <div class="color-picker-wrapper">
                <input
                  v-model="newTypeForm.color"
                  type="color"
                  class="color-picker"
                />
                <input
                  v-model="newTypeForm.color"
                  type="text"
                  class="color-input"
                  placeholder="#999999"
                />
              </div>
            </div>
            <button @click="handleAddType" class="submit-add-button">
              Add Type
            </button>
          </div>

          <div class="types-list">
            <div 
              v-for="type in interfaceTypes" 
              :key="type.id"
              class="type-editor"
            >
              <div class="type-editor-header">
                <div class="type-header-left">
                  <div class="type-color-indicator" :style="{ backgroundColor: type.color }"></div>
                  <span class="type-id-label">{{ type.id }}</span>
                  <span v-if="isTypeInUse(type.id)" class="in-use-badge" title="This type is in use">In Use</span>
                </div>
                <button 
                  @click="handleRemoveType(type.id)"
                  class="remove-type-button"
                  title="Remove type"
                >
                  ×
                </button>
              </div>
              <div class="type-editor-fields">
                <div class="field">
                  <label>Name</label>
                  <input
                    type="text"
                    :value="editingTypes.get(type.id)?.name || type.name"
                    @input="updateTypeName(type.id, $event.target.value)"
                    class="field-input"
                  />
                </div>
                <div class="field">
                  <label>Description</label>
                  <textarea
                    :value="editingTypes.get(type.id)?.description || type.description || ''"
                    @input="updateTypeDescription(type.id, $event.target.value)"
                    class="field-input field-textarea"
                    rows="2"
                    placeholder="Enter description..."
                  ></textarea>
                </div>
                <div class="field">
                  <label>Color</label>
                  <div class="color-picker-wrapper">
                    <input
                      type="color"
                      :value="editingTypes.get(type.id)?.color || type.color"
                      @input="updateTypeColor(type.id, $event.target.value)"
                      class="color-picker"
                    />
                    <input
                      type="text"
                      :value="editingTypes.get(type.id)?.color || type.color"
                      @input="updateTypeColor(type.id, $event.target.value)"
                      class="color-input"
                      placeholder="#999999"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rule Review -->
        <div class="panel-section">
          <div class="section-header">
            <h3>Rule Review</h3>
            <button @click="runRuleReview()" :disabled="isReviewing" class="review-button">
              {{ isReviewing ? 'Reviewing...' : 'Run Review' }}
            </button>
          </div>
          <p class="section-description">
            Validate all connections in the current design against the active ruleset.
          </p>

          <div v-if="reviewResults" class="review-results">
            <div class="review-summary">
              <div class="summary-item">
                <span class="summary-label">Total Connections:</span>
                <span class="summary-value">{{ reviewResults.totalConnections }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Valid:</span>
                <span class="summary-value valid">{{ reviewResults.validConnections }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Invalid:</span>
                <span class="summary-value invalid">{{ reviewResults.invalidConnections }}</span>
              </div>
            </div>

            <div v-if="reviewResults.issues.length > 0" class="review-issues">
              <h4>Issues Found:</h4>
              <div 
                v-for="(issue, index) in reviewResults.issues" 
                :key="index"
                class="issue-item"
                :class="issue.severity"
              >
                <div class="issue-message">{{ issue.message }}</div>
              </div>
            </div>

            <div v-else-if="reviewResults.totalConnections > 0" class="review-success">
              ✓ All connections are valid!
            </div>
          </div>

          <div v-else class="review-placeholder">
            Click "Run Review" to validate all connections in the current design.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.interface-management {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: white;
}

.management-header {
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: #f9f9f9;
}

.management-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.management-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  gap: 16px;
  padding: 16px;
}

.left-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.right-panel {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.panel-section {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.section-description {
  margin: 0;
  font-size: 11px;
  color: #666;
  line-height: 1.4;
}

.clear-all-button,
.review-button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-all-button:hover {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}

.review-button {
  background: #4ECDC4;
  color: white;
  border-color: #4ECDC4;
}

.review-button:hover:not(:disabled) {
  background: #3AB8B0;
  border-color: #3AB8B0;
}

.review-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Rules Matrix Styles */
.matrix-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  padding: 8px;
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
  min-width: 70px;
  min-height: 50px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
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
  font-size: 10px;
  text-align: center;
  border-width: 2px;
  flex-direction: column;
  gap: 2px;
}

.header-cell.corner {
  background: #e0e0e0;
  min-width: 100px;
}

.header-cell.source-label {
  min-width: 100px;
  border-right-width: 2px;
}

.type-label {
  font-size: 11px;
  color: #333;
  font-weight: 600;
}

.type-id {
  font-size: 8px;
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
  font-size: 18px;
  line-height: 1;
}

/* Interface Types Editor Styles */
.types-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-editor {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
}

.type-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.type-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.type-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.type-id-label {
  font-size: 10px;
  color: #999;
  text-transform: uppercase;
  font-weight: 600;
}

.in-use-badge {
  padding: 2px 6px;
  background: #fff3cd;
  color: #856404;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
}

.remove-type-button {
  width: 24px;
  height: 24px;
  border: none;
  background: #ff6b6b;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.remove-type-button:hover {
  background: #ff5252;
}

.add-type-button {
  padding: 4px 12px;
  border: 1px solid #4ECDC4;
  border-radius: 4px;
  background: white;
  color: #4ECDC4;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-type-button:hover {
  background: #4ECDC4;
  color: white;
}

.add-type-button.active {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
}

.add-type-form {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.submit-add-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #4ECDC4;
  color: white;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-add-button:hover {
  background: #3AB8B0;
}

.color-picker-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-picker {
  width: 40px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.color-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

.type-editor-fields {
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
  font-size: 10px;
  color: #666;
  font-weight: 600;
}

.field-input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
}

.field-textarea {
  resize: vertical;
  min-height: 40px;
}

/* Rule Review Styles */
.review-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.review-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.summary-label {
  color: #666;
}

.summary-value {
  font-weight: 600;
  color: #333;
}

.summary-value.valid {
  color: #2e7d32;
}

.summary-value.invalid {
  color: #c62828;
}

.review-issues {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-issues h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.issue-item {
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  line-height: 1.4;
}

.issue-item.error {
  background: #ffebee;
  color: #c62828;
  border-left: 3px solid #c62828;
}

.issue-message {
  color: inherit;
}

.review-success {
  padding: 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
}

.review-placeholder {
  padding: 24px;
  text-align: center;
  color: #999;
  font-size: 11px;
}
</style>
