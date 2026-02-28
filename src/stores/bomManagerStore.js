import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'systemique-bom-manager'
const EXPORT_VERSION = 1

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' }
]

function defaultTypeData() {
  return {
    pricePerUnit: 0,
    implementationCost: 0,
    shippingLeadTime: 0,
    implementationLeadTime: 0
  }
}

export const useBomManagerStore = defineStore('bomManager', () => {
  const typeData = ref({})
  const currency = ref({ code: 'USD', symbol: '$' })

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        typeData.value = data.typeData ?? {}
        if (data.currency?.code && data.currency?.symbol) {
          currency.value = data.currency
        }
      }
    } catch (error) {
      console.error('Failed to load BOM manager from localStorage:', error)
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        typeData: typeData.value,
        currency: currency.value
      }))
    } catch (error) {
      console.error('Failed to save BOM manager to localStorage:', error)
    }
  }

  loadFromLocalStorage()

  function getDataForType(type) {
    const data = typeData.value[type]
    if (data) return { ...defaultTypeData(), ...data }
    return defaultTypeData()
  }

  function setDataForType(type, data) {
    const current = typeData.value[type] ?? {}
    typeData.value[type] = { ...defaultTypeData(), ...current, ...data }
    saveToLocalStorage()
  }

  function setCurrency(code) {
    const found = CURRENCIES.find(c => c.code === code)
    if (found) {
      currency.value = found
      saveToLocalStorage()
    }
  }

  function exportTypeData() {
    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      typeData: { ...typeData.value },
      currency: { ...currency.value }
    }
  }

  function importTypeData(payload) {
    if (!payload || typeof payload !== 'object') return { success: false, message: 'Invalid payload' }
    const data = payload.typeData ?? payload
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([type, values]) => {
        if (values && typeof values === 'object') {
          setDataForType(type, {
            pricePerUnit: values.pricePerUnit,
            implementationCost: values.implementationCost,
            shippingLeadTime: values.shippingLeadTime,
            implementationLeadTime: values.implementationLeadTime
          })
        }
      })
    }
    if (payload.currency?.code) {
      setCurrency(payload.currency.code)
    }
    return { success: true }
  }

  return {
    typeData,
    currency,
    CURRENCIES: Object.freeze(CURRENCIES),
    getDataForType,
    setDataForType,
    setCurrency,
    exportTypeData,
    importTypeData
  }
})
