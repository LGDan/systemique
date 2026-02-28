<script setup>
import { computed } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'

const systemStore = useSystemStore()

const stats = computed(() => {
  const system = systemStore.currentSystem
  if (!system) {
    return {
      numComponents: 0,
      numConnections: 0,
      averageK: 0,
      maxK: 0
    }
  }
  const numComponents = system.components.length
  const numConnections = system.connections.length

  if (numComponents === 0) {
    return {
      numComponents: 0,
      numConnections: 0,
      averageK: 0,
      maxK: 0
    }
  }

  const connectionsPerComponent = new Map()
  system.components.forEach(c => connectionsPerComponent.set(c.id, 0))
  system.connections.forEach(conn => {
    connectionsPerComponent.set(
      conn.sourceComponentId,
      (connectionsPerComponent.get(conn.sourceComponentId) || 0) + 1
    )
    connectionsPerComponent.set(
      conn.targetComponentId,
      (connectionsPerComponent.get(conn.targetComponentId) || 0) + 1
    )
  })
  const maxK = Math.max(0, ...Array.from(connectionsPerComponent.values()))
  const averageK = numConnections / numComponents

  return {
    numComponents,
    numConnections,
    averageK: Math.round(averageK * 100) / 100,
    maxK
  }
})

const top5Types = computed(() => {
  const system = systemStore.currentSystem
  if (!system || !system.components.length) return []
  const byType = new Map()
  system.components.forEach(c => {
    const type = c.type || 'generic'
    byType.set(type, (byType.get(type) || 0) + 1)
  })
  return Array.from(byType.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const chartMaxCount = computed(() => {
  if (top5Types.value.length === 0) return 1
  return Math.max(...top5Types.value.map(t => t.count), 1)
})
</script>

<template>
  <div class="complexity-review">
    <div class="audit-header">
      <h2>Complexity Review</h2>
      <p class="audit-description">
        Overview of model complexity: component count, connection count, and connectivity (K) metrics.
      </p>
    </div>

    <div class="audit-stats">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Number of components</div>
          <div class="stat-value">{{ stats.numComponents }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Number of connections</div>
          <div class="stat-value">{{ stats.numConnections }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average K</div>
          <div class="stat-value">{{ stats.averageK }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Max K</div>
          <div class="stat-value">{{ stats.maxK }}</div>
        </div>
      </div>
      <p class="stats-summary">
        K = number of connections per component. Average K = total connections ÷ components. Max K = highest connection count on any single component.
      </p>
    </div>

    <div v-if="top5Types.length > 0" class="chart-section">
      <h3 class="chart-title">Top 5 component types</h3>
      <div class="chart-bars">
        <div
          v-for="item in top5Types"
          :key="item.type"
          class="chart-row"
        >
          <span class="chart-label">{{ item.type }}</span>
          <div class="chart-bar-track">
            <div
              class="chart-bar-fill"
              :style="{ width: (item.count / chartMaxCount) * 100 + '%' }"
            ></div>
          </div>
          <span class="chart-value">{{ item.count }}</span>
        </div>
      </div>
    </div>

    <div v-else class="complexity-empty">
      <p>Add components to the design to see complexity stats and the top component types.</p>
    </div>
  </div>
</template>

<style scoped>
.complexity-review {
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
  line-height: 1.4;
}

.audit-stats {
  margin-top: 0;
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

.stats-summary {
  margin: 12px 0 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.chart-section {
  background: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 20px;
}

.chart-title {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chart-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chart-label {
  flex: 0 0 120px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.chart-bar-track {
  flex: 1;
  height: 24px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.chart-bar-fill {
  height: 100%;
  background: #31817c;
  border-radius: 4px;
  min-width: 4px;
  transition: width 0.3s ease;
}

.chart-value {
  flex: 0 0 32px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  text-align: right;
}

.complexity-empty {
  padding: 24px;
  text-align: center;
  color: #666;
  background: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 8px;
}

.complexity-empty p {
  margin: 0;
  font-size: 13px;
}
</style>
