/**
 *  Taken from https://github.com/Uniswap/tamperproof-transactions/blob/main/src/utils/canonicalJson.ts
 *  Can be removed if we decide to use the tamperproof-transactions package.
 */

export type JsonPrimitive = null | boolean | number | string
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type RequestPayload<Params = Record<string, unknown>> = {
  method: string
  params: Params
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

/**
 * Canonicalizes a JSON-like value to enable deterministic serialization.
 *
 * - Sorts object keys lexicographically
 * - Drops properties with undefined values
 * - Recursively processes objects and arrays (preserving array order)
 * - Leaves primitives and non-plain objects unchanged
 *
 * Used by `canonicalStringify` and `serializeRequestPayload` to produce stable
 * byte sequences for cryptographic signing and verification.
 */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => canonicalize(item))
  }

  if (isPlainObject(value)) {
    const sortedKeys = Object.keys(value).sort()
    const result: Record<string, unknown> = {}
    for (const key of sortedKeys) {
      const v = value[key]
      if (v === undefined) {
        continue // drop undefined values
      }
      result[key] = canonicalize(v)
    }
    return result
  }

  // For primitives (including null) and non-plain objects, return as-is
  return value
}

export function canonicalStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

export function serializeRequestPayload<T>(requestPayload: T): Uint8Array {
  return new TextEncoder().encode(canonicalStringify(requestPayload))
}
