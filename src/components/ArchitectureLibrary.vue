<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSystemStore } from '../stores/systemStore.js'
import { PersistenceService } from '../utils/persistenceService.js'

const emit = defineEmits(['open-design'])

const baseUrl = import.meta.env.BASE_URL
const manifestUrl = `${baseUrl}architecture-library.json`

const entries = ref([])
const searchQuery = ref('')
const loading = ref(true)
const loadError = ref(null)
const loadingEntryId = ref(null)

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return entries.value
  return entries.value.filter((entry) => {
    const title = (entry.title || '').toLowerCase()
    const description = (entry.description || '').toLowerCase()
    const tags = (entry.tags || []).map((t) => String(t).toLowerCase())
    return (
      title.includes(q) ||
      description.includes(q) ||
      tags.some((tag) => tag.includes(q))
    )
  })
})

onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    const res = await fetch(manifestUrl)
    if (!res.ok) throw new Error(`Failed to load manifest: ${res.statusText}`)
    const data = await res.json()
    entries.value = Array.isArray(data) ? data : (data.entries || [])
  } catch (err) {
    console.error('Architecture Library manifest load failed:', err)
    loadError.value = err.message || 'Could not load architecture library.'
  } finally {
    loading.value = false
  }
})

async function loadEntry(entry) {
  loadingEntryId.value = entry.id
  try {
    const url = entry.modelUrl.startsWith('http') ? entry.modelUrl : `${baseUrl}${entry.modelUrl}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to load model: ${res.statusText}`)
    const text = await res.text()
    const result = PersistenceService.importFromJSON(text)
    const systemStore = useSystemStore()
    systemStore.importSystem(result.system.toJSON())
    if (result.interfaceTypes || result.interfaceRules) {
      PersistenceService.importInterfaceConfig(result.interfaceTypes, result.interfaceRules)
    }
    emit('open-design')
  } catch (err) {
    console.error('Architecture Library model load failed:', err)
    alert(`Could not load architecture: ${err.message || 'Unknown error'}.`)
  } finally {
    loadingEntryId.value = null
  }
}

function screenshotSrc(entry) {
  if (!entry.screenshot) return ''
  return entry.screenshot.startsWith('http') ? entry.screenshot : `${baseUrl}${entry.screenshot}`
}
</script>

<template>
  <div class="architecture-library">
    <div class="library-header">
      <h2 class="library-title">Architecture Library</h2>
      <p class="library-description">
        Curated diagrams and models. Click a tile to load it into the design canvas.
      </p>
      <div v-if="!loading && !loadError && entries.length > 0" class="library-search-wrap">
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search titles, tags, descriptions…"
          class="library-search"
          aria-label="Search library"
        />
      </div>
    </div>

    <div v-if="loading" class="library-state">
      <p>Loading library…</p>
    </div>

    <div v-else-if="loadError" class="library-state library-error">
      <p>{{ loadError }}</p>
    </div>

    <div v-else-if="entries.length === 0" class="library-state">
      <p>No architectures in the library yet.</p>
    </div>

    <div v-else-if="filteredEntries.length === 0" class="library-state">
      <p>No results for "{{ searchQuery }}". Try a different search.</p>
    </div>

    <div v-else class="library-grid">
      <div
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="library-tile"
        :class="{ loading: loadingEntryId === entry.id }"
        @click="loadEntry(entry)"
      >
        <div class="tile-image-wrap">
          <img
            v-if="entry.screenshot"
            :src="screenshotSrc(entry)"
            :alt="entry.title"
            class="tile-image"
            @error="$event.target.style.display = 'none'; $event.target.nextElementSibling?.classList.add('visible')"
          />
          <div class="tile-image-fallback" :class="{ visible: !entry.screenshot }">
            <span class="tile-fallback-text">{{ entry.title?.charAt(0)?.toUpperCase() || '?' }}</span>
          </div>
        </div>
        <div class="tile-body">
          <h3 class="tile-title">{{ entry.title }}</h3>
          <p class="tile-description">{{ entry.description }}</p>
          <div v-if="entry.tags?.length" class="tile-tags">
            <span v-for="tag in entry.tags" :key="tag" class="tile-tag">{{ tag }}</span>
          </div>
        </div>
        <div v-if="loadingEntryId === entry.id" class="tile-loading">Loading…</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.architecture-library {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.library-header {
  flex-shrink: 0;
}

.library-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.library-description {
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.library-search-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.library-search {
  width: 100%;
  max-width: 400px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background: #fff;
  transition: border-color 0.2s;
}

.library-search::placeholder {
  color: #999;
}

.library-search:focus {
  outline: none;
  border-color: #2A8A84;
  box-shadow: 0 0 0 2px rgba(42, 138, 132, 0.15);
}

.library-state {
  padding: 48px 24px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.library-error {
  color: #c62828;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-content: start;
}

.library-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.library-tile:hover {
  border-color: #2A8A84;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.library-tile.loading {
  pointer-events: none;
  opacity: 0.8;
}

.tile-image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  background: #f5f5f5;
  overflow: hidden;
}

.tile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.tile-image-fallback {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
}

.tile-image-fallback.visible {
  display: flex;
}

.tile-fallback-text {
  font-size: 48px;
  font-weight: 700;
  color: #999;
}

.tile-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.tile-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
}

.tile-description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tile-tag {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
}

.tile-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  font-weight: 600;
  color: #1F6B66;
}
</style>
