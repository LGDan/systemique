import { defineStore } from 'pinia'
import { ref } from 'vue'

const TOAST_TIMEOUT_MS = 8000

export const useToastStore = defineStore('toast', () => {
  const toasts = ref([])
  let nextId = 0
  let timeoutIds = new Map()

  function show(message, type = 'info') {
    const id = ++nextId
    const entry = { id, message, type }
    toasts.value = [...toasts.value, entry]
    const timeoutId = setTimeout(() => {
      remove(id)
      timeoutIds.delete(id)
    }, TOAST_TIMEOUT_MS)
    timeoutIds.set(id, timeoutId)
    return id
  }

  function remove(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
    const tid = timeoutIds.get(id)
    if (tid) {
      clearTimeout(tid)
      timeoutIds.delete(id)
    }
  }

  return { toasts, show, remove }
})
