/* eslint-disable @typescript-eslint/no-unsafe-return */
/**
 * BigInt serialization utilities for JSON
 *
 * These utilities allow BigInt values to be safely serialized to and deserialized from JSON.
 * BigInt values are converted to strings with a special prefix during serialization,
 * and converted back to BigInt during deserialization.
 */

const BIGINT_PREFIX = '__bigint__:' as const

/**
 * Serializes a value to JSON string, converting BigInt values to strings with a prefix.
 *
 * @param value - The value to serialize
 * @param replacer - Optional replacer function to apply before BigInt handling
 * @param space - Optional number of spaces for indentation
 * @returns JSON string with BigInt values serialized as prefixed strings
 *
 * @example
 * const data = { amount: 123456789012345678901234567890n, name: 'Test' }
 * const json = jsonStringify(data)
 * // Returns: '{"amount":"__bigint__:123456789012345678901234567890","name":"Test"}'
 *
 * @example
 * // With spacing
 * const json = jsonStringify(data, undefined, 2)
 *
 * @example
 * // With custom replacer
 * const json = jsonStringify(data, (key, val) => key === 'secret' ? '[REDACTED]' : val)
 */
// eslint-disable-next-line max-params -- match JSON.stringify parameters
export function jsonStringify(
  value: unknown,
  replacer?: (key: string, value: unknown) => unknown,
  space?: number,
): string {
  return JSON.stringify(
    value,
    (key, val) => {
      // Apply custom replacer first if provided
      const processedVal = replacer ? replacer(key, val) : val
      // Then handle BigInt conversion
      return typeof processedVal === 'bigint' ? `${BIGINT_PREFIX}${processedVal.toString()}` : processedVal
    },
    space,
  )
}

/**
 * Parses a JSON string, converting prefixed BigInt strings back to BigInt values.
 *
 * @param text - The JSON string to parse
 * @param reviver - Optional reviver function to apply after BigInt handling
 * @returns Parsed value with BigInt values restored
 *
 * @example
 * const json = '{"amount":"__bigint__:123456789012345678901234567890","name":"Test"}'
 * const data = jsonParse<{ amount: bigint, name: string }>(json)
 * // Returns: { amount: 123456789012345678901234567890n, name: 'Test' }
 */
export function jsonParse<T = unknown>(text: string, reviver?: (key: string, value: unknown) => unknown): T {
  return JSON.parse(text, (key, val) => {
    // Handle BigInt conversion first
    let processedVal = val
    if (typeof val === 'string' && val.startsWith(BIGINT_PREFIX)) {
      try {
        processedVal = BigInt(val.slice(BIGINT_PREFIX.length))
      } catch (e) {
        throw new Error(`Invalid BigInt value: ${val}`, { cause: e })
      }
    }
    // Then apply custom reviver if provided
    return reviver ? reviver(key, processedVal) : processedVal
  })
}
