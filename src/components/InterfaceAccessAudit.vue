<script setup>
import { ref, computed } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'

const systemStore = useSystemStore()
const typesStore = useInterfaceTypesStore()

// Stats
const stats = ref({
  total: 0,
  unset: 0,
  trusted: 0,
  untrusted: 0,
  ignored: 0,
  connected: 0,
  disconnected: 0
})

// Table data (all data)
const allTableData = ref([])

// Filter state
const filters = ref({
  access: 'all', // 'all', 'Unset', 'trusted', 'untrusted', 'ignored'
  connection: 'all', // 'all', 'connected', 'disconnected'
  direction: 'all', // 'all', 'input', 'output'
  interfaceType: 'all' // 'all' or specific type ID
})

// Computed filtered table data
const tableData = computed(() => {
  return allTableData.value.filter(item => {
    // Filter by access
    if (filters.value.access !== 'all') {
      const itemAccess = item.access || 'Unset'
      if (filters.value.access === 'Unset' && itemAccess !== 'Unset') return false
      if (filters.value.access !== 'Unset' && itemAccess !== filters.value.access) return false
    }
    
    // Filter by connection status
    if (filters.value.connection !== 'all') {
      if (filters.value.connection === 'connected' && !item.connected) return false
      if (filters.value.connection === 'disconnected' && item.connected) return false
    }
    
    // Filter by direction
    if (filters.value.direction !== 'all') {
      if (item.direction !== filters.value.direction) return false
    }
    
    // Filter by interface type
    if (filters.value.interfaceType !== 'all') {
      if (item.interfaceType !== filters.value.interfaceType) return false
    }
    
    return true
  })
})

// Get unique interface types from table data
const availableInterfaceTypes = computed(() => {
  const types = new Set()
  allTableData.value.forEach(item => {
    types.add(item.interfaceType)
  })
  return Array.from(types).sort()
})

// Get all interfaces from the current system
function getAllInterfaces() {
  const system = systemStore.currentSystem
  if (!system) return []
  
  const interfaces = []
  system.components.forEach(component => {
    component.interfaces.forEach(iface => {
      interfaces.push({
        componentId: component.id,
        componentName: component.name,
        interfaceName: iface.name,
        interfaceType: iface.type,
        direction: iface.direction,
        access: iface.access || 'Unset',
        interfaceId: iface.id
      })
    })
  })
  
  return interfaces
}

// Check if an interface is connected
function isInterfaceConnected(componentId, interfaceId) {
  const system = systemStore.currentSystem
  if (!system) return false
  
  return system.connections.some(conn => 
    (conn.sourceComponentId === componentId && conn.sourceInterfaceId === interfaceId) ||
    (conn.targetComponentId === componentId && conn.targetInterfaceId === interfaceId)
  )
}

function runAudit() {
  const interfaces = getAllInterfaces()
  
  // Reset stats
  stats.value = {
    total: interfaces.length,
    unset: 0,
    trusted: 0,
    untrusted: 0,
    ignored: 0,
    connected: 0,
    disconnected: 0
  }
  
  // Build table data and count stats
  allTableData.value = interfaces.map(item => {
    // Count access types
    if (item.access === 'Unset' || item.access === null) {
      stats.value.unset++
    } else if (item.access === 'trusted') {
      stats.value.trusted++
    } else if (item.access === 'untrusted') {
      stats.value.untrusted++
    } else if (item.access === 'ignored') {
      stats.value.ignored++
    }
    
    // Check connection status
    const connected = isInterfaceConnected(item.componentId, item.interfaceId)
    if (connected) {
      stats.value.connected++
    } else {
      stats.value.disconnected++
    }
    
    return {
      ...item,
      connected
    }
  })
}

function exportToCSV() {
  const dataToExport = tableData.value
  if (dataToExport.length === 0) {
    alert('No data to export. Please run the audit first.')
    return
  }
  
  const headers = ['Component ID', 'Component Name', 'Interface Name', 'Type', 'Direction', 'Access', 'Connected']
  
  const rows = dataToExport.map(item => {
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return ''
      }
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }
    
    return [
      escapeCSV(item.componentId),
      escapeCSV(item.componentName),
      escapeCSV(item.interfaceName),
      escapeCSV(item.interfaceType),
      escapeCSV(item.direction),
      escapeCSV(item.access),
      escapeCSV(item.connected ? 'Yes' : 'No')
    ].join(',')
  })
  
  const csvContent = [headers.join(','), ...rows].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `interface-access-audit-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Get interface type name
function getTypeName(typeId) {
  const type = typesStore.getType(typeId)
  return type ? type.name : typeId
}

// Quick filter functions (for stat card clicks)
function filterByAccess(access) {
  if (filters.value.access === access) {
    filters.value.access = 'all' // Toggle off if already selected
  } else {
    filters.value.access = access
  }
}

function filterByConnection(connection) {
  if (filters.value.connection === connection) {
    filters.value.connection = 'all' // Toggle off if already selected
  } else {
    filters.value.connection = connection
  }
}

function clearAllFilters() {
  filters.value = {
    access: 'all',
    connection: 'all',
    direction: 'all',
    interfaceType: 'all'
  }
}
</script>

<template>
  <div class="interface-access-audit">
    <div class="audit-header">
      <h2>Interface Access Audit</h2>
      <p class="audit-description">
        Analyze interface access levels across all components in the current system.
      </p>
      <button @click="runAudit()" class="run-audit-button">
        Run Audit
      </button>
    </div>

    <div v-if="stats.total > 0" class="audit-stats">
      <div class="stats-grid">
        <div class="stat-card" @click="clearAllFilters()" :class="{ 'filter-active': filters.access === 'all' && filters.connection === 'all' && filters.direction === 'all' && filters.interfaceType === 'all' }">
          <div class="stat-label">Total Interfaces</div>
          <div class="stat-value">{{ stats.total }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByAccess('Unset')" :class="{ 'filter-active': filters.access === 'Unset' }">
          <div class="stat-label">Unset</div>
          <div class="stat-value">{{ stats.unset }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByAccess('trusted')" :class="{ 'filter-active': filters.access === 'trusted' }">
          <div class="stat-label">Trusted</div>
          <div class="stat-value trusted">{{ stats.trusted }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByAccess('untrusted')" :class="{ 'filter-active': filters.access === 'untrusted' }">
          <div class="stat-label">Untrusted</div>
          <div class="stat-value untrusted">{{ stats.untrusted }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByAccess('ignored')" :class="{ 'filter-active': filters.access === 'ignored' }">
          <div class="stat-label">Ignored</div>
          <div class="stat-value ignored">{{ stats.ignored }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByConnection('connected')" :class="{ 'filter-active': filters.connection === 'connected' }">
          <div class="stat-label">Connected</div>
          <div class="stat-value connected">{{ stats.connected }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByConnection('disconnected')" :class="{ 'filter-active': filters.connection === 'disconnected' }">
          <div class="stat-label">Disconnected</div>
          <div class="stat-value disconnected">{{ stats.disconnected }}</div>
        </div>
      </div>
    </div>

    <div v-if="stats.total > 0 && allTableData.length > 0" class="filters-section">
      <div class="filters-header">
        <h4>Filters</h4>
        <button @click="clearAllFilters()" class="clear-filters-button" v-if="filters.access !== 'all' || filters.connection !== 'all' || filters.direction !== 'all' || filters.interfaceType !== 'all'">
          Clear All
        </button>
      </div>
      <div class="filters-grid">
        <div class="filter-group">
          <label>Access</label>
          <select v-model="filters.access" class="filter-select">
            <option value="all">All</option>
            <option value="Unset">Unset</option>
            <option value="trusted">Trusted</option>
            <option value="untrusted">Untrusted</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Connection</label>
          <select v-model="filters.connection" class="filter-select">
            <option value="all">All</option>
            <option value="connected">Connected</option>
            <option value="disconnected">Disconnected</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Direction</label>
          <select v-model="filters.direction" class="filter-select">
            <option value="all">All</option>
            <option value="input">Input</option>
            <option value="output">Output</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Interface Type</label>
          <select v-model="filters.interfaceType" class="filter-select">
            <option value="all">All</option>
            <option v-for="typeId in availableInterfaceTypes" :key="typeId" :value="typeId">
              {{ getTypeName(typeId) }}
            </option>
          </select>
        </div>
      </div>
      <div class="filter-results-info">
        Showing {{ tableData.length }} of {{ allTableData.length }} interfaces
      </div>
    </div>

    <div v-if="tableData.length > 0" class="audit-table-section">
      <div class="table-header">
        <h3>Interface Access Report</h3>
        <button @click="exportToCSV()" class="export-button">
          Export CSV
        </button>
      </div>
      
      <div class="table-container">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Component ID</th>
              <th>Component Name</th>
              <th>Interface Name</th>
              <th>Type</th>
              <th>Direction</th>
              <th>Access</th>
              <th>Connected</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in tableData" :key="index">
              <td class="cell-id">{{ item.componentId }}</td>
              <td class="cell-name">{{ item.componentName }}</td>
              <td class="cell-name">{{ item.interfaceName }}</td>
              <td class="cell-type">{{ getTypeName(item.interfaceType) }}</td>
              <td class="cell-direction">
                <span class="direction-badge" :class="item.direction">
                  {{ item.direction === 'input' ? 'Input' : 'Output' }}
                </span>
              </td>
              <td class="cell-access">
                <span class="access-badge" :class="item.access?.toLowerCase() || 'unset'">
                  {{ item.access }}
                </span>
              </td>
              <td class="cell-connected">
                <span :class="item.connected ? 'connected-yes' : 'connected-no'">
                  {{ item.connected ? 'Yes' : 'No' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="allTableData.length === 0" class="audit-placeholder">
      <p>Click "Run Audit" to analyze interface access levels in the current system.</p>
    </div>
    
    <div v-else class="audit-placeholder">
      <p>No interfaces match the current filters. Try adjusting your filter criteria.</p>
    </div>
  </div>
</template>

<style scoped>
.interface-access-audit {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.audit-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.audit-description {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.run-audit-button {
  align-self: flex-start;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  background: #4ECDC4;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.run-audit-button:hover {
  background: #3AB8B0;
}

.audit-stats {
  margin-top: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.stat-card {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  background: #f0f0f0;
  border-color: #4ECDC4;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.filter-active {
  background: #E8F5E9;
  border-color: #4ECDC4;
  border-width: 2px;
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

.stat-value.trusted {
  color: #2e7d32;
}

.stat-value.untrusted {
  color: #c62828;
}

.stat-value.ignored {
  color: #f57c00;
}

.stat-value.connected {
  color: #1976d2;
}

.stat-value.disconnected {
  color: #666;
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

.export-button {
  padding: 6px 12px;
  border: 1px solid #4ECDC4;
  border-radius: 4px;
  background: white;
  color: #4ECDC4;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover {
  background: #4ECDC4;
  color: white;
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

.audit-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  color: #666;
}

.audit-table tbody tr:hover {
  background: #f9f9f9;
}

.audit-table tbody tr:last-child td {
  border-bottom: none;
}

.cell-id {
  font-family: monospace;
  font-size: 11px;
  color: #999;
}

.cell-name {
  font-weight: 500;
  color: #333;
}

.cell-type {
  text-transform: capitalize;
}

.direction-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
}

.direction-badge.input {
  background: #E3F2FD;
  color: #1976D2;
}

.direction-badge.output {
  background: #F3E5F5;
  color: #7B1FA2;
}

.access-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}

.access-badge.unset {
  background: #f0f0f0;
  color: #999;
}

.access-badge.trusted {
  background: #e8f5e9;
  color: #2e7d32;
}

.access-badge.untrusted {
  background: #ffebee;
  color: #c62828;
}

.access-badge.ignored {
  background: #fff3e0;
  color: #f57c00;
}

.connected-yes {
  color: #2e7d32;
  font-weight: 600;
}

.connected-no {
  color: #999;
}

.filters-section {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.clear-filters-button {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #666;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-filters-button:hover {
  background: #f5f5f5;
  border-color: #4ECDC4;
  color: #4ECDC4;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-group label {
  font-size: 11px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: #4ECDC4;
}

.filter-select:focus {
  outline: none;
  border-color: #4ECDC4;
  box-shadow: 0 0 0 2px rgba(78, 205, 196, 0.1);
}

.filter-results-info {
  font-size: 12px;
  color: #666;
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.audit-placeholder {
  padding: 48px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>

