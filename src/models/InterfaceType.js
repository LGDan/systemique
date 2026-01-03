/**
 * InterfaceType - Defines interface categories and their properties
 */
export class InterfaceType {
  constructor(id, name, color, icon, description = '') {
    this.id = id
    this.name = name
    this.color = color
    this.icon = icon
    this.description = description
  }

  static fromJSON(json) {
    return new InterfaceType(
      json.id,
      json.name,
      json.color,
      json.icon,
      json.description
    )
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      icon: this.icon,
      description: this.description
    }
  }
}

