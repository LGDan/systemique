<script setup>
import { computed, ref } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useConopsManagerStore } from '../stores/conopsManagerStore.js'
import { useBomManagerStore } from '../stores/bomManagerStore.js'
import { useToastStore } from '../stores/toastStore.js'

const systemStore = useSystemStore()
const conopsStore = useConopsManagerStore()
const bomStore = useBomManagerStore()
const toastStore = useToastStore()
const importFileInputRef = ref(null)
const expandedTypes = ref(new Set())

const HORIZONS = [
  { id: '1m', label: '1 month', months: 1 },
  { id: '1y', label: '1 year', months: 12 },
  { id: '3y', label: '3 years', months: 36 },
  { id: '5y', label: '5 years', months: 60 },
  { id: '10y', label: '10 years', months: 120 }
]

const statsHorizon = ref('1y')

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

/** Compute CONOPS stats for a given horizon in months. */
function computeHorizonStats(months) {
  const components = rows.value
  if (!components.length) {
    return { humanOpsCost: 0, humanOpsHours: 0, maintenanceCost: 0 }
  }
  let humanOpsCost = 0
  let humanOpsHours = 0
  let recurringMaintenance = 0
  let replacementCost = 0

  components.forEach(row => {
    const conops = conopsStore.getDataForType(row.type)
    const bom = bomStore.getDataForType(row.type)
    const qty = row.quantity ?? 0
    const costHumanOps = Number(conops.costPerMonthHumanOps) || 0
    const hoursHumanOps = Number(conops.hoursPerMonthHumanOps) || 0
    const costMaint = Number(conops.costPerMonthMaintenance) || 0
    const yearlyPct = Number(conops.yearlyCostIncreasePercent) || 0
    const replaceAfter = Number(conops.replaceAfterMonths) || 0
    const factorPct = Number(conops.replacementCostFactorPercent) || 0
    const pricePerUnit = Number(bom.pricePerUnit) || 0

    humanOpsCost += qty * costHumanOps * months
    humanOpsHours += qty * hoursHumanOps * months

    for (let m = 1; m <= months; m++) {
      const yearIndex = Math.floor((m - 1) / 12)
      const multiplier = Math.pow(1 + yearlyPct / 100, yearIndex)
      recurringMaintenance += qty * costMaint * multiplier
    }

    if (replaceAfter > 0 && factorPct > 0 && pricePerUnit > 0) {
      let k = 1
      while (k * replaceAfter <= months) {
        replacementCost += qty * pricePerUnit * (factorPct / 100)
        k += 1
      }
    }
  })

  return {
    humanOpsCost,
    humanOpsHours,
    maintenanceCost: recurringMaintenance + replacementCost
  }
}

const horizonStats = computed(() => {
  const horizon = HORIZONS.find(h => h.id === statsHorizon.value) || HORIZONS[1]
  return computeHorizonStats(horizon.months)
})

function getTypeData(type) {
  return conopsStore.getDataForType(type)
}

const CONOPS_FIELDS = new Set([
  'hoursPerMonthHumanOps',
  'costPerMonthHumanOps',
  'hoursPerMonthMaintenance',
  'costPerMonthMaintenance',
  'yearlyCostIncreasePercent',
  'replaceAfterMonths',
  'replacementCostFactorPercent'
])

function updateTypeField(type, field, value) {
  const isNumeric = CONOPS_FIELDS.has(field)
  let num
  if (isNumeric) {
    num = value === '' ? 0 : Number(value)
  } else {
    num = value
  }
  if (isNumeric && Number.isNaN(num)) return
  conopsStore.setDataForType(type, { [field]: num })
}

function exportConopsData() {
  const payload = conopsStore.exportTypeData()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `conops-type-data-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
  toastStore.show('CONOPS type data exported.', 'success')
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
    const result = conopsStore.importTypeData(payload)
    if (result.success) {
      toastStore.show('CONOPS type data imported.', 'success')
    } else {
      toastStore.show(result.message || 'Import failed.', 'error')
    }
  } catch (err) {
    console.error('CONOPS import failed:', err)
    toastStore.show('Failed to import CONOPS data: ' + (err.message || String(err)), 'error')
  }
}

function formatCurrency(value) {
  const s = conopsStore.currency.symbol
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
  <div class="conops-manager-panel">
    <div class="conops-header">
      <div class="conops-header-text">
        <h2>CONOPS Manager</h2>
        <p class="conops-description">
          Running costs by component type: human operations (hours and cost) and maintenance (recurring and replacement). Select a time horizon to see projected totals.
        </p>
      </div>
      <div class="conops-header-controls">
        <label for="conops-currency-select" class="currency-label">Currency</label>
        <select
          id="conops-currency-select"
          :value="conopsStore.currency.code"
          @change="conopsStore.setCurrency(($event.target).value)"
          class="currency-select"
        >
          <option v-for="c in conopsStore.CURRENCIES" :key="c.code" :value="c.code">
            {{ c.code }} ({{ c.symbol }})
          </option>
        </select>
      </div>
    </div>

    <div v-if="rows.length > 0" class="horizon-tabs">
      <button
        v-for="h in HORIZONS"
        :key="h.id"
        type="button"
        class="horizon-tab"
        :class="{ active: statsHorizon === h.id }"
        @click="statsHorizon = h.id"
      >
        {{ h.label }}
      </button>
    </div>

    <div v-if="rows.length > 0" class="audit-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Human operations cost</div>
          <div class="stat-value">{{ formatCurrency(horizonStats.humanOpsCost) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Human operations (hours)</div>
          <div class="stat-value">{{ horizonStats.humanOpsHours.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Maintenance cost</div>
          <div class="stat-value">{{ formatCurrency(horizonStats.maintenanceCost) }}</div>
        </div>
      </div>
      <p class="stats-summary">
        Totals for the selected time horizon. Human ops: linear (quantity × cost/hours per month × months). Maintenance: recurring cost with yearly increase % plus replacement cost (BOM price × factor %) at each replace interval.
      </p>
    </div>

    <div class="import-export-section">
      <button type="button" class="export-button" @click="exportConopsData">
        Export CONOPS data
      </button>
      <button type="button" class="export-button" @click="triggerImport">
        Import CONOPS data
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
        <h3>Running costs by type</h3>
      </div>
      <div class="table-container">
        <table class="audit-table conops-table">
          <thead>
            <tr>
              <th class="col-expand"></th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Hrs/mo human ops</th>
              <th>Cost/mo human ops</th>
              <th>Hrs/mo maint</th>
              <th>Cost/mo maint</th>
              <th>Yearly cost inc %</th>
              <th>Replace after (mo)</th>
              <th>Repl. cost factor %</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="row in rows" :key="row.type">
              <tr class="conops-type-row">
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
                <td class="cell-quantity">{{ row.quantity }}</td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).hoursPerMonthHumanOps"
                    @input="updateTypeField(row.type, 'hoursPerMonthHumanOps', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).costPerMonthHumanOps"
                    @input="updateTypeField(row.type, 'costPerMonthHumanOps', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).hoursPerMonthMaintenance"
                    @input="updateTypeField(row.type, 'hoursPerMonthMaintenance', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).costPerMonthMaintenance"
                    @input="updateTypeField(row.type, 'costPerMonthMaintenance', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).yearlyCostIncreasePercent"
                    @input="updateTypeField(row.type, 'yearlyCostIncreasePercent', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    :value="getTypeData(row.type).replaceAfterMonths"
                    @input="updateTypeField(row.type, 'replaceAfterMonths', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-editable">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getTypeData(row.type).replacementCostFactorPercent"
                    @input="updateTypeField(row.type, 'replacementCostFactorPercent', ($event.target).value)"
                    class="bom-input"
                  />
                </td>
                <td class="cell-desc"></td>
              </tr>
              <tr
                v-for="(inst, i) in (isExpanded(row.type) ? row.instances : [])"
                :key="`${row.type}-${i}`"
                class="bom-instance-row"
              >
                <td class="cell-expand"></td>
                <td class="cell-name cell-instance-name">{{ inst.name }}</td>
                <td class="cell-quantity">1</td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-editable"></td>
                <td class="cell-desc cell-instance-desc">{{ inst.description }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="conops-empty">
      <p>No components in the current system. Add components on the Design tab to see CONOPS running costs here.</p>
    </div>
  </div>
</template>

<style scoped>
.conops-manager-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
  overflow: auto;
}

.conops-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.conops-header-text h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.conops-description {
  margin: 0;
  font-size: 13px;
  color: #666;
  max-width: 560px;
}

.conops-header-controls {
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

.horizon-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.horizon-tab {
  padding: 8px 14px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.horizon-tab:hover {
  background: #f0f0f0;
  color: #333;
}

.horizon-tab.active {
  background: #31817c;
  color: white;
  border-color: #31817c;
}

.audit-stats {
  margin-top: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
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
  padding: 10px 8px;
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

.conops-type-row {
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
  max-width: 200px;
  font-size: 11px;
  color: #666;
  line-height: 1.35;
}

.cell-instance-desc {
  white-space: pre-wrap;
  word-break: break-word;
}

.audit-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  color: #666;
}

.audit-table tbody tr:hover {
  background: #f9f9f9;
}

.cell-name {
  font-weight: 500;
  color: #333;
}

.cell-quantity {
  text-align: right;
}

.cell-editable {
  padding: 4px 6px;
}

.bom-input {
  width: 100%;
  min-width: 56px;
  max-width: 90px;
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

.conops-empty {
  padding: 32px;
  text-align: center;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.conops-empty p {
  margin: 0;
  font-size: 14px;
}
</style>
