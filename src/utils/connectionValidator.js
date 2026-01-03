import { areTypesCompatible } from './interfaceCompatibility.js'
import { getInterfaceType } from '../config/defaultInterfaceTypes.js'

/**
 * Validation result
 */
export class ValidationResult {
  constructor(valid, reason = '') {
    this.valid = valid
    this.reason = reason
  }

  static success() {
    return new ValidationResult(true)
  }

  static failure(reason) {
    return new ValidationResult(false, reason)
  }
}

/**
 * Validate a connection between two interfaces
 * Multi-layered validation: type matching → compatibility matrix → custom rules
 */
export function validateConnection(sourceInterface, targetInterface) {
  // Layer 1: Type-based validation (exact match)
  if (sourceInterface.type === targetInterface.type) {
    return ValidationResult.success()
  }

  // Layer 2: Compatibility matrix
  if (areTypesCompatible(sourceInterface.type, targetInterface.type)) {
    // Check custom rules if compatibility passes
    return validateCustomRules(sourceInterface, targetInterface)
  }

  // Layer 3: Check if either interface allows custom connections
  if (sourceInterface.type === 'custom' || targetInterface.type === 'custom') {
    return validateCustomRules(sourceInterface, targetInterface)
  }

  return ValidationResult.failure(
    `Interface type ${sourceInterface.type} is not compatible with ${targetInterface.type}`
  )
}

/**
 * Validate custom rules on interfaces
 */
function validateCustomRules(sourceInterface, targetInterface) {
  // Check source interface custom rules
  if (sourceInterface.validationRules) {
    const sourceResult = checkInterfaceRules(sourceInterface, targetInterface, 'source')
    if (!sourceResult.valid) {
      return sourceResult
    }
  }

  // Check target interface custom rules
  if (targetInterface.validationRules) {
    const targetResult = checkInterfaceRules(targetInterface, sourceInterface, 'target')
    if (!targetResult.valid) {
      return targetResult
    }
  }

  return ValidationResult.success()
}

/**
 * Check validation rules for an interface
 */
function checkInterfaceRules(interfaceObj, otherInterface, role) {
  const rules = interfaceObj.validationRules

  // Check allowed types
  if (rules.allowedTypes && Array.isArray(rules.allowedTypes)) {
    if (!rules.allowedTypes.includes(otherInterface.type)) {
      return ValidationResult.failure(
        `${role} interface does not allow connections to type ${otherInterface.type}`
      )
    }
  }

  // Check blocked types
  if (rules.blockedTypes && Array.isArray(rules.blockedTypes)) {
    if (rules.blockedTypes.includes(otherInterface.type)) {
      return ValidationResult.failure(
        `${role} interface blocks connections to type ${otherInterface.type}`
      )
    }
  }

  // Check custom validator function (if provided as string, would need eval - not recommended)
  // For now, we'll support a simple function reference if needed
  if (rules.customValidator && typeof rules.customValidator === 'function') {
    const result = rules.customValidator(interfaceObj, otherInterface)
    if (!result) {
      return ValidationResult.failure('Custom validation rule failed')
    }
  }

  return ValidationResult.success()
}

/**
 * Validate connection attempt before creating it
 */
export function validateConnectionAttempt(sourceComponent, sourceInterfaceId, targetComponent, targetInterfaceId) {
  const sourceInterface = sourceComponent.getInterface(sourceInterfaceId)
  const targetInterface = targetComponent.getInterface(targetInterfaceId)

  if (!sourceInterface) {
    return ValidationResult.failure(`Source interface ${sourceInterfaceId} not found`)
  }

  if (!targetInterface) {
    return ValidationResult.failure(`Target interface ${targetInterfaceId} not found`)
  }

  // Check direction
  if (!sourceInterface.isOutput()) {
    return ValidationResult.failure('Source interface must be an output')
  }

  if (!targetInterface.isInput()) {
    return ValidationResult.failure('Target interface must be an input')
  }

  // Validate compatibility
  return validateConnection(sourceInterface, targetInterface)
}

