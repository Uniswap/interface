const { mergeObjectValues, mergeArrayValues } = require('./merger')

/**
 * Processes the entire config, resolving markers in all overrides
 * @param {Object} baseConfig - The base configuration with overrides
 * @param {Map<string, any>} globalRules - Map of global rule paths to values
 * @returns {Object} Configuration with markers resolved
 */
function processConfig(baseConfig, globalRules) {
  // Deep clone to avoid mutating original
  const config = structuredClone(baseConfig)

  // Process each override section
  if (Array.isArray(config.overrides)) {
    config.overrides = config.overrides.map((override) => processOverride(override, globalRules))
  } else if (config.overrides) {
    throw new Error('`overrides` must be an array')
  }

  return config
}

/**
 * Processes a single override, detecting and resolving __INCLUDE_GLOBAL_VALUES__ markers
 * @param {Object} override - Override configuration section
 * @param {Map<string, any>} globalRules - Map of global rule paths to values
 * @returns {Object} Processed override with markers resolved
 */
function processOverride(override, globalRules) {
  if (!override.linter?.rules) {
    return override
  }

  // Deep clone to avoid mutation
  const processed = structuredClone(override)

  /**
   * Recursively walks override rules tree to find and resolve markers
   * @param {Object} obj - Current object being walked
   * @param {Array<string>} pathParts - Path components leading to this object
   */
  function walkAndMerge(obj, pathParts) {
    if (!obj || typeof obj !== 'object') {
      return
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...pathParts, key]

      // Check if this is a rule's options object with potential markers
      if (key === 'options' && value && typeof value === 'object') {
        const rulePath = pathParts.join('.')
        const globalRule = globalRules.get(rulePath)

        // Process each option key generically
        for (const [optionKey, optionValue] of Object.entries(value)) {
          const globalOptionValue = globalRule?.options?.[optionKey]

          // Check for marker in object-type options
          const isObjectWithMarker =
            optionValue &&
            typeof optionValue === 'object' &&
            !Array.isArray(optionValue) &&
            optionValue.__INCLUDE_GLOBAL_VALUES__

          if (isObjectWithMarker) {
            obj[key][optionKey] = mergeObjectValues(globalOptionValue || {}, optionValue)
          }

          // Check for marker in array-type options
          const isArrayWithMarker = Array.isArray(optionValue) && optionValue.includes('__INCLUDE_GLOBAL_VALUES__')

          if (isArrayWithMarker) {
            obj[key][optionKey] = mergeArrayValues(globalOptionValue || [], optionValue)
          }
        }
      }

      // Continue walking nested objects
      if (typeof value === 'object' && value !== null) {
        walkAndMerge(value, currentPath)
      }
    }
  }

  walkAndMerge(processed.linter.rules, ['linter', 'rules'])
  return processed
}

module.exports = { processConfig, processOverride }
