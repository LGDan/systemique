import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Interface Rules Store
 * Manages type-to-type connection rules
 * Rules can be: null (default/compatibility), true (allow), false (deny)
 */
export const useInterfaceRulesStore = defineStore('interfaceRules', () => {
  // Map of "type1-type2" -> rule (null = default, true = allow, false = deny)
  const typeRules = ref(new Map())
  
  const STORAGE_KEY = 'systemique-interface-rules'

  // Load rules from localStorage on initialization
  function loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        typeRules.value = new Map(Object.entries(data))
      }
    } catch (error) {
      console.error('Failed to load interface rules from localStorage:', error)
    }
  }

  // Save rules to localStorage
  function saveToLocalStorage() {
    try {
      const data = Object.fromEntries(typeRules.value)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save interface rules to localStorage:', error)
    }
  }

  // Initialize from localStorage
  loadFromLocalStorage()

  /**
   * Get rule for a type pair
   * @param {string} type1 - Source type
   * @param {string} type2 - Target type
   * @returns {null|boolean} - null (default), true (allow), or false (deny)
   */
  function getRule(type1, type2) {
    const key = `${type1}-${type2}`
    return typeRules.value.get(key) ?? null
  }

  /**
   * Set rule for a type pair
   * @param {string} type1 - Source type
   * @param {string} type2 - Target type
   * @param {null|boolean} rule - null (default), true (allow), or false (deny)
   */
  function setRule(type1, type2, rule) {
    const key = `${type1}-${type2}`
    if (rule === null) {
      typeRules.value.delete(key)
    } else {
      typeRules.value.set(key, rule)
    }
    saveToLocalStorage()
  }

  /**
   * Cycle through rule states: null -> true -> false -> null
   */
  function cycleRule(type1, type2) {
    const current = getRule(type1, type2)
    let next
    
    if (current === null) {
      next = true // Default -> Allow
    } else if (current === true) {
      next = false // Allow -> Deny
    } else {
      next = null // Deny -> Default
    }
    
    setRule(type1, type2, next)
    return next
  }

  /**
   * Clear all rules
   */
  function clearAllRules() {
    typeRules.value.clear()
    saveToLocalStorage()
  }

  /**
   * Get all rules as an object
   */
  function getAllRules() {
    return Object.fromEntries(typeRules.value)
  }

  return {
    getRule,
    setRule,
    cycleRule,
    clearAllRules,
    getAllRules
  }
})

