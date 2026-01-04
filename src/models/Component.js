import { Interface } from './Interface.js'

/**
 * Component - Represents a system block with interfaces, properties, and optional nested system
 */
export class Component {
  constructor(id, name, type = 'generic', properties = {}) {
    this.id = id
    this.name = name
    this.type = type
    this.properties = properties
    this.interfaces = [] // Array of Interface objects
    this.nestedSystemId = null // ID of nested system if this component has one
    this.position = { x: 0, y: 0 }
    this.metadata = {}
    this.icon = null // Material Design Icon name
    this.categories = [] // Array of category strings (e.g., ['Hardware', 'Network'])
    this.description = '' // Component description
    this.trust = null // Component trust level: null (unset), 'trusted', 'untrusted', 'ignored'
  }

  static fromJSON(json) {
    const component = new Component(
      json.id,
      json.name,
      json.type,
      json.properties || {}
    )
    component.interfaces = (json.interfaces || []).map(i => Interface.fromJSON(i))
    component.nestedSystemId = json.nestedSystemId || null
    component.position = json.position || { x: 0, y: 0 }
    component.metadata = json.metadata || {}
    component.icon = json.icon || null
    component.categories = json.categories || []
    component.description = json.description || ''
    component.trust = json.trust || null
    return component
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      properties: this.properties,
      interfaces: this.interfaces.map(i => i.toJSON()),
      nestedSystemId: this.nestedSystemId,
      position: this.position,
      metadata: this.metadata,
      icon: this.icon,
      categories: this.categories,
      description: this.description,
      trust: this.trust
    }
  }

  // Convert to vue-flow node format
  toNode() {
    return {
      id: this.id,
      type: 'system',
      label: this.name,
      position: this.position,
      data: {
        component: this
      }
    }
  }

  addInterface(interfaceObj) {
    this.interfaces.push(interfaceObj)
  }

  removeInterface(interfaceId) {
    this.interfaces = this.interfaces.filter(i => i.id !== interfaceId)
  }

  getInterface(interfaceId) {
    return this.interfaces.find(i => i.id === interfaceId)
  }

  getInputInterfaces() {
    return this.interfaces.filter(i => i.isInput())
  }

  getOutputInterfaces() {
    return this.interfaces.filter(i => i.isOutput())
  }

  hasNestedSystem() {
    return this.nestedSystemId !== null
  }
}

