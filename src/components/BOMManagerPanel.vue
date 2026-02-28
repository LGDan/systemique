<script setup>
import { computed, ref } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useBomManagerStore } from '../stores/bomManagerStore.js'
import { useToastStore } from '../stores/toastStore.js'

const systemStore = useSystemStore()
const bomStore = useBomManagerStore()
const toastStore = useToastStore()
const importFileInputRef = ref(null)
const expandedTypes = ref(new Set())

/** BOM grouped by type only; each group has type, quantity, and instances (name, description). */
const typeGroups = computed(() => {
  const system = systemStore.currentSystem
  if (!system?.components?.length) return []
  const byType = new Map()
  system.components.forEach(comp => {
    const type = comp.type ?? 'generic'
    if (!byType.has(type)) {
      byType.set(type, { type, quantity: 0, instances: [] })
    }
    const group = byType.get(type)
    group.quantity += 1
    group.instances.push({
      name: comp.name ?? '',
      description: comp.description ?? ''
    })
  })
  return Array.from(byType.values())
})

const rows = computed(() => typeGroups.value)

const stats = computed(() => {
  const components = rows.value
  if (!components.length) {
    return {
      totalParts: 0,
      totalCost: 0,
      totalImplementationCost: 0,
      maxShippingLeadTime: 0,
      maxImplementationLeadTime: 0,
      sumImplementationLeadTime: 0,
      timelineBestCaseDays: 0,
      timelineWorstCaseDays: 0
    }
  }
  let totalCost = 0
  let totalImplementationCost = 0
  let maxShipping = 0
  let maxImplementation = 0
  let sumImplementation = 0
  components.forEach(row => {
    const data = bomStore.getDataForType(row.type)
    totalCost += (row.quantity ?? 0) * (Number(data.pricePerUnit) || 0)
    totalImplementationCost += (row.quantity ?? 0) * (Number(data.implementationCost) || 0)
    const ship = Number(data.shippingLeadTime) || 0
    const impl = Number(data.implementationLeadTime) || 0
    if (ship > maxShipping) maxShipping = ship
    if (impl > maxImplementation) maxImplementation = impl
    sumImplementation += (row.quantity ?? 0) * impl
  })
  const totalParts = components.reduce((sum, c) => sum + (c.quantity ?? 0), 0)
  const timelineBestCaseDays = maxShipping + maxImplementation
  const timelineWorstCaseDays = maxShipping + sumImplementation
  return {
    totalParts,
    totalCost,
    totalImplementationCost,
    maxShippingLeadTime: maxShipping,
    maxImplementationLeadTime: maxImplementation,
    sumImplementationLeadTime: sumImplementation,
    timelineBestCaseDays,
    timelineWorstCaseDays
  }
})

function getTypeData(type) {
  return bomStore.getDataForType(type)
}

function updateTypeField(type, field, value) {
  const isNumeric = field === 'pricePerUnit' || field === 'implementationCost' || field === 'shippingLeadTime' || field === 'implementationLeadTime'
  let num
  if (isNumeric) {
    num = value === '' ? 0 : Number(value)
  } else {
    num = value
  }
  if (isNumeric && Number.isNaN(num)) return
  bomStore.setDataForType(type, { [field]: num })
}

function exportBomData() {
  const payload = bomStore.exportTypeData()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bom-type-data-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toastStore.show('BOM type data exported.', 'success')
}

function triggerImport() {
  importFileInputRef.value?.click()
}

async function handleImportFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  try {
    const text = await file.text()
    const payload = JSON.parse(text)
    const result = bomStore.importTypeData(payload)
    if (result.success) {
      toastStore.show('BOM type data imported.', 'success')
    } else {
      toastStore.show(result.message || 'Import failed.', 'error')
    }
  } catch (err) {
    console.error('BOM import failed:', err)
    toastStore.show('Failed to import BOM data: ' + (err.message || String(err)), 'error')
  }
}

function formatCurrency(value) {
  const s = bomStore.currency.symbol
  return `${s}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function toggleExpanded(type) {
  const next = new Set(expandedTypes.value)
  if (next.has(type)) next.delete(type)
  else next.add(type)
  expandedTypes.value = next
}

function isExpanded(type) {
  return expandedTypes.value.has(type)
}
</script>

<template>
  <div class="bom-manager-panel">
    <div class="bom-header">
      <div class="bom-header-text">
        <h2>BOM Manager</h2>
        <p class="bom-description">
          Itemised list of parts and quantities from the diagram. Set price and lead time per component type below.
        </p>
      </div>
      <div class="bom-header-controls">
        <label for="bom-currency-select" class="currency-label">Currency</label>
        <select
          id="bom-currency-select"
          :value="bomStore.currency.code"
          @change="bomStore.setCurrency(($event.target).value)"
          class="currency-select"
        >
          <option v-for="c in bomStore.CURRENCIES" :key="c.code" :value="c.code">
            {{ c.code }} ({{ c.symbol }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="rows.length > 0" class="audit-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total parts</div>
          <div class="stat-value">{{ stats.totalParts }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total cost</div>
          <div class="stat-value">{{ formatCurrency(stats.totalCost) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total implementation cost</div>
          <div class="stat-value">{{ formatCurrency(stats.totalImplementationCost) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Max shipping lead (days)</div>
          <div class="stat-value">{{ stats.maxShippingLeadTime }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Max implementation lead (days)</div>
          <div class="stat-value">{{ stats.maxImplementationLeadTime }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Sum implementation lead (days)</div>
          <div class="stat-value">{{ stats.sumImplementationLeadTime }}</div>
        </div>
        <div class="stat-card stat-card-best">
          <div class="stat-label">Timeline best case (days)</div>
          <div class="stat-value">{{ stats.timelineBestCaseDays }}</div>
        </div>
        <div class="stat-card stat-card-worst">
          <div class="stat-label">Timeline worst case (days)</div>
          <div class="stat-value">{{ stats.timelineWorstCaseDays }}</div>
        </div>
      </div>
      <p class="stats-summary">
        Cost: total and implementation cost above. Implementation lead: max = parallel, sum = series. Best case = max shipping + max implementation; worst case = max shipping + sum implementation.
      </p>
    </div>

    <div class="import-export-section">
      <button type="button" class="export-button" @click="exportBomData">
        Export BOM data
      </button>
      <button type="button" class="export-button" @click="triggerImport">
        Import BOM data
      </button>
      <input
        ref="importFileInputRef"
        type="file"
        accept=".json"
        style="display: none"
        @change="handleImportFile"
      />
    </div>

    <div v-if="rows.length > 0" class="audit-table-section">
      <div class="table-header">
        <h3>Bill of materials</h3>
      </div>
      <div class="table-container">
        <table class="audit-table">
          <thead>
            <tr>
              <th class="col-expand"></th>
              <th>Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Price per unit</th>
              <th>Implementation cost</th>
              <th>Shipping lead (days)</th>
              <th>Implementation lead (days)</th>
              <th>Line total</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(row, index) in rows" :key="row.type">
              <!-- Type summary row -->
              <tr class="bom-type-row">
                <td class="cell-expand">
                  <button
                    type="button"
                    class="bom-expand-btn"
                    :class="{ expanded: isExpanded(row.type) }"
                    :aria-label="isExpanded(row.type) ? 'Collapse' : 'Expand'"
                    @click="toggleExpanded(row.type)"
                  >
                    <span class="bom-expand-icon" aria-hidden="true">▶</span>
                  </button>
                </td>
                <td class="cell-name">{{ row.type }}</td>
                <td class="cell-type">{{ row.type }}</td>
                <td class="cell-quantity">{{ row.quantity }}</td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).pricePerUnit"
                    @input="updateTypeField(row.type, 'pricePerUnit', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).implementationCost"
                    @input="updateTypeField(row.type, 'implementationCost', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="getTypeData(row.type).shippingLeadTime"
                    @input="updateTypeField(row.type, 'shippingLeadTime', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="getTypeData(row.type).implementationLeadTime"
                    @input="updateTypeField(row.type, 'implementationLeadTime', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-total">{{ formatCurrency((row.quantity || 0) * (getTypeData(row.type).pricePerUnit || 0)) }}</td>
                <td class="cell-desc"></td>
              </tr>
              <!-- Instance rows when expanded -->
              <tr
                v-for="(inst, i) in (isExpanded(row.type) ? row.instances : [])"
                :key="`${row.type}-${i}`"
                class="bom-instance-row"
              >
                <td class="cell-expand"></td>
                <td class="cell-name cell-instance-name">{{ inst.name }}</td>
                <td class="cell-type"></td>
                <td class="cell-quantity">1</td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-total"></td>
                <td class="cell-desc cell-instance-desc">{{ inst.description }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="bom-empty">
      <p>No components in the current system. Add components on the Design tab to see the BOM here.</p>
    </div>
  </div>
</template>

<style scoped>
.bom-manager-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow: auto;
}

.bom-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.bom-header-text h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.bom-description {
  margin: 0;
  font-size: 13px;
  color: #666;
  max-width: 560px;
}

.bom-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.currency-label {
  font-size: 12px;
  font-weight: 600;
  color: #555;
}

.currency-select {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  min-width: 100px;
}

.audit-stats {
  margin-top: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stats-summary {
  margin: 12px 0 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.stat-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-card-best .stat-value {
  color: #1F6B66;
}

.stat-card-worst .stat-value {
  color: #c53030;
}

.import-export-section {
  display: flex;
  gap: 12px;
}

.export-button {
  padding: 6px 12px;
  border: 1px solid #2A8A84;
  border-radius: 4px;
  background: white;
  color: #1F6B66;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover {
  background: #1F6B66;
  color: white;
}

.audit-table-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.audit-table thead {
  background: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 10;
}

.audit-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.col-expand {
  width: 36px;
  padding: 8px;
  vertical-align: middle;
}

.cell-expand {
  width: 36px;
  padding: 6px 8px;
  vertical-align: middle;
}

.bom-expand-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.2s;
}

.bom-expand-btn:hover {
  background: #eee;
  color: #333;
}

.bom-expand-icon {
  display: inline-block;
  font-size: 10px;
  transition: transform 0.2s;
}

.bom-expand-btn.expanded .bom-expand-icon {
  transform: rotate(90deg);
}

.bom-type-row {
  background: #fff;
}

.bom-instance-row {
  background: #fafafa;
}

.bom-instance-row .cell-instance-name {
  padding-left: 28px;
  font-weight: 400;
  color: #555;
}

.cell-desc {
  max-width: 240px;
  font-size: 11px;
  color: #666;
  line-height: 1.35;
}

.cell-instance-desc {
  color: #666;
  white-space: pre-wrap;
  word-break: break-word;
}

.audit-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  color: #666;
}

.audit-table tbody tr:hover {
  background: #f9f9f9;
}

.cell-name,
.cell-type {
  font-weight: 500;
  color: #333;
}

.cell-quantity,
.cell-total {
  text-align: right;
}

.cell-editable {
  padding: 4px 8px;
}

.bom-input {
  width: 100%;
  min-width: 70px;
  max-width: 120px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
}

.bom-input:focus {
  outline: none;
  border-color: #1F6B66;
  box-shadow: 0 0 0 2px rgba(31, 107, 102, 0.2);
}

.bom-empty {
  padding: 32px;
  text-align: center;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.bom-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
