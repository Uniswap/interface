export type HexString = `0x${string}`

/**
 * Converts a number to a hex string
 */
export function numberToHex(number: number): HexString {
  return ensure0xHex(number.toString(16))
}

/**
 * Converts a hex string to a number
 */
export function hexToNumber(hex: string): number {
  if (hex.startsWith('0x')) {
    return parseInt(hex.slice(2), 16)
  }
  return parseInt(hex, 16)
}

/**
 * Ensures that the input string is a valid hex string starting with 0x
 */
export function ensure0xHex(hex: string): `0x${string}` {
  return hex.startsWith('0x') ? (hex as `0x${string}`) : (`0x${hex}` as `0x${string}`)
}

/**
 * Validates that the input string is a valid hex string starting with 0x
 */
export function isValidHexString(value: string): value is `0x${string}` {
  return /^0x[0-9a-fA-F]+$/.test(value)
}
