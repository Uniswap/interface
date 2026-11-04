/**
 * Sanctioned icon type exports (INFRA-3222): `GeneratedIcon` / `IconProps` /
 * `GeneratedIconProps` must be importable from `@universe/mycelium/icons` so
 * receiver components typing an icon slot (`Icon: GeneratedIcon`,
 * `icon?: ComponentType<IconProps>`) have a sanctioned import path — the gap
 * that blocked every `icon-value-reference` receiver repo-wide.
 *
 * Types are erased at runtime, so the exit test spawns `tsc` on a probe file
 * that imports through the package name (exports-map resolution).
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..')

// Temp files live under the repo so module/type resolution sees the real
// node_modules.
const CACHE_ROOT = join(REPO_ROOT, 'node_modules', '.cache')
mkdirSync(CACHE_ROOT, { recursive: true })
const TEMP_ROOT = mkdtempSync(join(CACHE_ROOT, 'icon-type-exports-'))

afterAll(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

function typecheck(source: string): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(TEMP_ROOT, 'case-'))
  const probePath = join(dir, 'probe.tsx')
  writeFileSync(probePath, source)
  const configPath = join(dir, 'tsconfig.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      extends: join(REPO_ROOT, 'config', 'tsconfig', 'app.json'),
      // The harness follows imports into
      // source (no project references), so the barrel closure reaches
      // packages CI checks under their own configs.
      compilerOptions: {
        noEmit: true,
        composite: false,
        noPropertyAccessFromIndexSignature: false,
        types: ['node', 'chrome'],
      },
      // index.d.ts supplies the repo-global JSX namespace, matching app
      // configs; mycelium's global.d.ts supplies the `*.png` module shape the
      // barrel closure needs (Unitag imports its png assets).
      files: [join(REPO_ROOT, 'index.d.ts'), join(REPO_ROOT, 'packages', 'mycelium', 'src', 'global.d.ts'), probePath],
    }),
  )
  const result = spawnSync(join(REPO_ROOT, 'node_modules', '.bin', 'tsc'), ['-p', configPath], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  })
  // Surface a missing/unspawnable tsc readably (Bun.spawnSync throws on
  // ENOENT; node:child_process reports it here instead).
  if (result.error) {
    throw result.error
  }
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` }
}

const TSC_TIMEOUT_MS = 240_000

describe('sanctioned icon type exports (@universe/mycelium/icons, INFRA-3222)', () => {
  it(
    'harness control: a value import from the icons barrel typechecks',
    () => {
      const result = typecheck(
        [
          `import { Heart } from '@universe/mycelium/icons'`,
          '',
          'export function Probe(): JSX.Element {',
          '  return <Heart size={16} />',
          '}',
          '',
        ].join('\n'),
      )
      expect(result.output.trim()).toBe('')
      expect(result.ok).toBe(true)
    },
    TSC_TIMEOUT_MS,
  )

  it(
    'negative control: importing a name the icons barrel must not export fails with TS2305',
    () => {
      const result = typecheck(
        [
          `import type { DefinitelyNotAnIconExport } from '@universe/mycelium/icons'`,
          '',
          'export type Probe = DefinitelyNotAnIconExport',
          '',
        ].join('\n'),
      )
      expect(result.ok).toBe(false)
      expect(result.output).toContain('TS2305')
    },
    TSC_TIMEOUT_MS,
  )

  it(
    'GeneratedIcon / GeneratedIconProps / IconProps import type-only from the icons barrel, and a receiver typed with them accepts a mycelium icon as a value prop',
    () => {
      const result = typecheck(
        [
          `import type { ComponentType } from 'react'`,
          `import type { GeneratedIcon, GeneratedIconProps, IconProps } from '@universe/mycelium/icons'`,
          `import { Heart } from '@universe/mycelium/icons/Heart'`,
          '',
          '// Icon-typed receiver slot: the exact shape the icon-value-reference',
          '// manual-lane bucket needs (`Icon: GeneratedIcon`).',
          'function IconSlot({ Icon }: { Icon: GeneratedIcon }): JSX.Element {',
          '  return <Icon size={16} />',
          '}',
          '',
          '// The looser receiver shape (`icon?: ComponentType<IconProps>`).',
          'function LooseIconSlot({ icon: Icon }: { icon?: ComponentType<IconProps> }): JSX.Element | null {',
          '  return Icon === undefined ? null : <Icon size={16} />',
          '}',
          '',
          'export function Probe(): JSX.Element {',
          '  return (',
          '    <>',
          '      <IconSlot Icon={Heart} />',
          '      <LooseIconSlot icon={Heart} />',
          '    </>',
          '  )',
          '}',
          '',
          '// GeneratedIconProps stays an alias of IconProps.',
          'export const generatedProps: GeneratedIconProps = { size: 16 } satisfies IconProps',
          '',
        ].join('\n'),
      )
      expect(result.output.trim()).toBe('')
      expect(result.ok).toBe(true)
    },
    TSC_TIMEOUT_MS,
  )
})
