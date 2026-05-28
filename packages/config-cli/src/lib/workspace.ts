import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Resolve the monorepo root by walking up from the CLI source location until we find
 * `nx.json`. Anchoring on the source file (not `process.cwd()`) makes the CLI work the
 * same way whether it's invoked via Nx, the package.json scripts, a direct `bun run`.
 *
 * First version relied on NX for managing cwd but NX eats the --env flag.
 */
export function findWorkspaceRoot(): string {
  let dir = dirname(fileURLToPath(import.meta.url))
  while (dir !== dirname(dir)) {
    if (existsSync(join(dir, 'nx.json'))) {
      return dir
    }
    dir = dirname(dir)
  }
  throw new Error('Could not locate workspace root (no nx.json found in any parent of the CLI source)')
}
