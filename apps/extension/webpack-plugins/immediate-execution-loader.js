/**
 * Webpack loader to add immediate function calls to entry points.
 * This runs before other transforms, modifying the TypeScript source directly.
 *
 * We need this for the entrypoint-defining code to run in the webpack build, since
 * the default exports are using WXT functions now.
 */

const path = require('path')

/**
 * Escapes special regex characters in a string to make it safe for use in RegExp constructor
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Map of entry point files to their immediate execution functions
const ENTRY_FUNCTIONS = {
  'background.ts': 'makeBackground',
  'injected.content.ts': 'makeInjected',
  'ethereum.content.ts': 'makeEthereum',
}

module.exports = function immediateExecutionLoader(source) {
  const filename = path.basename(this.resourcePath)
  const functionName = ENTRY_FUNCTIONS[filename]

  if (!functionName) {
    // Not an entry point we care about, return source unchanged
    return source
  }

  console.log(`🔧 Processing ${filename} for immediate ${functionName}() execution`)

  // Check if we've already added the immediate call
  if (source.includes('// Webpack entry point - execute immediately')) {
    console.log(`ℹ️  ${filename} already has immediate execution`)
    return source
  }

  // Check if the function exists in the source
  const functionRegex = new RegExp(`function\\s+${escapeRegExp(functionName)}\\s*\\(`)
  if (!functionRegex.test(source)) {
    console.log(`⚠️  Function ${functionName} not found in ${filename}`)
    return source
  }

  // Find the export default defineBackground/defineContentScript and insert before it
  const exportRegex = /export\s+default\s+define(?:Background|ContentScript)/
  const exportMatch = source.match(exportRegex)

  if (exportMatch) {
    const insertPosition = exportMatch.index
    const modifiedSource =
      source.slice(0, insertPosition) +
      `// Webpack entry point - execute immediately\n${functionName}();\n\n` +
      source.slice(insertPosition)

    console.log(`✅ Added immediate ${functionName}() call to ${filename}`)
    return modifiedSource
  } else {
    console.log(`⚠️  Could not find export default in ${filename}, appending to end`)
    const modifiedSource = source + `\n\n// Webpack entry point - execute immediately\n${functionName}();\n`
    return modifiedSource
  }
}
