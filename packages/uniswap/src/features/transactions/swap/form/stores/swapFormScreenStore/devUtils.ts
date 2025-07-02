import { logger } from 'utilities/src/logger/logger'

// Without this, we'll get errors when serializing the store state because of circular references and properties with the value of BigInt
export const stateReplacerSerializer = (_key: string, value: unknown): unknown => {
  const MAX_DEPTH = 10
  const visited = new WeakSet<object>()

  const processValue = (val: unknown, depth = 0): unknown => {
    if (depth > MAX_DEPTH) {
      return '[Max Depth Reached]'
    }
    if (typeof val === 'bigint') {
      return val.toString() + 'n'
    }
    if (!val || typeof val !== 'object') {
      return val
    }

    // Skip DOM elements and React fibers
    if ('nodeType' in val || '_reactInternalInstance' in val || '__reactFiber$' in val) {
      return '[DOM Element]'
    }

    if (visited.has(val)) {
      return '[Circular]'
    }
    visited.add(val)

    if (Array.isArray(val)) {
      return val.slice(0, 100).map((item: unknown) => processValue(item, depth + 1))
    }

    const result: Record<string, unknown> = {}

    const totalEntries = Object.entries(val)

    // From debugging, the most I've seen is 40 entries
    // So, 50 is a 'safe' number
    const NUM_ENTRIES_TO_SERIALIZE = 50

    if (totalEntries.length > NUM_ENTRIES_TO_SERIALIZE) {
      logger.warn(
        'devUtils.ts',
        'stateReplacerSerializer',
        `We're only serializing the first ${NUM_ENTRIES_TO_SERIALIZE} entries of a total of ${totalEntries.length} entries`,
      )
    }

    const entries = totalEntries.slice(0, NUM_ENTRIES_TO_SERIALIZE)

    for (const [k, v] of entries) {
      result[k] = processValue(v, depth + 1)
    }
    return result
  }

  return processValue(value)
}

export const stateReviverDeserializer = (_key: string, value: unknown): unknown => {
  if (typeof value === 'string' && value.endsWith('n')) {
    return BigInt(value.slice(0, -1))
  }
  return value
}
