/**
 * Extracts all rule values from main linter config into a path-keyed lookup map
 * @param {Object} mainConfig - The main linter configuration object
 * @returns {Map<string, any>} Map of rule paths (e.g., "linter.rules.style.noRestrictedImports") to their values
 */
function extractGlobalRuleValues(mainConfig) {
  const ruleMap = new Map()

  /**
   * Recursively walks rules tree to extract all rule configurations
   * @param {Object} obj - Current object being walked
   * @param {Array<string>} pathParts - Path components leading to this object
   */
  function walkRules(obj, pathParts) {
    if (!obj || typeof obj !== 'object') {
      return
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = [...pathParts, key]
      const pathString = currentPath.join('.')

      // Store this rule value if it looks like a rule configuration
      // Rules have a "level" property, or are "off"/"error"/"warn" strings
      if (value && typeof value === 'object' && (value.level || value.options)) {
        ruleMap.set(pathString, value)
      }

      // Continue walking nested objects (but not arrays)
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        walkRules(value, currentPath)
      }
    }
  }

  // Start walking from linter.rules
  if (mainConfig.linter?.rules) {
    walkRules(mainConfig.linter.rules, ['linter', 'rules'])
  }

  return ruleMap
}

module.exports = { extractGlobalRuleValues }
