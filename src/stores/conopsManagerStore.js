import { defineStore } from 'pinia'
import { ref } from 'vue'

const STORAGE_KEY = 'systemique-conops-manager'
const EXPORT_VERSION = 1

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' }
]

function defaultTypeData() {
  return {
    hoursPerMonthHumanOps: 0,
    costPerMonthHumanOps: 0,
    hoursPerMonthMaintenance: 0,
    costPerMonthMaintenance: 0,
    yearlyCostIncreasePercent: 0,
    replaceAfterMonths: 0,
    replacementCostFactorPercent: 0
  }
}

export const useConopsManagerStore = defineStore('conopsManager', () => {
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
      console.error('Failed to load CONOPS manager from localStorage:', error)
    }
  }

  function saveToLocalStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        typeData: typeData.value,
        currency: currency.value
      }))
    } catch (error) {
      console.error('Failed to save CONOPS manager to localStorage:', error)
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
            hoursPerMonthHumanOps: values.hoursPerMonthHumanOps,
            costPerMonthHumanOps: values.costPerMonthHumanOps,
            hoursPerMonthMaintenance: values.hoursPerMonthMaintenance,
            costPerMonthMaintenance: values.costPerMonthMaintenance,
            yearlyCostIncreasePercent: values.yearlyCostIncreasePercent,
            replaceAfterMonths: values.replaceAfterMonths,
            replacementCostFactorPercent: values.replacementCostFactorPercent
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
