const { mergeObjectValues, mergeArrayValues } = require('./merger')
const {
  detectUniversePackages,
  generateUniversePackageOverrides,
  getGlobalRestrictedImportPatterns,
} = require('./universePackages')

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
    const processedOverrides = []

    // First pass: expand markers that generate multiple overrides
    for (const override of config.overrides) {
      if (override === '__AUTO_GENERATE_UNIVERSE_OVERRIDES__') {
        const generatedOverrides = expandUniverseOverridesMarker(config)
        processedOverrides.push(...generatedOverrides)
      } else {
        processedOverrides.push(override)
      }
    }

    // Second pass: process each override to resolve __INCLUDE_GLOBAL_VALUES__ markers
    config.overrides = processedOverrides.map((override) =>
      override.linter?.rules ? resolveIncludeGlobalValuesMarkers(override, globalRules) : override,
    )
  } else if (config.overrides) {
    throw new Error('`overrides` must be an array')
  }

  return config
}

/**
 * Expands __AUTO_GENERATE_UNIVERSE_OVERRIDES__ marker into actual override configurations
 * @param {Object} baseConfig - The base configuration (needed to extract global patterns)
 * @returns {Array<Object>} Array of generated override configurations
 */
function expandUniverseOverridesMarker(baseConfig) {
  const universePackages = detectUniversePackages()
  const globalPatterns = getGlobalRestrictedImportPatterns(baseConfig)
  const generatedOverrides = generateUniversePackageOverrides(universePackages, globalPatterns)

  console.log(`✓ Auto-generated ${generatedOverrides.length} override(s) for @universe/* packages`)

  return generatedOverrides
}

/**
 * Resolves __INCLUDE_GLOBAL_VALUES__ markers in an override's rule options
 * @param {Object} override - Override configuration section
 * @param {Map<string, any>} globalRules - Map of global rule paths to values
 * @returns {Object} Processed override with markers resolved
 */
function resolveIncludeGlobalValuesMarkers(override, globalRules) {
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

module.exports = { processConfig }
