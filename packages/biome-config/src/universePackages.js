const { readCachedProjectGraph, readProjectsConfigurationFromProjectGraph } = require('@nx/devkit')
const path = require('node:path')

/**
 * Detects all @universe/* packages using NX project graph
 * @returns {Array<{dir: string, name: string, fullName: string}>} Array of package info objects
 */
function detectUniversePackages() {
  try {
    // Read the NX project graph (cached for performance)
    const projectGraph = readCachedProjectGraph()
    const projectsConfig = readProjectsConfigurationFromProjectGraph(projectGraph)

    const universePackages = []

    // Iterate through all projects in the workspace
    for (const [projectName, config] of Object.entries(projectsConfig.projects)) {
      // NX project names are the same as package names (from package.json)
      if (projectName.startsWith('@universe/')) {
        // Extract the package name without @universe/ prefix
        const shortName = projectName.replace('@universe/', '')

        // Extract directory name from root path (e.g., "packages/api" -> "api")
        const dir = path.basename(config.root)

        universePackages.push({
          dir,
          name: shortName,
          fullName: projectName,
        })
      }
    }

    return universePackages
  } catch (error) {
    console.warn(`Warning: Could not read project graph: ${error.message}`)
    console.warn('Falling back to empty package list')
    return []
  }
}

/**
 * Generates override configurations for @universe/* packages
 * Each package gets an override that:
 * - Applies to files within that package
 * - Allows the package to deep-import into itself
 *
 * @param {Array<{dir: string, name: string, fullName: string}>} universePackages - Detected packages
 * @param {Array<Object>} globalPatterns - Global restriction patterns
 * @returns {Array<Object>} Array of override configurations
 */
function generateUniversePackageOverrides(universePackages, globalPatterns) {
  const overrides = []

  for (const pkg of universePackages) {
    // For each @universe/* package, we need to:
    // 1. Allow deep imports to ITSELF (@universe/api can use @universe/api/src/...)
    // 2. Block deep imports to OTHER @universe/* packages
    //
    // Strategy: Replace the wildcard pattern @universe/*/src with explicit patterns
    // for all OTHER packages (excluding the current package)

    const filteredPatterns = globalPatterns
      .map((pattern) => {
        if (!pattern.group || !Array.isArray(pattern.group)) {
          return pattern // Keep non-group patterns as-is
        }

        // Check if this is the @universe/* wildcard pattern
        const hasUniverseWildcard = pattern.group.some(
          (g) => g.includes('@universe/*/src') || g === '@universe/*/src/*',
        )

        if (!hasUniverseWildcard) {
          return pattern // Keep other patterns unchanged
        }

        // Replace wildcard with explicit patterns for OTHER @universe/* packages
        const otherPackages = universePackages.filter((p) => p.name !== pkg.name)
        const explicitGroup = []

        for (const otherPkg of otherPackages) {
          explicitGroup.push(`@universe/${otherPkg.name}/src`)
          explicitGroup.push(`@universe/${otherPkg.name}/src/*`)
        }

        // Return new pattern with explicit group (or empty if no other packages)
        return explicitGroup.length > 0
          ? {
              ...pattern,
              group: explicitGroup,
            }
          : null // Will be filtered out below
      })
      .filter((p) => p !== null) // Remove null entries

    const override = {
      includes: [
        `packages/${pkg.dir}/**`,
        `!packages/${pkg.dir}/.eslintrc.js`,
        `!packages/${pkg.dir}/**/__generated__/**`,
        `!packages/${pkg.dir}/scripts/**`,
      ],
      linter: {
        rules: {
          style: {
            noRestrictedImports: {
              level: 'error',
              options: {
                paths: {
                  __INCLUDE_GLOBAL_VALUES__: true,
                },
                patterns: filteredPatterns,
              },
            },
          },
        },
      },
    }

    overrides.push(override)
  }

  return overrides
}

/**
 * Gets the global noRestrictedImports patterns from the config
 * @param {Object} config - The base configuration
 * @returns {Array<Object>} Array of pattern objects
 */
function getGlobalRestrictedImportPatterns(config) {
  const patterns = config?.linter?.rules?.style?.noRestrictedImports?.options?.patterns

  if (!Array.isArray(patterns)) {
    return []
  }

  return patterns
}

module.exports = {
  detectUniversePackages,
  generateUniversePackageOverrides,
  getGlobalRestrictedImportPatterns,
}
