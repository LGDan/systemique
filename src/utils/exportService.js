import { generateBOM } from './bomGenerator.js'
import { generateDocumentation } from './documentGenerator.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { useInterfaceRulesStore } from '../stores/interfaceRulesStore.js'

/**
 * Export Service - Handles exporting systems to various formats
 */
export class ExportService {
  /**
   * Export system to JSON format
   */
  static exportToJSON(system, includeBOM = true, includeDocs = true, includeInterfaceConfig = true) {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      system: system.toJSON()
    }

    if (includeBOM) {
      exportData.bom = generateBOM(system)
    }

    if (includeDocs) {
      // For full documentation, we'd need all systems
      // For now, just document the current system
      exportData.documentation = generateDocumentation(system)
    }

    // Include interface types and rules
    if (includeInterfaceConfig) {
      const typesStore = useInterfaceTypesStore()
      const rulesStore = useInterfaceRulesStore()
      
      exportData.interfaceTypes = typesStore.getAllTypes().map(t => t.toJSON())
      exportData.interfaceRules = rulesStore.getAllRules()
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Export system and download as JSON file
   */
  static downloadJSON(system, filename = null) {
    const json = this.exportToJSON(system)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `systemique-export-${system.name}-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Export BOM only
   */
  static exportBOM(system) {
    return generateBOM(system)
  }

  /**
   * Export documentation only
   */
  static exportDocumentation(system, allSystems = null) {
    return generateDocumentation(system, allSystems)
  }

  /**
   * Export BOM as CSV format
   * CSV includes: ID, Name, Type, Icon
   */
  static exportBOMToCSV(system) {
    const components = system.components || []
    
    // CSV header
    const headers = ['ID', 'Name', 'Type', 'Icon']
    
    // CSV rows
    const rows = components.map(component => {
      // Escape CSV values (handle commas, quotes, newlines)
      const escapeCSV = (value) => {
        if (value === null || value === undefined) {
          return ''
        }
        const stringValue = String(value)
        // If value contains comma, quote, or newline, wrap in quotes and escape quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }
      
      return [
        escapeCSV(component.id),
        escapeCSV(component.name),
        escapeCSV(component.type),
        escapeCSV(component.icon || '')
      ].join(',')
    })
    
    // Combine header and rows
    const csvContent = [headers.join(','), ...rows].join('\n')
    
    return csvContent
  }

  /**
   * Download BOM as CSV file
   */
  static downloadBOMCSV(system, filename = null) {
    const csv = this.exportBOMToCSV(system)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `bom-${system.name}-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

