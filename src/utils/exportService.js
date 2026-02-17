import { getActivePinia } from 'pinia'
import { generateBOM } from './bomGenerator.js'
import { generateDocumentation } from './documentGenerator.js'
import { exportToDrawio } from './drawioExport.js'
import { useInterfaceTypesStore } from '../stores/interfaceTypesStore.js'
import { useInterfaceRulesStore } from '../stores/interfaceRulesStore.js'
import { useToastStore } from '../stores/toastStore.js'
import { getInterfaceType } from '../config/defaultInterfaceTypes.js'

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
    link.remove()
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
          return `"${stringValue.replaceAll('"', '""')}"`
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
    link.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * Export system to draw.io uncompressed XML string
   */
  static exportToDrawio(system) {
    return exportToDrawio(system)
  }

  /**
   * Download system as draw.io file
   */
  static downloadDrawio(system, filename = null) {
    const xml = this.exportToDrawio(system)
    const blob = new Blob([xml], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `${system.name}-${Date.now()}.drawio`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  /**
   * Export system to SVG format from actual DOM canvas
   * Captures the rendered canvas for maximum accuracy
   */
  static async exportToSVGFromDOM() {
    return new Promise(async (resolve, reject) => {
      const viewport = document.querySelector('.vue-flow__viewport')
      if (!viewport) {
        reject(new Error('Canvas viewport not found'))
        return
      }

      // Try to dynamically import html2canvas
      let html2canvas
      try {
        html2canvas = (await import('html2canvas')).default
      } catch (error) {
        // html2canvas not available, will use fallback
        reject(new Error('html2canvas not available'))
        return
      }

      try {
        const canvas = await html2canvas(viewport, {
          backgroundColor: '#f8f8f8',
          scale: 2,
          useCORS: true,
          logging: false,
          width: viewport.scrollWidth,
          height: viewport.scrollHeight,
          allowTaint: true
        })
        
        // Convert canvas to SVG
        const svg = this.canvasToSVG(canvas)
        resolve(svg)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Convert canvas to SVG
   */
  static canvasToSVG(canvas) {
    const dataUrl = canvas.toDataURL('image/png')
    const width = canvas.width
    const height = canvas.height
    
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}">
      <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
    </svg>`
  }

  /**
   * Export system to SVG format
   * Creates a visual representation of the system diagram
   * Note: For better accuracy, use exportToSVGFromDOM() instead
   */
  static exportToSVG(system) {
    const components = system.components || []
    const connections = system.connections || []
    
    if (components.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg"><text x="50" y="50">No components to export</text></svg>'
    }

    // Component dimensions (estimated from CSS)
    const COMPONENT_WIDTH = 150
    const COMPONENT_HEIGHT = 80
    const COMPONENT_PADDING = 12
    const INTERFACE_SPACING = 20
    const MARGIN = 50

    // Calculate bounding box
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    components.forEach(component => {
      const x = component.position?.x || 0
      const y = component.position?.y || 0
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x + COMPONENT_WIDTH)
      maxY = Math.max(maxY, y + COMPONENT_HEIGHT)
    })

    // Add margins
    const width = maxX - minX + MARGIN * 2
    const height = maxY - minY + MARGIN * 2
    const offsetX = minX - MARGIN
    const offsetY = minY - MARGIN

    // Helper to get interface position on component
    const getInterfacePosition = (component, iface) => {
      const compX = (component.position?.x || 0) - offsetX
      const compY = (component.position?.y || 0) - offsetY
      const interfaces = component.interfaces || []
      const samePosition = interfaces.filter(i => i.position === iface.position)
      const index = samePosition.findIndex(i => i.id === iface.id)
      const total = samePosition.length

      let x, y
      switch (iface.position) {
        case 'top':
          x = compX + COMPONENT_WIDTH / 2
          y = compY
          if (total > 1) {
            const spacing = COMPONENT_WIDTH / (total + 1)
            x = compX + spacing * (index + 1)
          }
          break
        case 'bottom':
          x = compX + COMPONENT_WIDTH / 2
          y = compY + COMPONENT_HEIGHT
          if (total > 1) {
            const spacing = COMPONENT_WIDTH / (total + 1)
            x = compX + spacing * (index + 1)
          }
          break
        case 'left':
          x = compX
          y = compY + COMPONENT_HEIGHT / 2
          if (total > 1) {
            const spacing = COMPONENT_HEIGHT / (total + 1)
            y = compY + spacing * (index + 1)
          }
          break
        case 'right':
          x = compX + COMPONENT_WIDTH
          y = compY + COMPONENT_HEIGHT / 2
          if (total > 1) {
            const spacing = COMPONENT_HEIGHT / (total + 1)
            y = compY + spacing * (index + 1)
          }
          break
        default:
          x = compX + COMPONENT_WIDTH / 2
          y = compY + COMPONENT_HEIGHT / 2
      }
      return { x, y }
    }

    // Build SVG with explicit dimensions for PNG conversion
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="width: ${width}px; height: ${height}px;">`
    
    // Background
    svg += `<rect width="${width}" height="${height}" fill="#f8f8f8"/>`

    // Get interface type colors
    const getInterfaceTypeColor = (interfaceTypeId) => {
      const type = getInterfaceType(interfaceTypeId)
      return type?.color || '#2A8A84'
    }

    // Arrow marker definitions for different colors
    svg += `<defs>`
    
    // Draw connections first (so they appear behind components)
    const connectionColors = new Set()
    connections.forEach(connection => {
      const sourceComp = components.find(c => c.id === connection.sourceComponentId)
      const sourceInterface = sourceComp?.interfaces?.find(i => i.id === connection.sourceInterfaceId)
      if (sourceInterface) {
        connectionColors.add(getInterfaceTypeColor(sourceInterface.type))
      }
    })

    // Create arrow markers for each unique color
    connectionColors.forEach((color, index) => {
      const markerId = `arrowhead-${index}`
      svg += `<marker id="${markerId}" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="${color}" />
      </marker>`
    })

    // Default arrow marker
    svg += `<marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#2A8A84" />
    </marker>`
    svg += `</defs>`

    // Draw connections
    connections.forEach(connection => {
      const sourceComp = components.find(c => c.id === connection.sourceComponentId)
      const targetComp = components.find(c => c.id === connection.targetComponentId)
      const sourceInterface = sourceComp?.interfaces?.find(i => i.id === connection.sourceInterfaceId)
      const targetInterface = targetComp?.interfaces?.find(i => i.id === connection.targetInterfaceId)

      if (sourceComp && targetComp && sourceInterface && targetInterface) {
        const sourcePos = getInterfacePosition(sourceComp, sourceInterface)
        const targetPos = getInterfacePosition(targetComp, targetInterface)
        const color = getInterfaceTypeColor(sourceInterface.type)
        const markerId = Array.from(connectionColors).indexOf(color) >= 0 
          ? `arrowhead-${Array.from(connectionColors).indexOf(color)}` 
          : 'arrowhead'
        
        svg += `<line x1="${sourcePos.x}" y1="${sourcePos.y}" x2="${targetPos.x}" y2="${targetPos.y}" 
                     stroke="${color}" stroke-width="2" marker-end="url(#${markerId})"/>`
      }
    })

    // Draw components
    components.forEach(component => {
      const x = (component.position?.x || 0) - offsetX
      const y = (component.position?.y || 0) - offsetY
      
      // Determine background color based on trust level
      let fill = '#ffffff'
      if (component.trust === 'trusted') fill = '#ccf2cf'
      else if (component.trust === 'untrusted') fill = '#f1bcc4'
      else if (component.trust === 'ignored') fill = '#cecece'

      // Component rectangle
      svg += `<rect x="${x}" y="${y}" width="${COMPONENT_WIDTH}" height="${COMPONENT_HEIGHT}" 
                    rx="8" ry="8" fill="${fill}" stroke="#333" stroke-width="2"/>`
      
      // Component name
      svg += `<text x="${x + COMPONENT_WIDTH / 2}" y="${y + 25}" 
                    text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#333">${this.escapeXML(component.name)}</text>`
      
      // Component type
      if (component.type && component.type !== 'generic') {
        svg += `<text x="${x + COMPONENT_WIDTH / 2}" y="${y + 45}" 
                      text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">${this.escapeXML(component.type)}</text>`
      }

      // Draw interface connection points
      component.interfaces?.forEach(iface => {
        const pos = getInterfacePosition(component, iface)
        const color = getInterfaceTypeColor(iface.type)
        svg += `<circle cx="${pos.x}" cy="${pos.y}" r="4" fill="white" stroke="${color}" stroke-width="2"/>`
      })
    })

    svg += '</svg>'
    return svg
  }

  /**
   * Escape XML special characters
   */
  static escapeXML(str) {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Download system as SVG file
   * Attempts to capture from DOM first, falls back to programmatic SVG
   */
  static async downloadSVG(system, filename = null) {
    try {
      // Try to capture from DOM first for better accuracy
      const svg = await this.exportToSVGFromDOM()
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `systemique-${system.name}-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      // Fallback to programmatic SVG export
      console.warn('DOM capture failed, using programmatic SVG:', error.message)
      const svg = this.exportToSVG(system)
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `systemique-${system.name}-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }
  }

  /**
   * Export system to PNG format from actual DOM canvas
   * Captures the rendered canvas for maximum accuracy
   */
  static async exportToPNGFromDOM(scale = 2) {
    const viewport = document.querySelector('.vue-flow__viewport')
    if (!viewport) {
      throw new Error('Canvas viewport not found')
    }

    // Try to dynamically import html2canvas
    let html2canvas
    try {
      html2canvas = (await import('html2canvas')).default
    } catch (error) {
      throw new Error('html2canvas not available. Please install: npm install html2canvas')
    }

    const canvas = await html2canvas(viewport, {
      backgroundColor: '#f8f8f8',
      scale: scale,
      useCORS: true,
      logging: false,
      width: viewport.scrollWidth,
      height: viewport.scrollHeight,
      allowTaint: true
    })

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create PNG blob'))
        }
      }, 'image/png')
    })
  }

  /**
   * Convert SVG string to PNG blob
   */
  static async svgToPNG(svgString, scale = 2) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create PNG blob'))
          }
        }, 'image/png')
      }
      
      img.onerror = () => reject(new Error('Failed to load SVG image'))
      img.src = svgDataUrl
    })
  }

  /**
   * Export system to PNG format
   * Converts SVG to PNG using browser canvas API for accurate rendering
   * Note: For better accuracy, use exportToPNGFromDOM() instead
   */
  static async exportToPNG(system, scale = 2) {
    const svg = this.exportToSVG(system)
    
    return new Promise((resolve, reject) => {
      // Create an image from the SVG using data URL
      const img = new Image()
      
      // Convert SVG to data URL
      const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
      
      img.onload = () => {
        try {
          // Create a canvas
          const canvas = document.createElement('canvas')
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
          }
          
          // Enable high-quality rendering
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // Draw the SVG image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // Convert canvas to PNG blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create PNG blob'))
            }
          }, 'image/png')
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load SVG image'))
      }
      
      img.src = svgDataUrl
    })
  }

  /**
   * Download system as PNG file
   * Attempts to capture from DOM first, falls back to SVG-based PNG
   */
  static async downloadPNG(system, filename = null, scale = 2) {
    try {
      // Try to capture from DOM first for better accuracy
      const blob = await this.exportToPNGFromDOM(scale)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || `systemique-${system.name}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      // Fallback to SVG-based PNG export
      console.warn('DOM capture failed, using SVG-based PNG:', error.message)
      try {
        const blob = await this.exportToPNG(system, scale)
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename || `systemique-${system.name}-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      } catch (fallbackError) {
        console.error('Failed to export PNG:', fallbackError)
        const pinia = getActivePinia()
        if (pinia) useToastStore(pinia).show(`Failed to export PNG: ${fallbackError.message}`, 'error')
      }
    }
  }
}

