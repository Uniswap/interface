export const numericInputRegex = RegExp('^\\d*(\\.\\d*)?$') // Matches only numeric values without commas

/** Returns true if the value matches a number or an empty string */
export function numericInputEnforcer(value?: string): boolean {
  return !value || numericInputRegex.test(value)
}

/** `numericInputEnforcer`, also taking ∞ as a range's unbounded edge. */
export function numericInputEnforcerWithInfinity(value?: string): boolean {
  return numericInputEnforcer(value) || value === '∞'
}
