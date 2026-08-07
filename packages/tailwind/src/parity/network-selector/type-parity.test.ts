/**
 * Drives the network-selector type-level drop-in contract (`type-parity.ts`)
 * through the real TypeScript compiler using the shared
 * `tsconfig.type-parity.json`. Diagnostics from files owned by OTHER projects
 * are ignored (they only reflect this program's flag set); any diagnostic in
 * the contract file or the compat sources fails with the compiler's message.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const tscBin = join(pkgRoot, '..', '..', 'node_modules', '.bin', 'tsc')

describe('network-selector compat type-level drop-in contract', () => {
  it('the contract file is actually part of the type-parity program (no vacuous pass)', () => {
    // The driver below can only fail on diagnostics tsc EMITS — a contract
    // file missing from the program's include list would pass silently.
    const tsconfig = readFileSync(join(pkgRoot, 'tsconfig.type-parity.json'), 'utf8')
    expect(tsconfig).toContain('src/parity/network-selector/type-parity.ts')
  })

  it('NetworkFilterV2Props is covered and whole-type assignable (tsc)', () => {
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
      .filter(
        (line) =>
          line.includes('network-selector/type-parity.ts') ||
          line.includes('network-selector-compat') ||
          line.includes('components/network/'),
      )
    expect(contractDiagnostics, output.slice(0, 4000)).toEqual([])
  }, 180_000)
})
