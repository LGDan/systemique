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

const DEFAULT_HOURS_PER_WORKING_DAY = 8
const DEFAULT_WORKING_DAYS_PER_YEAR = 260

export const useConopsManagerStore = defineStore('conopsManager', () => {
  const typeData = ref({})
  const currency = ref({ code: 'USD', symbol: '$' })
  const hoursPerWorkingDay = ref(DEFAULT_HOURS_PER_WORKING_DAY)
  const workingDaysPerYear = ref(DEFAULT_WORKING_DAYS_PER_YEAR)

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        typeData.value = data.typeData ?? {}
        if (data.currency?.code && data.currency?.symbol) {
          currency.value = data.currency
        }
        if (typeof data.hoursPerWorkingDay === 'number' && data.hoursPerWorkingDay >= 0) {
          hoursPerWorkingDay.value = data.hoursPerWorkingDay
        }
        if (typeof data.workingDaysPerYear === 'number' && data.workingDaysPerYear >= 0) {
          workingDaysPerYear.value = data.workingDaysPerYear
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
        currency: currency.value,
        hoursPerWorkingDay: hoursPerWorkingDay.value,
        workingDaysPerYear: workingDaysPerYear.value
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

  function setHoursPerWorkingDay(value) {
    const num = Number(value)
    if (!Number.isNaN(num) && num >= 0) {
      hoursPerWorkingDay.value = num
      saveToLocalStorage()
    }
  }

  function setWorkingDaysPerYear(value) {
    const num = Number(value)
    if (!Number.isNaN(num) && num >= 0) {
      workingDaysPerYear.value = num
      saveToLocalStorage()
    }
  }

  function exportTypeData() {
    return {
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      typeData: { ...typeData.value },
      currency: { ...currency.value },
      hoursPerWorkingDay: hoursPerWorkingDay.value,
      workingDaysPerYear: workingDaysPerYear.value
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
    if (typeof payload.hoursPerWorkingDay === 'number' && payload.hoursPerWorkingDay >= 0) {
      hoursPerWorkingDay.value = payload.hoursPerWorkingDay
      saveToLocalStorage()
    }
    if (typeof payload.workingDaysPerYear === 'number' && payload.workingDaysPerYear >= 0) {
      workingDaysPerYear.value = payload.workingDaysPerYear
      saveToLocalStorage()
    }
    return { success: true }
  }

  return {
    typeData,
    currency,
    hoursPerWorkingDay,
    workingDaysPerYear,
    CURRENCIES: Object.freeze(CURRENCIES),
    getDataForType,
    setDataForType,
    setCurrency,
    setHoursPerWorkingDay,
    setWorkingDaysPerYear,
    exportTypeData,
    importTypeData
  }
})
