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
    operationalHoursPerMonth: 0,
    operationsMaterialCostPerMonth: 0,
    maintenanceHoursPerMonth: 0,
    maintenanceMaterialCostPerMonth: 0,
    yearlyCostIncreasePercent: 0,
    replaceAfterMonths: 0,
    replacementCostFactorPercent: 0
  }
}

/** Migrate legacy key names to current schema (for localStorage and import). */
function migrateTypeDataEntry(values) {
  if (!values || typeof values !== 'object') return defaultTypeData()
  return {
    operationalHoursPerMonth: values.operationalHoursPerMonth ?? values.hoursPerMonthHumanOps ?? 0,
    operationsMaterialCostPerMonth: values.operationsMaterialCostPerMonth ?? values.costPerMonthHumanOps ?? 0,
    maintenanceHoursPerMonth: values.maintenanceHoursPerMonth ?? values.hoursPerMonthMaintenance ?? 0,
    maintenanceMaterialCostPerMonth: values.maintenanceMaterialCostPerMonth ?? values.costPerMonthMaintenance ?? 0,
    yearlyCostIncreasePercent: values.yearlyCostIncreasePercent ?? 0,
    replaceAfterMonths: values.replaceAfterMonths ?? 0,
    replacementCostFactorPercent: values.replacementCostFactorPercent ?? 0
  }
}

const DEFAULT_HOURS_PER_WORKING_DAY = 8
const DEFAULT_WORKING_DAYS_PER_YEAR = 260
const DEFAULT_HOURLY_RATE = 0

export const useConopsManagerStore = defineStore('conopsManager', () => {
  const typeData = ref({})
  const currency = ref({ code: 'USD', symbol: '$' })
  const hoursPerWorkingDay = ref(DEFAULT_HOURS_PER_WORKING_DAY)
  const workingDaysPerYear = ref(DEFAULT_WORKING_DAYS_PER_YEAR)
  const hourlyRate = ref(DEFAULT_HOURLY_RATE)

  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        const raw = data.typeData ?? {}
        const migrated = {}
        for (const [type, values] of Object.entries(raw)) {
          migrated[type] = migrateTypeDataEntry(values)
        }
        typeData.value = migrated
        if (data.currency?.code && data.currency?.symbol) {
          currency.value = data.currency
        }
        if (typeof data.hoursPerWorkingDay === 'number' && data.hoursPerWorkingDay >= 0) {
          hoursPerWorkingDay.value = data.hoursPerWorkingDay
        }
        if (typeof data.workingDaysPerYear === 'number' && data.workingDaysPerYear >= 0) {
          workingDaysPerYear.value = data.workingDaysPerYear
        }
        if (typeof data.hourlyRate === 'number' && data.hourlyRate >= 0) {
          hourlyRate.value = data.hourlyRate
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
        workingDaysPerYear: workingDaysPerYear.value,
        hourlyRate: hourlyRate.value
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

  function setHourlyRate(value) {
    const num = Number(value)
    if (!Number.isNaN(num) && num >= 0) {
      hourlyRate.value = num
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
      workingDaysPerYear: workingDaysPerYear.value,
      hourlyRate: hourlyRate.value
    }
  }

  function importTypeData(payload) {
    if (!payload || typeof payload !== 'object') return { success: false, message: 'Invalid payload' }
    const data = payload.typeData ?? payload
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([type, values]) => {
        if (values && typeof values === 'object') {
          setDataForType(type, migrateTypeDataEntry(values))
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
    if (typeof payload.hourlyRate === 'number' && payload.hourlyRate >= 0) {
      hourlyRate.value = payload.hourlyRate
      saveToLocalStorage()
    }
    return { success: true }
  }

  return {
    typeData,
    currency,
    hoursPerWorkingDay,
    workingDaysPerYear,
    hourlyRate,
    CURRENCIES: Object.freeze(CURRENCIES),
    getDataForType,
    setDataForType,
    setCurrency,
    setHoursPerWorkingDay,
    setWorkingDaysPerYear,
    setHourlyRate,
    exportTypeData,
    importTypeData
  }
})
