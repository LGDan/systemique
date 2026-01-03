/**
 * Connection - Links between component interfaces
 */
export class Connection {
  constructor(id, sourceComponentId, sourceInterfaceId, targetComponentId, targetInterfaceId, metadata = {}) {
    this.id = id
    this.sourceComponentId = sourceComponentId
    this.sourceInterfaceId = sourceInterfaceId
    this.targetComponentId = targetComponentId
    this.targetInterfaceId = targetInterfaceId
    this.metadata = metadata
    this.validated = false
  }

  static fromJSON(json) {
    const conn = new Connection(
      json.id,
      json.sourceComponentId,
      json.sourceInterfaceId,
      json.targetComponentId,
      json.targetInterfaceId,
      json.metadata || {}
    )
    conn.validated = json.validated || false
    return conn
  }

  toJSON() {
    return {
      id: this.id,
      sourceComponentId: this.sourceComponentId,
      sourceInterfaceId: this.sourceInterfaceId,
      targetComponentId: this.targetComponentId,
      targetInterfaceId: this.targetInterfaceId,
      metadata: this.metadata,
      validated: this.validated
    }
  }

  // Convert to vue-flow edge format
  toEdge() {
    return {
      id: this.id,
      source: this.sourceComponentId,
      target: this.targetComponentId,
      sourceHandle: this.sourceInterfaceId,
      targetHandle: this.targetInterfaceId,
      data: {
        sourceInterfaceId: this.sourceInterfaceId,
        targetInterfaceId: this.targetInterfaceId,
        metadata: this.metadata
      }
    }
  }
}

