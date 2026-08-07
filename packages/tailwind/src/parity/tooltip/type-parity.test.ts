/**
 * Drives the tooltip-compat type-level drop-in contract (`type-parity.ts`)
 * through the real TypeScript compiler using the shared
 * `tsconfig.type-parity.json`. Diagnostics from files owned by OTHER projects
 * are ignored (they only reflect this program's flag set); any diagnostic in
 * the contract file or the compat sources fails with the compiler's message.
 */
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const tscBin = join(pkgRoot, '..', '..', 'node_modules', '.bin', 'tsc')

describe('tooltip-compat type-level drop-in contract', () => {
  it('legacy Tooltip root/trigger/content/arrow props are covered up to the documented exclusions (tsc)', () => {
    let output = ''
    try {
      output = execFileSync(tscBin, ['-p', 'tsconfig.type-parity.json'], {
        cwd: pkgRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      const failed = error as { stdout?: string; stderr?: string }
      output = `${failed.stdout ?? ''}${failed.stderr ?? ''}`
    }
    const contractDiagnostics = output
      .split('\n')
      .filter((line) => /error TS/.test(line))
      .filter((line) => line.includes('tooltip/type-parity.ts') || line.includes('tooltip-compat'))
    expect(contractDiagnostics, output.slice(0, 4000)).toEqual([])
  }, 120_000)
})
