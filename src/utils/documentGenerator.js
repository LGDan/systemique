/**
 * Documentation Generator
 */
export function generateDocumentation(system, allSystems = null) {
  const doc = {
    title: `System Documentation: ${system.name}`,
    systemId: system.id,
    generatedAt: new Date().toISOString(),
    overview: {
      name: system.name,
      componentCount: system.components.length,
      connectionCount: system.connections.length,
      hasParent: system.parentSystemId !== null
    },
    components: [],
    connections: [],
    hierarchy: []
  }

  // Generate component documentation
  system.components.forEach(component => {
    const componentDoc = {
      id: component.id,
      name: component.name,
      type: component.type,
      properties: component.properties,
      interfaces: component.interfaces.map(iface => ({
        id: iface.id,
        name: iface.name,
        type: iface.type,
        direction: iface.direction
      })),
      hasNestedSystem: component.hasNestedSystem(),
      nestedSystemId: component.nestedSystemId
    }
    
    doc.components.push(componentDoc)
  })

  // Generate connection documentation
  system.connections.forEach(connection => {
    const sourceComponent = system.getComponent(connection.sourceComponentId)
    const targetComponent = system.getComponent(connection.targetComponentId)
    const sourceInterface = sourceComponent?.getInterface(connection.sourceInterfaceId)
    const targetInterface = targetComponent?.getInterface(connection.targetInterfaceId)
    
    const connectionDoc = {
      id: connection.id,
      source: {
        componentId: connection.sourceComponentId,
        componentName: sourceComponent?.name || 'Unknown',
        interfaceId: connection.sourceInterfaceId,
        interfaceName: sourceInterface?.name || 'Unknown',
        interfaceType: sourceInterface?.type || 'Unknown'
      },
      target: {
        componentId: connection.targetComponentId,
        componentName: targetComponent?.name || 'Unknown',
        interfaceId: connection.targetInterfaceId,
        interfaceName: targetInterface?.name || 'Unknown',
        interfaceType: targetInterface?.type || 'Unknown'
      },
      metadata: connection.metadata,
      validated: connection.validated
    }
    
    doc.connections.push(connectionDoc)
  })

  // Generate hierarchy documentation
  if (allSystems) {
    function buildHierarchy(systemId, level = 0) {
      const sys = allSystems.get(systemId)
      if (!sys) return null
      
      const hierarchyItem = {
        level,
        systemId: sys.id,
        systemName: sys.name,
        componentCount: sys.components.length,
        nestedSystems: []
      }
      
      sys.components.forEach(component => {
        if (component.nestedSystemId) {
          const nested = buildHierarchy(component.nestedSystemId, level + 1)
          if (nested) {
            hierarchyItem.nestedSystems.push(nested)
          }
        }
      })
      
      return hierarchyItem
    }
    
    doc.hierarchy = buildHierarchy(system.id)
  }

  return doc
}

