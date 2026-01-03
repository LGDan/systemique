import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Component } from '../models/Component.js'
import { Interface } from '../models/Interface.js'

export const useComponentLibraryStore = defineStore('componentLibrary', () => {
  const components = ref(new Map()) // Map<componentId, Component>
  const categories = ref(['Hardware', 'Software', 'Network', 'Storage', 'Custom'])

  // Initialize with default components
  function initializeDefaults() {
    // Server component
    const server = new Component('server-template', 'Server', 'server')
    server.addInterface(new Interface('power-in', 'Power Input', 'power', 'input'))
    server.addInterface(new Interface('network-out', 'Network', 'network', 'output'))
    server.addInterface(new Interface('data-out', 'Data', 'data', 'output'))
    components.value.set('server-template', server)

    // Network Switch
    const switch_ = new Component('switch-template', 'Network Switch', 'switch')
    switch_.addInterface(new Interface('power-in', 'Power Input', 'power', 'input'))
    switch_.addInterface(new Interface('network-in-1', 'Port 1', 'network', 'input'))
    switch_.addInterface(new Interface('network-in-2', 'Port 2', 'network', 'input'))
    switch_.addInterface(new Interface('network-out-1', 'Port 1', 'network', 'output'))
    switch_.addInterface(new Interface('network-out-2', 'Port 2', 'network', 'output'))
    components.value.set('switch-template', switch_)

    // Database
    const database = new Component('database-template', 'Database', 'database')
    database.addInterface(new Interface('power-in', 'Power Input', 'power', 'input'))
    database.addInterface(new Interface('network-in', 'Network', 'network', 'input'))
    database.addInterface(new Interface('data-out', 'Data', 'data', 'output'))
    database.addInterface(new Interface('api-out', 'API', 'api', 'output'))
    components.value.set('database-template', database)

    // PDU (Power Distribution Unit)
    const pdu = new Component('pdu-template', 'PDU', 'pdu')
    pdu.addInterface(new Interface('power-in', 'Power Input', 'power', 'input'))
    pdu.addInterface(new Interface('power-out-1', 'Outlet 1', 'power', 'output'))
    pdu.addInterface(new Interface('power-out-2', 'Outlet 2', 'power', 'output'))
    pdu.addInterface(new Interface('power-out-3', 'Outlet 3', 'power', 'output'))
    components.value.set('pdu-template', pdu)

    // Rack
    const rack = new Component('rack-template', 'Server Rack', 'rack')
    rack.addInterface(new Interface('physical-in', 'Rack Position', 'physical', 'input'))
    rack.addInterface(new Interface('power-in', 'Power Input', 'power', 'input'))
    rack.addInterface(new Interface('power-out', 'Power Output', 'power', 'output'))
    components.value.set('rack-template', rack)

    // API Service
    const apiService = new Component('api-service-template', 'API Service', 'api-service')
    apiService.addInterface(new Interface('network-in', 'Network', 'network', 'input'))
    apiService.addInterface(new Interface('api-out', 'API', 'api', 'output'))
    apiService.addInterface(new Interface('data-in', 'Data', 'data', 'input'))
    components.value.set('api-service-template', apiService)
  }

  // Initialize on store creation
  initializeDefaults()

  function addComponent(component) {
    components.value.set(component.id, component)
  }

  function removeComponent(componentId) {
    components.value.delete(componentId)
  }

  function getComponent(componentId) {
    return components.value.get(componentId)
  }

  function getAllComponents() {
    return Array.from(components.value.values())
  }

  function getComponentsByCategory(category) {
    // For now, return all components. Can be extended with category metadata
    return getAllComponents()
  }

  function createComponentFromTemplate(templateId, newId, position = { x: 0, y: 0 }) {
    const template = components.value.get(templateId)
    if (!template) {
      return null
    }

    // Deep clone the component
    const newComponent = Component.fromJSON(template.toJSON())
    newComponent.id = newId
    newComponent.position = position
    return newComponent
  }

  return {
    components,
    categories,
    addComponent,
    removeComponent,
    getComponent,
    getAllComponents,
    getComponentsByCategory,
    createComponentFromTemplate
  }
})

