/* eslint-disable import/no-unused-modules */
import fs from 'fs'
import path from 'path'

/**
 * Dynamically generates Vite aliases from TypeScript path mappings in tsconfig.base.json.
 * This ensures Vite understands monorepo package paths without manual configuration.
 *
 * @param tsconfigPath - Path to the tsconfig file. Defaults to ../../tsconfig.base.json relative to this file.
 * @returns Record of alias names to resolved absolute paths
 */
export function getTsconfigAliases(
  tsconfigPath: string = path.resolve(__dirname, '../../../tsconfig.base.json'),
): Record<string, string> {
  const aliases: Record<string, string> = {}

  // Validate tsconfig file exists
  if (!fs.existsSync(tsconfigPath)) {
    throw new Error(`tsconfig file not found at: ${tsconfigPath}`)
  }

  // Read and parse tsconfig file
  let tsconfig: { compilerOptions?: { paths?: Record<string, string[]> } }
  try {
    const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8')
    tsconfig = JSON.parse(tsconfigContent)
  } catch (error) {
    throw new Error(`Failed to read or parse tsconfig at ${tsconfigPath}`, { cause: error })
  }

  // Extract paths from compilerOptions
  const paths: Record<string, string[]> | undefined = tsconfig.compilerOptions?.paths
  if (!paths || typeof paths !== 'object') {
    return aliases
  }

  const tsconfigDir = path.dirname(tsconfigPath)

  for (const [alias, pathMapping] of Object.entries(paths)) {
    if (!Array.isArray(pathMapping) || !pathMapping[0]) {
      continue
    }
    const targetPath = pathMapping[0]
    // Strip wildcard /* from both alias and target if present
    const aliasBase = alias.replace(/\/\*$/, '')
    const targetPathBase = targetPath.replace(/\/\*$/, '')
    // Resolve to absolute path relative to tsconfig directory
    aliases[aliasBase] = path.resolve(tsconfigDir, targetPathBase)
  }

  return aliases
}
