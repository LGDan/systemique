import { Component } from './Component.js'
import { Connection } from './Connection.js'

/**
 * System - Container for components and connections (supports nesting)
 */
export class System {
  constructor(id, name, parentSystemId = null) {
    this.id = id
    this.name = name
    this.parentSystemId = parentSystemId
    this.components = [] // Array of Component objects
    this.connections = [] // Array of Connection objects
    this.metadata = {}
  }

  static fromJSON(json) {
    const system = new System(
      json.id,
      json.name,
      json.parentSystemId || null
    )
    system.components = (json.components || []).map(c => Component.fromJSON(c))
    system.connections = (json.connections || []).map(c => Connection.fromJSON(c))
    system.metadata = json.metadata || {}
    return system
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      parentSystemId: this.parentSystemId,
      components: this.components.map(c => c.toJSON()),
      connections: this.connections.map(c => c.toJSON()),
      metadata: this.metadata
    }
  }

  addComponent(component) {
    this.components.push(component)
  }

  removeComponent(componentId) {
    // Remove component and all its connections
    this.components = this.components.filter(c => c.id !== componentId)
    this.connections = this.connections.filter(
      c => c.sourceComponentId !== componentId && c.targetComponentId !== componentId
    )
  }

  getComponent(componentId) {
    return this.components.find(c => c.id === componentId)
  }

  addConnection(connection) {
    this.connections.push(connection)
  }

  removeConnection(connectionId) {
    this.connections = this.connections.filter(c => c.id !== connectionId)
  }

  getConnection(connectionId) {
    return this.connections.find(c => c.id === connectionId)
  }

  // Convert to vue-flow format
  toVueFlow() {
    return {
      nodes: this.components.map(c => c.toNode()),
      edges: this.connections.map(c => c.toEdge())
    }
  }

  // Get all components with nested systems
  getNestedComponents() {
    return this.components.filter(c => c.hasNestedSystem())
  }
}

