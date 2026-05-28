import { ColorTokens } from 'ui/src'

// Cap at $1T — values beyond this indicate a calculation error
export const MAX_REASONABLE_USD_VALUE = 1e12

/**
 * Determines whether a USD value is defined and within a reasonable range,
 * and if so, whether it is positive, negative, or exactly zero.
 *
 * Returns `isPositive: undefined` when the value is missing, unreasonable,
 * or exactly zero (no directional arrow should be shown).
 */
export function getValueSignInfo(value: number | undefined): {
  hasReasonableValue: boolean
  isPositive: boolean | undefined
  arrowColor: ColorTokens | undefined
} {
  const hasReasonableValue = value !== undefined && Math.abs(value) <= MAX_REASONABLE_USD_VALUE

  if (!hasReasonableValue) {
    return { hasReasonableValue, isPositive: undefined, arrowColor: undefined }
  }

  // Exactly zero — treat as neutral (no arrow)
  if (value === 0) {
    return { hasReasonableValue, isPositive: undefined, arrowColor: undefined }
  }

  const isPositive = value > 0
  const arrowColor: ColorTokens = isPositive ? '$statusSuccess' : '$statusCritical'
  return { hasReasonableValue, isPositive, arrowColor }
}
