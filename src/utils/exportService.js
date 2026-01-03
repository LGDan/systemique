import { generateBOM } from './bomGenerator.js'
import { generateDocumentation } from './documentGenerator.js'

/**
 * Export Service - Handles exporting systems to various formats
 */
export class ExportService {
  /**
   * Export system to JSON format
   */
  static exportToJSON(system, includeBOM = true, includeDocs = true) {
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
}

