/**
 * Drives the type-level drop-in contract (`type-parity.ts`) through the real
 * TypeScript compiler using `tsconfig.type-parity.json`.
 *
 * The program pulls `ui/src` (Tamagui) and mycelium sources in from source,
 * so files owned by OTHER projects can report diagnostics that only reflect
 * this program's flag set, not their own build (e.g. global type libs their
 * own tsconfig wires up). Those are ignored; any diagnostic in the contract
 * file itself — uncovered keys, degraded FlexProps resolution, value-level
 * incompatibility — fails this test with the compiler's message.
 */
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const pkgRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const tscBin = join(pkgRoot, '..', '..', 'node_modules', '.bin', 'tsc')

describe('FlexCompat type-level drop-in contract', () => {
  it('FlexProps is covered up to the documented exclusions (tsc)', () => {
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
      .filter((line) => line.includes('type-parity.ts') || line.includes('flex-compat') || line.includes('Flex.tsx'))
    expect(contractDiagnostics, output.slice(0, 4000)).toEqual([])
  }, 120_000)
})
