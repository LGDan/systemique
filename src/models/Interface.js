/**
 * Interface - Represents an input or output port on a component
 */
export class Interface {
  constructor(id, name, type, direction = 'input', validationRules = {}) {
    this.id = id
    this.name = name
    this.type = type // InterfaceType ID
    this.direction = direction // 'input' or 'output'
    this.position = direction === 'input' ? 'left' : 'right' // 'top', 'bottom', 'left', 'right'
    this.validationRules = validationRules // Custom validation rules
    this.metadata = {} // Additional metadata
  }

  static fromJSON(json) {
    const iface = new Interface(
      json.id,
      json.name,
      json.type,
      json.direction,
      json.validationRules || {}
    )
    iface.position = json.position || (json.direction === 'input' ? 'left' : 'right')
    iface.metadata = json.metadata || {}
    return iface
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      direction: this.direction,
      position: this.position,
      validationRules: this.validationRules,
      metadata: this.metadata
    }
  }

  isInput() {
    return this.direction === 'input'
  }

  isOutput() {
    return this.direction === 'output'
  }
}

