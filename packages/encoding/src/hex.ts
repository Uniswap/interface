// A standard EVM-style hex string, prefixed with `0x`
export type HexString = `0x${string}`

/**
 * Encodes a byte array as a lowercase hex string without `0x` prefix.
 *
 * @param bytes - The bytes to encode.
 * @returns The hex-encoded string.
 */
export function uint8ToHex(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return hex
}

/**
 * Decodes a hex string into a byte array. Accepts input with or without a
 * leading `0x` prefix. Throws on odd-length or non-hex characters.
 *
 * @param hex - The hex string to decode.
 * @returns The decoded bytes.
 */
export function hexToUint8(hex: string): Uint8Array<ArrayBuffer> {
  const stripped = hex.startsWith('0x') ? hex.slice(2) : hex
  if (stripped.length % 2 !== 0) {
    throw new Error('hexToUint8: hex string has odd length')
  }
  if (stripped.length > 0 && !/^[0-9a-fA-F]+$/.test(stripped)) {
    throw new Error('hexToUint8: hex string contains non-hex characters')
  }
  const bytes = new Uint8Array(stripped.length / 2)
  for (let i = 0; i < stripped.length; i += 2) {
    bytes[i / 2] = parseInt(stripped.slice(i, i + 2), 16)
  }
  return bytes
}

/**
 * Converts a number to a `0x`-prefixed hex string.
 *
 * @param number - The number to encode.
 * @returns The `0x`-prefixed hex string.
 */
export function numberToHex(number: number): HexString {
  return ensure0xHex(number.toString(16))
}

/**
 * Parses a hex string (with or without `0x` prefix) into a number.
 *
 * @param hex - The hex string to parse.
 * @returns The parsed number.
 */
export function hexToNumber(hex: string): number {
  if (hex.startsWith('0x')) {
    return parseInt(hex.slice(2), 16)
  }
  return parseInt(hex, 16)
}

/**
 * Ensures the input string is prefixed with `0x`.
 *
 * @param hex - The hex string to normalize.
 * @returns The hex string with a guaranteed `0x` prefix.
 */
export function ensure0xHex(hex: string): HexString {
  return hex.startsWith('0x') ? (hex as HexString) : `0x${hex}`
}

/**
 * Type guard: validates that the input is a `0x`-prefixed hex string.
 *
 * @param value - The string to validate.
 * @returns `true` if the input is a `0x`-prefixed hex string.
 */
export function isValidHexString(value: string): value is HexString {
  return /^0x[0-9a-fA-F]+$/.test(value)
}

/**
 * Asserts a value is a `0x`-prefixed hex string and returns it as a typed
 * `HexString`. Throws otherwise. Use this (rather than `ensure0xHex`) when the
 * input comes from an untrusted source: a bare numeric string like `"10"` is
 * ambiguous between decimal 10 and hex `0x10` (= 16), so silently normalizing
 * the prefix risks corrupting the value.
 */
export function parseHex(value: string): HexString {
  if (!isValidHexString(value)) {
    throw new Error(`Invalid hex string: "${value}"`)
  }
  return value
}

export function parseOptionalHex(value: string | undefined): HexString | undefined {
  return value ? parseHex(value) : undefined
}
