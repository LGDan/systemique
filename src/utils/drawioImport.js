/**
 * Draw.io import: parse draw.io XML (exported from Systemique) into a Systemique system.
 * Assumes the file was produced by our export: groups = components, object attributes hold metadata, edges = connections.
 */

import { System } from '../models/System.js'
import { Component } from '../models/Component.js'
import { Interface } from '../models/Interface.js'
import { Connection } from '../models/Connection.js'

function unescapeXmlAttr(value) {
  if (value == null || value === '') return value
  const s = String(value)
  return s
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')
}

function parseJsonAttr(value) {
  if (value == null || value === '') return null
  const unescaped = unescapeXmlAttr(value)
  try {
    return JSON.parse(unescaped)
  } catch {
    return null
  }
}

function getGeometry(mxCell) {
  const geo = mxCell?.querySelector('mxGeometry')
  if (!geo) return { x: 0, y: 0, width: 240, height: 100 }
  const x = Number(geo.getAttribute('x')) || 0
  const y = Number(geo.getAttribute('y')) || 0
  const width = Number(geo.getAttribute('width')) || 240
  const height = Number(geo.getAttribute('height')) || 100
  return { x, y, width, height }
}

function getObjectAttrs(obj) {
  const attrs = {}
  for (const a of obj.attributes || []) {
    attrs[a.name] = a.value
  }
  return attrs
}

function parseComponentData(id, mxCell, attrs) {
  const geometry = getGeometry(mxCell)
  return {
    name: unescapeXmlAttr(attrs.name) || 'Component',
    type: unescapeXmlAttr(attrs.type) || 'generic',
    properties: parseJsonAttr(attrs.properties) || {},
    nestedSystemId: unescapeXmlAttr(attrs.nestedSystemId) || null,
    metadata: parseJsonAttr(attrs.metadata) || {},
    icon: unescapeXmlAttr(attrs.icon) || null,
    categories: parseJsonAttr(attrs.categories) || [],
    description: unescapeXmlAttr(attrs.description) || '',
    trust: unescapeXmlAttr(attrs.trust) || null,
    position: { x: geometry.x, y: geometry.y },
    interfaces: []
  }
}

function parseInterfaceData(attrs) {
  const direction = (unescapeXmlAttr(attrs.direction) || 'input').toLowerCase()
  return {
    name: unescapeXmlAttr(attrs.name) || 'Interface',
    type: unescapeXmlAttr(attrs.type) || 'data',
    direction,
    position: (unescapeXmlAttr(attrs.position) || (direction === 'input' ? 'left' : 'right')).toLowerCase(),
    icon: unescapeXmlAttr(attrs.icon) || null,
    access: unescapeXmlAttr(attrs.access) || null,
    validationRules: parseJsonAttr(attrs.validationRules) || {},
    metadata: parseJsonAttr(attrs.metadata) || {}
  }
}

/**
 * Parse draw.io XML string (from a file exported by Systemique) into a System.
 * @param {string} xmlString - Full draw.io .drawio file content
 * @returns {{ system: import('../models/System.js').System }}
 */
export function importFromDrawio(xmlString) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  const root = doc.querySelector('mxfile diagram mxGraphModel root') || doc.querySelector('root')
  if (!root) {
    throw new Error('Invalid draw.io file: no root found')
  }

  const diagram = doc.querySelector('diagram')
  const systemName = diagram?.getAttribute('name') || 'Imported from draw.io'
  const systemId = 'system-' + Date.now()

  const objects = Array.from(root.querySelectorAll(':scope > object'))
  const edgeCells = Array.from(root.querySelectorAll(':scope > mxCell[edge="1"]'))

  const componentIds = []
  const componentData = new Map()
  const interfaceToComponent = new Map()

  for (const obj of objects) {
    const id = obj.getAttribute('id')
    if (!id || id.endsWith('-bgrect')) continue

    const mxCell = obj.querySelector(':scope > mxCell')
    const parent = mxCell?.getAttribute('parent')
    if (!parent) continue

    const attrs = getObjectAttrs(obj)

    if (parent === '1') {
      componentIds.push(id)
      componentData.set(id, parseComponentData(id, mxCell, attrs))
    } else {
      interfaceToComponent.set(id, parent)
      const comp = componentData.get(parent)
      if (comp) {
        const iface = parseInterfaceData(attrs)
        comp.interfaces.push({ id, ...iface })
      }
    }
  }

  const components = componentIds.map((cid) => {
    const data = componentData.get(cid)
    const interfaces = (data.interfaces || []).map((i) => Interface.fromJSON(i))
    const comp = new Component(cid, data.name, data.type, data.properties)
    comp.interfaces = interfaces
    comp.nestedSystemId = data.nestedSystemId
    comp.metadata = data.metadata
    comp.position = data.position
    comp.icon = data.icon
    comp.categories = data.categories
    comp.description = data.description
    comp.trust = data.trust
    return comp
  })

  const connections = []
  edgeCells.forEach((cell, idx) => {
    const sourceInterfaceId = cell.getAttribute('source')
    const targetInterfaceId = cell.getAttribute('target')
    const connId = cell.getAttribute('id') || `edge-${idx}`
    if (!sourceInterfaceId || !targetInterfaceId) return
    const sourceComponentId = interfaceToComponent.get(sourceInterfaceId)
    const targetComponentId = interfaceToComponent.get(targetInterfaceId)
    if (!sourceComponentId || !targetComponentId) return
    connections.push(
      new Connection(
        connId,
        sourceComponentId,
        sourceInterfaceId,
        targetComponentId,
        targetInterfaceId,
        {}
      )
    )
  })

  const system = new System(systemId, systemName, null)
  system.metadata = {}
  system.components = components
  system.connections = connections

  return { system }
}
