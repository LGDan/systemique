<script setup>
import { ref, computed } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { useToastStore } from '../stores/toastStore.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { matchesRiskStatus, matchesBoundaryType, matchesTrust } from '../utils/tableFilterUtils.js'

const emit = defineEmits(['navigate-to-component'])
const systemStore = useSystemStore()
const typesStore = useInterfaceTypesStore()

function onRowDoubleClick(componentId) {
  emit('navigate-to-component', componentId)
}

// Stats
const stats = ref({
  totalBoundaries: 0,
  secure: 0,
  atRisk: 0,
  unset: 0,
  trustedToUntrusted: 0,
  untrustedToTrusted: 0,
  ignoredBoundaries: 0
})

// Table data (all data)
const allTableData = ref([])

// Filter state
const filters = ref({
  riskStatus: 'all', // 'all', 'secure', 'at-risk', 'unset'
  boundaryType: 'all', // 'all', 'trusted-to-untrusted', 'untrusted-to-trusted', 'ignored'
  sourceTrust: 'all', // 'all', 'trusted', 'untrusted', 'ignored', 'unset'
  targetTrust: 'all' // 'all', 'trusted', 'untrusted', 'ignored', 'unset'
})

// Helper functions for filtering
function matchesSourceTrustFilter(item, filterValue) {
  return matchesTrust(item, 'sourceTrust', filterValue)
}

function matchesTargetTrustFilter(item, filterValue) {
  return matchesTrust(item, 'targetTrust', filterValue)
}

// Computed filtered table data
const tableData = computed(() => {
  return allTableData.value.filter(item => {
    return matchesRiskStatus(item, filters.value.riskStatus) &&
           matchesBoundaryType(item, filters.value.boundaryType) &&
           matchesSourceTrustFilter(item, filters.value.sourceTrust) &&
           matchesTargetTrustFilter(item, filters.value.targetTrust)
  })
})

// Helper function to determine boundary type
function determineBoundaryType(sourceTrust, targetTrust) {
  if (sourceTrust === 'trusted' && targetTrust === 'untrusted') {
    return 'trusted-to-untrusted'
  }
  if (sourceTrust === 'untrusted' && targetTrust === 'trusted') {
    return 'untrusted-to-trusted'
  }
  if (!sourceTrust && targetTrust === 'untrusted') {
    return 'unset-to-untrusted'
  }
  if (sourceTrust === 'untrusted' && !targetTrust) {
    return 'untrusted-to-unset'
  }
  return null
}

// Helper function to check if boundary involves unset trust
function isUnsetBoundary(boundaryType) {
  return boundaryType === 'unset-to-untrusted' || boundaryType === 'untrusted-to-unset'
}

// Helper function to assess risk based on interface access
function assessInterfaceAccessRisk(boundaryType, sourceAccess) {
  if (sourceAccess === 'untrusted') {
    return {
      riskStatus: 'secure',
      riskReason: 'Interface access properly set to Untrusted'
    }
  }
  
  if (sourceAccess === null || sourceAccess === 'Unset' || sourceAccess === 'unset') {
    return {
      riskStatus: 'unset',
      riskReason: 'Interface access not set - boundary not considered'
    }
  }
  
  if (sourceAccess === 'trusted') {
    return {
      riskStatus: 'at-risk',
      riskReason: 'Interface access set to Trusted but should be Untrusted for this boundary'
    }
  }
  
  return {
    riskStatus: 'at-risk',
    riskReason: 'Interface access not properly configured for this boundary'
  }
}

// Determine if a boundary is secure or at risk
function assessBoundaryRisk(sourceComponent, targetComponent, sourceInterface, targetInterface) {
  const sourceTrust = sourceComponent.trust
  const targetTrust = targetComponent.trust
  
  // No boundary if trust levels are the same or both unset
  if (sourceTrust === targetTrust || (!sourceTrust && !targetTrust)) {
    return null
  }
  
  // If either is ignored, it's a special case
  if (sourceTrust === 'ignored' || targetTrust === 'ignored') {
    return {
      isBoundary: true,
      boundaryType: 'ignored',
      riskStatus: 'secure',
      riskReason: 'One or both components are marked as ignored'
    }
  }
  
  // Determine boundary type
  const boundaryType = determineBoundaryType(sourceTrust, targetTrust)
  if (!boundaryType) {
    return null
  }
  
  // For unset boundaries, always mark as at-risk
  if (isUnsetBoundary(boundaryType)) {
    return {
      isBoundary: true,
      boundaryType,
      riskStatus: 'at-risk',
      riskReason: 'Security boundary not assessed - one component trust level is unset'
    }
  }
  
  // Assess risk based on interface access
  const accessAssessment = assessInterfaceAccessRisk(boundaryType, sourceInterface.access)
  return {
    isBoundary: true,
    boundaryType,
    riskStatus: accessAssessment.riskStatus,
    riskReason: accessAssessment.riskReason
  }
}

function runAudit() {
  const system = systemStore.currentSystem
  if (!system) {
    allTableData.value = []
    return
  }
  
  // Reset stats
  stats.value = {
    totalBoundaries: 0,
    secure: 0,
    atRisk: 0,
    unset: 0,
    trustedToUntrusted: 0,
    untrustedToTrusted: 0,
    unsetToUntrusted: 0,
    ignoredBoundaries: 0
  }
  
  // Build table data from connections
  const boundaries = []
  
  system.connections.forEach(connection => {
    const sourceComponent = system.getComponent(connection.sourceComponentId)
    const targetComponent = system.getComponent(connection.targetComponentId)
    
    if (!sourceComponent || !targetComponent) return
    
    const sourceInterface = sourceComponent.getInterface(connection.sourceInterfaceId)
    const targetInterface = targetComponent.getInterface(connection.targetInterfaceId)
    
    if (!sourceInterface || !targetInterface) return
    
    // Assess the boundary
    const assessment = assessBoundaryRisk(sourceComponent, targetComponent, sourceInterface, targetInterface)
    
    if (assessment && assessment.isBoundary) {
      const sourceTrust = sourceComponent.trust || 'unset'
      const targetTrust = targetComponent.trust || 'unset'
      
      boundaries.push({
        connectionId: connection.id,
        sourceComponentId: sourceComponent.id,
        sourceComponentName: sourceComponent.name,
        sourceInterfaceName: sourceInterface.name,
        sourceTrust: sourceTrust,
        sourceAccess: sourceInterface.access || 'Unset',
        targetComponentId: targetComponent.id,
        targetComponentName: targetComponent.name,
        targetInterfaceName: targetInterface.name,
        targetTrust: targetTrust,
        targetAccess: targetInterface.access || 'Unset',
        boundaryType: assessment.boundaryType,
        riskStatus: assessment.riskStatus,
        riskReason: assessment.riskReason
      })
      
      // Update stats
      stats.value.totalBoundaries++
      
      if (assessment.riskStatus === 'secure') {
        stats.value.secure++
      } else if (assessment.riskStatus === 'at-risk') {
        stats.value.atRisk++
      } else if (assessment.riskStatus === 'unset') {
        stats.value.unset++
      }
      
      if (assessment.boundaryType === 'trusted-to-untrusted') {
        stats.value.trustedToUntrusted++
      } else if (assessment.boundaryType === 'untrusted-to-trusted') {
        stats.value.untrustedToTrusted++
      } else if (assessment.boundaryType === 'unset-to-untrusted' || assessment.boundaryType === 'untrusted-to-unset') {
        stats.value.unsetToUntrusted++
      } else if (assessment.boundaryType === 'ignored') {
        stats.value.ignoredBoundaries++
      }
    }
  })
  
  allTableData.value = boundaries
}

function exportToCSV() {
  if (tableData.value.length === 0) {
    useToastStore().show('No data to export. Please run the audit first.', 'error')
    return
  }
  
  const headers = [
    'Connection ID',
    'Source Component',
    'Source Interface',
    'Source Trust',
    'Source Access',
    'Target Component',
    'Target Interface',
    'Target Trust',
    'Target Access',
    'Boundary Type',
    'Risk Status',
    'Risk Reason'
  ]
  
  const rows = tableData.value.map(item => {
    const escapeCSV = (value) => {
      if (value === null || value === undefined) {
        return ''
      }
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replaceAll('"', '""')}"`
      }
      return stringValue
    }
    
    return [
      escapeCSV(item.connectionId),
      escapeCSV(item.sourceComponentName),
      escapeCSV(item.sourceInterfaceName),
      escapeCSV(item.sourceTrust),
      escapeCSV(item.sourceAccess),
      escapeCSV(item.targetComponentName),
      escapeCSV(item.targetInterfaceName),
      escapeCSV(item.targetTrust),
      escapeCSV(item.targetAccess),
      escapeCSV(item.boundaryType),
      escapeCSV(item.riskStatus),
      escapeCSV(item.riskReason)
    ].join(',')
  })
  
  const csvContent = [headers.join(','), ...rows].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `boundary-audit-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function clearAllFilters() {
  filters.value = {
    riskStatus: 'all',
    boundaryType: 'all',
    sourceTrust: 'all',
    targetTrust: 'all'
  }
}

function filterByRiskStatus(status) {
  if (filters.value.riskStatus === status) {
    filters.value.riskStatus = 'all'
  } else {
    filters.value.riskStatus = status
  }
}
</script>

<template>
  <div class="boundary-audit">
    <div class="audit-header">
      <h2>Boundary Audit</h2>
      <p class="audit-description">
        Identify security boundaries where components with different trust levels are connected, and assess potential risks.
      </p>
      <button @click="runAudit()" class="run-audit-button">
        Run Audit
      </button>
    </div>

    <div v-if="stats.totalBoundaries > 0" class="audit-stats">
      <div class="stats-grid">
        <div class="stat-card" @click="clearAllFilters()" :class="{ 'filter-active': filters.riskStatus === 'all' && filters.boundaryType === 'all' && filters.sourceTrust === 'all' && filters.targetTrust === 'all' }">
          <div class="stat-label">Total Boundaries</div>
          <div class="stat-value">{{ stats.totalBoundaries }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByRiskStatus('secure')" :class="{ 'filter-active': filters.riskStatus === 'secure' }">
          <div class="stat-label">Secure</div>
          <div class="stat-value secure">{{ stats.secure }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByRiskStatus('at-risk')" :class="{ 'filter-active': filters.riskStatus === 'at-risk' }">
          <div class="stat-label">At Risk</div>
          <div class="stat-value at-risk">{{ stats.atRisk }}</div>
        </div>
        
        <div class="stat-card clickable" @click="filterByRiskStatus('unset')" :class="{ 'filter-active': filters.riskStatus === 'unset' }">
          <div class="stat-label">Unset</div>
          <div class="stat-value unset">{{ stats.unset }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Trusted → Untrusted</div>
          <div class="stat-value">{{ stats.trustedToUntrusted }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Untrusted → Trusted</div>
          <div class="stat-value">{{ stats.untrustedToTrusted }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Unset ↔ Untrusted</div>
          <div class="stat-value at-risk">{{ stats.unsetToUntrusted }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-label">Ignored Boundaries</div>
          <div class="stat-value ignored">{{ stats.ignoredBoundaries }}</div>
        </div>
      </div>
    </div>

    <div v-if="stats.totalBoundaries > 0 && allTableData.length > 0" class="filters-section">
      <div class="filters-header">
        <h4>Filters</h4>
        <button @click="clearAllFilters()" class="clear-filters-button" v-if="filters.riskStatus !== 'all' || filters.boundaryType !== 'all' || filters.sourceTrust !== 'all' || filters.targetTrust !== 'all'">
          Clear All
        </button>
      </div>
      <div class="filters-grid">
        <div class="filter-group">
          <label for="filter-risk-status">Risk Status</label>
          <select id="filter-risk-status" v-model="filters.riskStatus" class="filter-select">
            <option value="all">All</option>
            <option value="secure">Secure</option>
            <option value="at-risk">At Risk</option>
            <option value="unset">Unset</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filter-boundary-type">Boundary Type</label>
          <select id="filter-boundary-type" v-model="filters.boundaryType" class="filter-select">
            <option value="all">All</option>
            <option value="trusted-to-untrusted">Trusted → Untrusted</option>
            <option value="untrusted-to-trusted">Untrusted → Trusted</option>
            <option value="unset-to-untrusted">Unset → Untrusted</option>
            <option value="untrusted-to-unset">Untrusted → Unset</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filter-source-trust">Source Trust</label>
          <select id="filter-source-trust" v-model="filters.sourceTrust" class="filter-select">
            <option value="all">All</option>
            <option value="trusted">Trusted</option>
            <option value="untrusted">Untrusted</option>
            <option value="ignored">Ignored</option>
            <option value="unset">Unset</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="filter-target-trust">Target Trust</label>
          <select id="filter-target-trust" v-model="filters.targetTrust" class="filter-select">
            <option value="all">All</option>
            <option value="trusted">Trusted</option>
            <option value="untrusted">Untrusted</option>
            <option value="ignored">Ignored</option>
            <option value="unset">Unset</option>
          </select>
        </div>
      </div>
      <div class="filter-results-info">
        Showing {{ tableData.length }} of {{ allTableData.length }} boundaries
      </div>
    </div>

    <div v-if="tableData.length > 0" class="audit-table-section">
      <div class="table-header">
        <h3>Security Boundaries</h3>
        <button @click="exportToCSV()" class="export-button">
          Export CSV
        </button>
      </div>
      
      <div class="table-container">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Source Component</th>
              <th>Source Interface</th>
              <th>Source Trust</th>
              <th>Source Access</th>
              <th>Target Component</th>
              <th>Target Interface</th>
              <th>Target Trust</th>
              <th>Target Access</th>
              <th>Boundary Type</th>
              <th>Risk Status</th>
              <th>Risk Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in tableData"
              :key="index"
              :class="['risk-' + item.riskStatus, 'row-clickable']"
              @dblclick="onRowDoubleClick(item.sourceComponentId)"
            >
              <td class="cell-name">{{ item.sourceComponentName }}</td>
              <td class="cell-name">{{ item.sourceInterfaceName }}</td>
              <td class="cell-trust">
                <span class="trust-badge" :class="item.sourceTrust">{{ item.sourceTrust }}</span>
              </td>
              <td class="cell-access">
                <span class="access-badge" :class="(item.sourceAccess || 'unset').toLowerCase()">
                  {{ item.sourceAccess }}
                </span>
              </td>
              <td class="cell-name">{{ item.targetComponentName }}</td>
              <td class="cell-name">{{ item.targetInterfaceName }}</td>
              <td class="cell-trust">
                <span class="trust-badge" :class="item.targetTrust">{{ item.targetTrust }}</span>
              </td>
              <td class="cell-access">
                <span class="access-badge" :class="(item.targetAccess || 'unset').toLowerCase()">
                  {{ item.targetAccess }}
                </span>
              </td>
              <td class="cell-boundary-type">{{ item.boundaryType }}</td>
              <td class="cell-risk">
                <span class="risk-badge" :class="item.riskStatus">
                  {{ item.riskStatus === 'at-risk' ? 'At Risk' : item.riskStatus === 'secure' ? 'Secure' : 'Unset' }}
                </span>
              </td>
              <td class="cell-reason">{{ item.riskReason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="allTableData.length === 0" class="audit-placeholder">
      <p>Click "Run Audit" to analyze security boundaries in the current system.</p>
    </div>
    
    <div v-else class="audit-placeholder">
      <p>No boundaries match the current filters. Try adjusting your filter criteria.</p>
    </div>
  </div>
</template>

<style scoped>
.boundary-audit {
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
  background: #1F6B66;
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
  border-color: #2A8A84;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-card.filter-active {
  background: #E8F5E9;
  border-color: #2A8A84;
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

.stat-value.secure {
  color: #2e7d32;
}

.stat-value.at-risk {
  color: #c62828;
}

.stat-value.unset {
  color: #f57c00;
}

.stat-value.ignored {
  color: #666;
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
  border-color: #2A8A84;
  color: #1F6B66;
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
  border-color: #2A8A84;
}

.filter-select:focus {
  outline: none;
  border-color: #2A8A84;
  box-shadow: 0 0 0 2px rgba(42, 138, 132, 0.1);
}

.filter-results-info {
  font-size: 12px;
  color: #666;
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid #eee;
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

.audit-table tbody tr.risk-secure {
  background: #f1f8f4;
}

.audit-table tbody tr.risk-at-risk {
  background: #fff5f5;
}

.audit-table tbody tr.risk-unset {
  background: #fffbf0;
}

.audit-table tbody tr.row-clickable {
  cursor: pointer;
}

.cell-name {
  font-weight: 500;
  color: #333;
}

.trust-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}

.trust-badge.trusted {
  background: #ccf2cf;
  color: #215b24;
}

.trust-badge.untrusted {
  background: #f1bcc4;
  color: #9f2020;
}

.trust-badge.ignored {
  background: #cecece;
  color: #4d4d4d;
}

.trust-badge.unset {
  background: #f0f0f0;
  color: #676767;
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
  color: #5c5c5c;
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
  color: #a85400;
}

.cell-boundary-type {
  text-transform: capitalize;
  font-size: 11px;
}

.risk-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: capitalize;
}

.risk-badge.secure {
  background: #e8f5e9;
  color: #2e7d32;
}

.risk-badge.at-risk {
  background: #ffebee;
  color: #c62828;
}

.risk-badge.unset {
  background: #fff3e0;
  color: #a85400;
}

.cell-reason {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.audit-placeholder {
  padding: 48px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>

