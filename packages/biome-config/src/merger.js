/**
 * Merges global object values into local object values (generic first-level merge)
 *
 * Performs first-level merging only - merges top-level keys but does not merge
 * nested properties within each key's value. When both global and local define
 * the same key, the local version completely replaces the global version.
 *
 * Works with any object-type option (paths, deniedGlobals, elements, etc.)
 *
 * Special handling:
 * - "off" values: removes that global key from the result
 * - Local precedence: local value completely replaces global for the same key
 *
 * @param {Object} globalValues - Global values from main config
 * @param {Object} localValues - Local values from override (includes marker)
 * @returns {Object} Merged object (marker removed)
 */
function mergeObjectValues(globalValues, localValues) {
  const merged = {}

  // Add all global keys (except those explicitly turned off or overridden)
  for (const [key, globalValue] of Object.entries(globalValues)) {
    const localValue = localValues[key]

    // Skip if explicitly disabled
    if (localValue === 'off') {
      continue
    }

    // Use local value if present, otherwise use global
    merged[key] = localValue !== undefined ? localValue : globalValue
  }

  // Add local-only keys (except marker and "off" values)
  for (const [key, value] of Object.entries(localValues)) {
    const shouldSkip = key === '__INCLUDE_GLOBAL_VALUES__' || key in globalValues || value === 'off'
    if (!shouldSkip) {
      merged[key] = value
    }
  }

  return merged
}

/**
 * Normalizes an item for comparison by sorting object keys
 * This ensures objects with the same properties but different order are treated as equal
 *
 * @param {*} item - Item to normalize (object, primitive, etc.)
 * @returns {string} Normalized JSON string representation
 */
function normalizeForComparison(item) {
  if (typeof item !== 'object' || item === null) {
    return JSON.stringify(item)
  }

  // Sort object keys to ensure consistent serialization
  const sortedKeys = Object.keys(item).sort()
  const normalized = {}
  for (const key of sortedKeys) {
    normalized[key] = item[key]
  }

  return JSON.stringify(normalized)
}

/**
 * Merges global array values into local array values (generic array merge)
 *
 * Concatenates global and local arrays, removing duplicates based on JSON serialization.
 * Works with any array-type option (patterns, etc.)
 *
 * @param {Array} globalValues - Global array from main config
 * @param {Array} localValues - Local array from override (includes marker)
 * @returns {Array} Merged array (marker removed)
 */
function mergeArrayValues(globalValues, localValues) {
  // Filter out marker and deduplicate local values
  const seen = new Set()
  const cleanLocal = []

  for (const item of localValues) {
    if (item === '__INCLUDE_GLOBAL_VALUES__') {
      continue
    }

    const normalized = normalizeForComparison(item)
    if (!seen.has(normalized)) {
      seen.add(normalized)
      cleanLocal.push(item)
    }
  }

  // Add global items that don't already exist in local
  const newItems = globalValues.filter((item) => !seen.has(normalizeForComparison(item)))

  return [...cleanLocal, ...newItems]
}

module.exports = { mergeObjectValues, mergeArrayValues }
