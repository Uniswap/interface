/**
 * Run with `bun test config/oxlint-plugins/no-tamagui-styling.test.ts`
 *
 * Colocated tests for `universe-custom/no-tamagui-styling` (rule module:
 * no-tamagui-styling.js, registered by universe-custom.js — the harness lints
 * through that registration, i.e. the exact wiring CI uses). There is no
 * ESLint RuleTester in this repo, so these drive the real oxlint binary over
 * generated fixtures.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const PLUGIN_PATH = join(import.meta.dir, 'universe-custom.js')
const OXLINT_BIN = join(REPO_ROOT, 'node_modules/.bin/oxlint')

interface Diagnostic {
  message: string
}

let fixtureRoot: string

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'no-tamagui-styling-'))
})

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true })
})

function lintFixture({
  source,
  baseline,
  parentDir,
}: {
  source: string
  baseline?: Record<string, { styled?: number; animation?: number; group?: number }>
  /** Where to place the fixture; defaults to a temp dir outside the repo. */
  parentDir?: string
}): Diagnostic[] {
  const dir = mkdtempSync(join(parentDir ?? fixtureRoot, 'case-'))
  const filePath = join(dir, 'Fixture.tsx')
  writeFileSync(filePath, source)

  const baselinePath = join(dir, 'baseline.json')
  // Fixture files live outside the repo root, so the rule keys them by
  // absolute path; `SELF` lets cases reference the fixture file.
  const files = Object.fromEntries(
    Object.entries(baseline ?? {}).map(([key, value]) => [key === 'SELF' ? filePath : key, value]),
  )
  writeFileSync(baselinePath, JSON.stringify({ files }))

  const configPath = join(dir, '.oxlintrc.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      plugins: [],
      categories: { correctness: 'off' },
      jsPlugins: [PLUGIN_PATH],
      rules: { 'universe-custom/no-tamagui-styling': 'error' },
    }),
  )

  const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
    cwd: dir,
    env: { ...process.env, TAMAGUI_BASELINE: baselinePath },
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const stdout = result.stdout.toString()
  // 0 = clean, 1 = diagnostics found; anything else means oxlint itself failed
  // (e.g. plugin load error), which would let negative cases pass vacuously.
  if (result.exitCode !== 0 && result.exitCode !== 1) {
    throw new Error(`oxlint exited with ${result.exitCode} (stderr: ${result.stderr.toString()})`)
  }
  let parsed: { diagnostics?: Diagnostic[] }
  try {
    parsed = JSON.parse(stdout) as { diagnostics?: Diagnostic[] }
  } catch (error) {
    throw new Error(`oxlint did not emit JSON (stderr: ${result.stderr.toString()})`, { cause: error })
  }
  return (parsed.diagnostics ?? []).filter((d) => /Tamagui/.test(d.message))
}

const NEW_TAMAGUI_FIXTURE = `
import { Flex, styled } from 'ui/src'

const Card = styled(Flex, { backgroundColor: '$surface2' })

export function Fixture(): JSX.Element {
  return (
    <Card animation="quick" $group-hover={{ opacity: 1 }}>
      <Flex {...({ '$group-item-hover': { opacity: 0.5 } } as const)} />
    </Card>
  )
}
`

describe('no-tamagui-styling', () => {
  test('fires on new styled(), animation preset, and $group-* usage (JSX prop and object key)', () => {
    const diagnostics = lintFixture({ source: NEW_TAMAGUI_FIXTURE })
    expect(diagnostics.filter((d) => d.message.includes('styled() calls are banned'))).toHaveLength(1)
    expect(diagnostics.filter((d) => d.message.includes('animation preset prop'))).toHaveLength(1)
    expect(diagnostics.filter((d) => d.message.includes('$group-* prop'))).toHaveLength(2)
  })

  test('stays silent for a fully baselined file', () => {
    const diagnostics = lintFixture({
      source: NEW_TAMAGUI_FIXTURE,
      baseline: { SELF: { styled: 1, animation: 1, group: 2 } },
    })
    expect(diagnostics).toHaveLength(0)
  })

  test('fires only beyond the baseline count', () => {
    const source = `
import { Flex, styled } from 'ui/src'
const A = styled(Flex, {})
const B = styled(Flex, {})
`
    const diagnostics = lintFixture({ source, baseline: { SELF: { styled: 1 } } })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('styled() calls are banned')
  })

  test('stays silent on plain Flex/Text/View layout usage', () => {
    const source = `
import { Flex, Text, View } from 'ui/src'

export function Fixture({ label }: { label: string }): JSX.Element {
  return (
    <View flexGrow={1}>
      <Flex row gap="$spacing8" backgroundColor="$surface1" hoverStyle={{ opacity: 0.8 }}>
        <Text variant="body2">{label}</Text>
      </Flex>
    </View>
  )
}
`
    expect(lintFixture({ source })).toHaveLength(0)
  })

  test('ignores styled() from non-Tamagui sources', () => {
    const source = `
import { styled } from 'some-other-styling-lib'
const Box = styled('div')
`
    expect(lintFixture({ source })).toHaveLength(0)
  })

  test('exempts migration tooling paths via the shared exemption list', () => {
    // Must live inside the repo so the rule sees a repo-relative path that
    // matches config/oxlint-plugins/tamagui-migration-exempt-paths.json.
    const exemptParent = join(REPO_ROOT, 'scripts/tamagui-migration')
    const dir = mkdtempSync(join(exemptParent, 'tmp-exempt-'))
    try {
      const diagnostics = lintFixture({ source: NEW_TAMAGUI_FIXTURE, parentDir: dir })
      expect(diagnostics).toHaveLength(0)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  test('exemption prefixes stop at directory boundaries', () => {
    // `scripts/tamagui-census` is listed without a trailing slash — it must
    // exempt its own subtree but never siblings like scripts/tamagui-census-foo.
    const censusRoot = join(REPO_ROOT, 'scripts/tamagui-census')
    const siblingDir = join(REPO_ROOT, 'scripts/tamagui-census-foo')
    const censusPreexisted = existsSync(censusRoot)
    mkdirSync(join(censusRoot, 'fixtures'), { recursive: true })
    mkdirSync(siblingDir, { recursive: true })
    const exemptTmp = mkdtempSync(join(censusRoot, 'fixtures', 'tmp-exempt-'))
    try {
      expect(lintFixture({ source: NEW_TAMAGUI_FIXTURE, parentDir: exemptTmp })).toHaveLength(0)
      expect(lintFixture({ source: NEW_TAMAGUI_FIXTURE, parentDir: siblingDir }).length).toBeGreaterThan(0)
    } finally {
      rmSync(siblingDir, { recursive: true, force: true })
      rmSync(censusPreexisted ? exemptTmp : censusRoot, { recursive: true, force: true })
    }
  })

  test('fires on object-form animation with an animation-family sibling key', () => {
    const source = `
import { Flex } from 'ui/src'

const animationProps = { animation: 'quick', enterStyle: { opacity: 0 } }

export function Fixture(): JSX.Element {
  return <Flex {...animationProps} />
}
`
    const diagnostics = lintFixture({ source })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('animation preset prop')
  })

  test('stays silent on CSS animation shorthand objects without animation-family siblings', () => {
    const source = `
export const spinnerStyle = { animation: 'spin 1s linear infinite', display: 'inline-block' }
`
    expect(lintFixture({ source })).toHaveLength(0)
  })

  test('stays silent on react-navigation screen options without animation-family siblings', () => {
    const source = `
export const screenOptions = { animation: 'slide_from_right', headerShown: false }
`
    expect(lintFixture({ source })).toHaveLength(0)
  })

  test('ignores animateOnly, $group-* destructuring, and $group-* type references', () => {
    const source = `
import { Flex, type FlexProps } from 'ui/src'

type Props = Pick<FlexProps, '$group-item-hover'>

export function Fixture(props: Props): JSX.Element {
  const { '$group-item-hover': groupItemHover } = props
  return <Flex animateOnly={['transform', 'opacity']} opacity={groupItemHover ? 1 : 0} />
}
`
    expect(lintFixture({ source })).toHaveLength(0)
  })
})
