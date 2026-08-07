/**
 * Icon deep-import contract (INFRA-2957, icons from INFRA-2956): the codemod
 * emits `@universe/mycelium/icons/<Name>` deep imports — deep paths win
 * because Metro does not tree-shake, so mobile cannot afford barrel-only icon
 * imports. This suite proves the emitted specifier resolves and typechecks
 * against the real mycelium package instead of assuming it.
 *
 * The contract test arms itself via a resolution probe: until the mycelium
 * icons land with a deep-path export surface (#37014), it reports as skipped
 * with the coupling named; once the specifier resolves it runs for real.
 * Run with `bun test scripts/tamagui-migration`
 */
import { describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MYCELIUM_BARREL, MYCELIUM_ICON_PREFIX } from './rules'

const REPO_ROOT = join(import.meta.dir, '..', '..', '..')
const CONTRACT_SPECIFIER = `${MYCELIUM_ICON_PREFIX}AlertTriangle`
const EXPECTED_FIXTURE = join(import.meta.dir, 'fixtures', 'convert-icon-deep', 'expected.tsx')

// Temp files live under the repo so module/type resolution sees the real node_modules
function makeTempDir(): string {
  const cacheRoot = join(REPO_ROOT, 'node_modules', '.cache')
  mkdirSync(cacheRoot, { recursive: true })
  return mkdtempSync(join(cacheRoot, 'icon-contract-'))
}

function typecheck(files: string[]): { ok: boolean; output: string } {
  const dir = makeTempDir()
  const configPath = join(dir, 'tsconfig.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      extends: join(REPO_ROOT, 'config', 'tsconfig', 'app.json'),
      // This harness follows imports into source (no project references), so
      // the mycelium barrel's closure reaches packages that CI checks under
      // their own configs — mirror the flags those packages rely on:
      // packages/config disables noPropertyAccessFromIndexSignature and
      // packages/environment needs the chrome types.
      compilerOptions: {
        noEmit: true,
        composite: false,
        noPropertyAccessFromIndexSignature: false,
        types: ['node', 'chrome'],
      },
      // index.d.ts supplies the repo-global JSX namespace, matching app configs
      files: [join(REPO_ROOT, 'index.d.ts'), ...files],
    }),
  )
  const result = Bun.spawnSync([join(REPO_ROOT, 'node_modules', '.bin', 'tsc'), '-p', configPath], { cwd: REPO_ROOT })
  return { ok: result.exitCode === 0, output: result.stdout.toString() + result.stderr.toString() }
}

function resolves(specifier: string): boolean {
  try {
    Bun.resolveSync(specifier, REPO_ROOT)
    return true
  } catch {
    return false
  }
}

describe('mycelium icon deep-import contract', () => {
  test('typecheck harness resolves the real mycelium package', () => {
    const sanityFile = join(makeTempDir(), 'sanity.ts')
    writeFileSync(sanityFile, `import { cn } from '${MYCELIUM_BARREL}'\n\nexport const merged: string = cn('a', 'b')\n`)
    const result = typecheck([sanityFile])
    expect(result.output.trim()).toBe('')
    expect(result.ok).toBe(true)
  })

  test('typecheck harness compiles fixture-shaped JSX', () => {
    const jsxFile = join(makeTempDir(), 'probe.tsx')
    writeFileSync(jsxFile, `export function Box(): JSX.Element {\n  return <div data-probe />\n}\n`)
    const result = typecheck([jsxFile])
    expect(result.output.trim()).toBe('')
    expect(result.ok).toBe(true)
  })

  if (resolves(CONTRACT_SPECIFIER)) {
    test('emitted deep icon import typechecks against @universe/mycelium', () => {
      const result = typecheck([EXPECTED_FIXTURE])
      expect(result.output.trim()).toBe('')
      expect(result.ok).toBe(true)
    })
  } else {
    test.skip(`emitted deep icon import typechecks against @universe/mycelium (blocked: '${CONTRACT_SPECIFIER}' does not resolve yet — needs the mycelium icons deep-path export from #37014 / INFRA-2956)`, () => {})
  }
})
