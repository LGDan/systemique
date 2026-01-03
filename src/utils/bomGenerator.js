/**
 * Bill of Materials Generator
 */
export function generateBOM(system) {
  const bom = {
    systemName: system.name,
    systemId: system.id,
    generatedAt: new Date().toISOString(),
    components: [],
    totals: {
      totalComponents: 0,
      uniqueComponents: 0
    }
  }

  // Collect all components (including nested)
  const componentMap = new Map()
  
  function collectComponents(systemToProcess) {
    systemToProcess.components.forEach(component => {
      const key = `${component.type}-${component.name}`
      
      if (componentMap.has(key)) {
        componentMap.get(key).quantity++
      } else {
        componentMap.set(key, {
          name: component.name,
          type: component.type,
          quantity: 1,
          properties: component.properties,
          interfaces: component.interfaces.length
        })
      }
      
      // If component has nested system, process it recursively
      if (component.nestedSystemId) {
        // Note: In a full implementation, we'd need access to all systems
        // For now, we'll just note that it has a nested system
        const item = componentMap.get(key)
        if (item) {
          item.hasNestedSystem = true
        }
      }
    })
  }

  collectComponents(system)
  
  bom.components = Array.from(componentMap.values())
  bom.totals.totalComponents = bom.components.reduce((sum, c) => sum + c.quantity, 0)
  bom.totals.uniqueComponents = bom.components.length

  return bom
}

