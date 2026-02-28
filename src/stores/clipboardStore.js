import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useClipboardStore = defineStore('clipboard', () => {
  const components = ref([])
  const connections = ref([])

  function setClipboard(compArray, connArray) {
    components.value = compArray ?? []
    connections.value = connArray ?? []
  }

  function getClipboard() {
    return {
      components: components.value,
      connections: connections.value
    }
  }

  const isEmpty = computed(() => components.value.length === 0)

  return { components, connections, setClipboard, getClipboard, isEmpty }
})
