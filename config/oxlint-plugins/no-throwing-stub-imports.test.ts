/**
 * Run with `bun test config/oxlint-plugins/no-throwing-stub-imports.test.ts`
 *
 * Colocated tests for `universe-custom/no-throwing-stub-imports` (rule module:
 * no-throwing-stub-imports.js, registered by universe-custom.js — the harness
 * lints through that registration, i.e. the exact wiring CI uses). There is no
 * ESLint RuleTester in this repo, so these drive the real oxlint binary over
 * generated fixtures.
 *
 * Cases marked "real manifest" run against the checked-in
 * packages/mycelium/platform-legs.json so they pin today's leg statuses; the
 * mechanics cases use a fixture manifest so they survive future status flips.
 */
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const PLUGIN_PATH = join(import.meta.dir, 'universe-custom.js')
const OXLINT_BIN = join(REPO_ROOT, 'node_modules/.bin/oxlint')
const REAL_MANIFEST_PATH = join(REPO_ROOT, 'packages/mycelium/platform-legs.json')

interface Diagnostic {
  message: string
}

interface FixtureManifestEntry {
  web?: string
  native?: string
  webNote?: string
  nativeNote?: string
  namedExports?: Record<string, { web?: string; native?: string; webNote?: string; nativeNote?: string }>
}

let fixtureRoot: string

beforeAll(() => {
  fixtureRoot = mkdtempSync(join(tmpdir(), 'no-throwing-stub-imports-'))
})

afterAll(() => {
  rmSync(fixtureRoot, { recursive: true, force: true })
})

function lintFixture({
  source,
  platform,
  manifest,
  fileName = 'Fixture.tsx',
}: {
  source: string
  platform: 'web' | 'native' | 'both'
  /** Entry-point map for a fixture manifest; omit to lint against the real checked-in manifest. */
  manifest?: Record<string, FixtureManifestEntry>
  fileName?: string
}): Diagnostic[] {
  const dir = mkdtempSync(join(fixtureRoot, 'case-'))
  const filePath = join(dir, fileName)
  writeFileSync(filePath, source)

  let manifestPath = REAL_MANIFEST_PATH
  if (manifest) {
    manifestPath = join(dir, 'platform-legs.json')
    writeFileSync(manifestPath, JSON.stringify({ entryPoints: manifest }))
  }

  const configPath = join(dir, '.oxlintrc.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      plugins: [],
      categories: { correctness: 'off' },
      jsPlugins: [PLUGIN_PATH],
      rules: { 'universe-custom/no-throwing-stub-imports': ['error', { platform }] },
    }),
  )

  const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
    cwd: dir,
    env: { ...process.env, MYCELIUM_PLATFORM_LEGS: manifestPath },
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
  return (parsed.diagnostics ?? []).filter((d) => /Wrong-platform mycelium import/.test(d.message))
}

describe('no-throwing-stub-imports', () => {
  // The 2026-08-12 /positions incident (PR #39180, reverted by #39448):
  // apps/web/src/features/Liquidity/PositionsStatusChips.tsx imported the
  // SegmentedControl subpath, whose web leg was a deliberate throwing stub at
  // the time. INFRA-3518 (#39485) has since shipped a real web
  // implementation and renamed the entry point to `segmented-control-compat`
  // (see the dedicated regression test below), so `@universe/mycelium/
  // segmented-control` no longer resolves at all and can't reproduce the
  // shape anymore. floating-overlay carries the identical leg shape the
  // incident depended on (web: throws, native: real, INFRA-2965, permanent
  // by design) and stands in as the live "MUST FIRE" reproduction.
  test('MUST FIRE on the #39180 incident shape: a web-throwing entry imported in web-bundled code (real manifest)', () => {
    const diagnostics = lintFixture({
      source: `
import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'

export function PositionsStatusChips(): JSX.Element {
  return <FloatingOverlayRoot />
}
`,
      platform: 'web',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('deliberate throwing stub')
    expect(diagnostics[0]?.message).toContain('@universe/mycelium/floating-overlay')
  })

  // Regression guard for the fix itself: segmented-control-compat's web leg
  // used to be exactly this incident's throwing stub; INFRA-3518 replaced it
  // with a real implementation on both platforms, and the rename means the
  // old `./segmented-control` subpath is gone from the manifest entirely.
  test('stays silent on segmented-control-compat on both platforms — the #39180 stub itself was fixed upstream (INFRA-3518) (real manifest)', () => {
    const source = `import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'\nexport { SegmentedControl }`
    expect(lintFixture({ source, platform: 'web' })).toHaveLength(0)
    expect(lintFixture({ source, platform: 'native' })).toHaveLength(0)
    expect(lintFixture({ source, platform: 'both' })).toHaveLength(0)
  })

  // Regression guard for a merge-driven manifest flip: tooltip-compat's
  // native leg used to be an INFRA-3021 throwing stub (this rule's own
  // earlier fixtures fired on it) until INFRA-3514 tranche 1 (#39503) shipped
  // a real native leg. Two of the five violations this gate's alignment test
  // surfaced during that merge were exactly this — stale 'throws' rows for an
  // entry that had already gone real on `main`.
  test('stays silent on tooltip-compat on both platforms — the native leg went real under INFRA-3514 (#39503) (real manifest)', () => {
    const source = `import { TooltipCompat } from '@universe/mycelium/tooltip-compat'\nexport { TooltipCompat }`
    expect(lintFixture({ source, platform: 'web' })).toHaveLength(0)
    expect(lintFixture({ source, platform: 'native' })).toHaveLength(0)
    expect(lintFixture({ source, platform: 'both' })).toHaveLength(0)
  })

  test('stays silent for a web-throwing entry import in native-reachable code (real manifest)', () => {
    const diagnostics = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'native',
    })
    expect(diagnostics).toHaveLength(0)
  })

  test('fires on floating-overlay in web-bundled code (real manifest)', () => {
    const diagnostics = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'web',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('INFRA-2965')
  })

  test('fires on the INFRA-3021 compat families in native-reachable code (real manifest)', () => {
    // tooltip-compat and presence are deliberately not in this list any more
    // — tooltip-compat's native leg went real under INFRA-3514 (#39503),
    // presence's went real under INFRA-3344 (#39550); see the dedicated
    // regression guards.
    const source = `
import { MenuContentCompat } from '@universe/mycelium/menu-compat'
import { PopoverCompat } from '@universe/mycelium/popover-compat'
export { MenuContentCompat, PopoverCompat }
`
    const diagnostics = lintFixture({ source, platform: 'native' })
    expect(diagnostics).toHaveLength(2)
  })

  test('menu-compat: the subpath fires on native, the root re-exports stay silent (real manifest)', () => {
    // Metro resolves the exact subpath target (the web barrel), so native must import from the root.
    const subpath = `import { DropdownMenuSheetItemCompat } from '@universe/mycelium/menu-compat'\nexport { DropdownMenuSheetItemCompat }`
    expect(lintFixture({ source: subpath, platform: 'native' })).toHaveLength(1)
    const root = `import { DropdownMenuSheetItem, getMenuItemColor } from '@universe/mycelium'\nexport { DropdownMenuSheetItem, getMenuItemColor }`
    expect(lintFixture({ source: root, platform: 'native' })).toHaveLength(0)
    expect(lintFixture({ source: root, platform: 'both' })).toHaveLength(0)
  })

  // Regression guard for a merge-driven manifest flip: presence's native leg
  // used to be an INFRA-3344 throwing stub (this rule's own earlier fixtures
  // fired on it, and the stale manifest row ejected #40138 from the merge
  // queue) until the Reanimated implementation shipped via #39550 and the
  // manifest caught up.
  test('stays silent on presence on both platforms — the native leg went real under INFRA-3344 (#39550) (real manifest)', () => {
    const source = `import { Presence } from '@universe/mycelium/presence'\nexport { Presence }`
    expect(lintFixture({ source, platform: 'web' })).toHaveLength(0)
    expect(lintFixture({ source, platform: 'native' })).toHaveLength(0)
    expect(lintFixture({ source, platform: 'both' })).toHaveLength(0)
  })

  test('stays silent on generated icons but still fires on web-only holdouts in native-reachable code (real manifest)', () => {
    // INFRA-3508 shipped a real native leg for the generated icon factory
    // (createIcon.native.tsx + svg-elements.native.ts), so generated icons —
    // barrel or per-icon wildcard subpath — resolve a real native
    // implementation and must not fire.
    const generated = `
import { AlertCircle } from '@universe/mycelium/icons'
import { AlertTriangle } from '@universe/mycelium/icons/AlertTriangle'
export { AlertCircle, AlertTriangle }
`
    expect(lintFixture({ source: generated, platform: 'native' })).toHaveLength(0)

    // The four hand-written web-only holdout icons (INFRA-3285) still have no
    // native leg — scoped per-export via the manifest's namedExports — so they
    // must still fire, whether imported from the barrel or a per-icon subpath.
    const webOnly = `
import { Unitag } from '@universe/mycelium/icons'
import { BackArrow } from '@universe/mycelium/icons/BackArrow'
export { Unitag, BackArrow }
`
    const diagnostics = lintFixture({ source: webOnly, platform: 'native' })
    expect(diagnostics).toHaveLength(2)
    expect(diagnostics[0]?.message).toContain('no native implementation')
  })

  test('stays silent on the root-barrel Unicon named import in native-reachable code (real manifest — the INFRA-3516 react-native-svg leg landed)', () => {
    const source = `
import { Flex, Text, Unicon } from '@universe/mycelium'
export { Flex, Text, Unicon }
`
    expect(lintFixture({ source, platform: 'native' })).toHaveLength(0)
  })

  test('stays silent on right-platform imports (real manifest)', () => {
    const webSource = `
import { Flex, Unicon } from '@universe/mycelium'
import { PresenceGroup } from '@universe/mycelium/presence'
import { TooltipCompat } from '@universe/mycelium/tooltip-compat'
import { AlertCircle } from '@universe/mycelium/icons'
export { Flex, Unicon, PresenceGroup, TooltipCompat, AlertCircle }
`
    expect(lintFixture({ source: webSource, platform: 'web' })).toHaveLength(0)

    const nativeSource = `
import { Flex, Text } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'
export { Flex, Text, SegmentedControl, FloatingOverlayRoot }
`
    expect(lintFixture({ source: nativeSource, platform: 'native' })).toHaveLength(0)
  })

  test('ignores type-only imports — they are erased at compile time', () => {
    const source = `
import type { FloatingOverlayRootProps } from '@universe/mycelium/floating-overlay'
import { type FloatingOverlayContentProps } from '@universe/mycelium/floating-overlay'
export type { FloatingOverlayRootProps, FloatingOverlayContentProps }
`
    expect(lintFixture({ source, platform: 'web' })).toHaveLength(0)
  })

  test('fires once on a mixed value/type specifier list', () => {
    const source = `
import { type FloatingOverlayRootProps, FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'
export { FloatingOverlayRoot }
export type { FloatingOverlayRootProps }
`
    expect(lintFixture({ source, platform: 'web' })).toHaveLength(1)
  })

  test('exempts opposite-platform leg files: .web.tsx under the native check, .native.tsx under the web check', () => {
    // popover-compat's native leg throws — this must stay 0 only because the
    // .web.tsx suffix exempts it from the native check entirely, not because
    // the entry itself is clean (tooltip-compat, whose native leg is now
    // real, would pass here even without the exemption and so would not
    // discriminate).
    const nativeCheckOnWebLeg = lintFixture({
      source: `import { PopoverCompat } from '@universe/mycelium/popover-compat'\nexport { PopoverCompat }`,
      platform: 'native',
      fileName: 'Fixture.web.tsx',
    })
    expect(nativeCheckOnWebLeg).toHaveLength(0)

    const webCheckOnNativeLeg = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'web',
      fileName: 'Fixture.native.tsx',
    })
    expect(webCheckOnNativeLeg).toHaveLength(0)
  })

  // Dual-bundled shared packages (packages/uniswap, packages/wallet,
  // packages/ui) run under platform 'both': a non-suffixed file ships in the
  // web AND native bundles, so it must clear both legs.
  test("MUST FIRE under 'both' on a non-suffixed shared-package file importing floating-overlay (real manifest)", () => {
    const diagnostics = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'both',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('web leg')
    expect(diagnostics[0]?.message).toContain('deliberate throwing stub')
  })

  test("MUST FIRE under 'both' on a .web.tsx shared-package file importing a web-throwing entry — the #39180 shape one directory over (real manifest)", () => {
    const diagnostics = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'both',
      fileName: 'Fixture.web.tsx',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('web leg')
  })

  test("under 'both', suffixed files get exactly their own platform's check (real manifest)", () => {
    // .native.tsx resolves the real native FloatingOverlay leg — silent.
    expect(
      lintFixture({
        source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
        platform: 'both',
        fileName: 'Fixture.native.tsx',
      }),
    ).toHaveLength(0)
    // .native.tsx still gets the native check: popover-compat fires.
    expect(
      lintFixture({
        source: `import { PopoverCompat } from '@universe/mycelium/popover-compat'\nexport { PopoverCompat }`,
        platform: 'both',
        fileName: 'Fixture.native.tsx',
      }),
    ).toHaveLength(1)
    // .web.tsx is exempt from the native check: popover-compat is silent.
    expect(
      lintFixture({
        source: `import { PopoverCompat } from '@universe/mycelium/popover-compat'\nexport { PopoverCompat }`,
        platform: 'both',
        fileName: 'Fixture.web.tsx',
      }),
    ).toHaveLength(0)
  })

  test("under 'both', a non-suffixed file importing a native-throwing entry fires the native leg (real manifest)", () => {
    const diagnostics = lintFixture({
      source: `import { MenuContentCompat } from '@universe/mycelium/menu-compat'\nexport { MenuContentCompat }`,
      platform: 'both',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('native leg')
  })

  test("under 'both', an entry broken on both platforms reports each leg", () => {
    const diagnostics = lintFixture({
      source: `import { Thing } from '@universe/mycelium/thing'\nexport { Thing }`,
      platform: 'both',
      manifest: { './thing': { web: 'throws', native: 'missing' } },
    })
    expect(diagnostics).toHaveLength(2)
  })

  // Review-bot follow-up on #39484: a namespace import, `export *`, or
  // dynamic `import()` exposes every named export with no specifier list to
  // check individual names against — previously these bypassed the
  // namedExports check entirely (e.g. `import * as M from
  // '@universe/mycelium'; <M.Unicon />` in native-reachable code shipped with
  // zero diagnostics even though Unicon's native leg throws).
  test('fires on a namespace import that reaches a throwing named export (real manifest)', () => {
    // Unicon (the incident example above) gained a real native leg with
    // INFRA-3516; the icons entry's web-only holdouts are the remaining
    // real-manifest named exports with a missing native leg.
    const diagnostics = lintFixture({
      source: `import * as Icons from '@universe/mycelium/icons'\nexport const C = Icons.BackArrow`,
      platform: 'native',
    })
    // Namespace imports are checked conservatively against every namedExport
    // of the entry, so all four web-only holdouts fire.
    expect(diagnostics).toHaveLength(4)
    expect(diagnostics.some((diagnostic) => diagnostic.message.includes("'BackArrow'"))).toBe(true)
  })

  test('stays silent on a namespace import when no named export on that entry throws (real manifest)', () => {
    const diagnostics = lintFixture({
      source: `import * as Mycelium from '@universe/mycelium'\nexport const C = Mycelium.Flex`,
      platform: 'web',
    })
    expect(diagnostics).toHaveLength(0)
  })

  test('fires on `export * from` reaching a throwing named export (fixture manifest)', () => {
    const diagnostics = lintFixture({
      source: `export * from '@universe/mycelium/thing'`,
      platform: 'web',
      manifest: { './thing': { web: 'real', native: 'real', namedExports: { Widget: { web: 'throws' } } } },
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain("'Widget'")
  })

  test('fires on dynamic `import()` reaching a throwing named export (fixture manifest)', () => {
    const diagnostics = lintFixture({
      source: `export const lazy = async () => (await import('@universe/mycelium/thing')).Widget`,
      platform: 'web',
      manifest: { './thing': { web: 'real', native: 'real', namedExports: { Widget: { web: 'throws' } } } },
    })
    expect(diagnostics).toHaveLength(1)
  })

  // Review-bot follow-up on #39484: the suffix check was end-anchored
  // (`\.native\.tsx$`), so a platform-suffixed file with a further extension
  // segment — e.g. a `.native.test.tsx` unit test for a native leg — read as
  // non-suffixed and got the wrong platform's check (or, under 'both', both
  // legs) instead of exactly its own.
  test("a suffixed test file (Foo.native.test.tsx) is still recognized as native-only under 'both' mode", () => {
    // The native leg is real; a spurious web check would fire here if the
    // file were misread as non-suffixed.
    expect(
      lintFixture({
        source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
        platform: 'both',
        fileName: 'Fixture.native.test.tsx',
      }),
    ).toHaveLength(0)
    // The native check still applies: a native-throwing entry still fires.
    const diagnostics = lintFixture({
      source: `import { PopoverCompat } from '@universe/mycelium/popover-compat'\nexport { PopoverCompat }`,
      platform: 'both',
      fileName: 'Fixture.native.test.tsx',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('native leg')
  })

  test("a suffixed test file (Foo.web.test.tsx) is still recognized as web-only under 'both' mode", () => {
    // The web leg throws; under 'both' this must fire exactly once (not the
    // native leg too), proving the file was read as web-suffixed, not bare.
    const diagnostics = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'both',
      fileName: 'Fixture.web.test.tsx',
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('web leg')
  })

  // Review-bot follow-up on #39484: the segment scan previously included
  // segment 0 (the base name itself), so a file literally named `web.ts` or
  // `native.ts` had its own name equal a platform token and misread as
  // suffixed, silently losing the other leg's check under 'both' mode.
  test("a file literally named web.ts or native.ts is NOT read as platform-suffixed under 'both' mode", () => {
    // web.ts importing a NATIVE-throwing entry: if the base name were
    // misread as a web suffix, the native leg check would be dropped
    // entirely and this would go silent. popover-compat's web leg is real,
    // so only the fix's "check both legs" behavior catches the native throw.
    const webNamedFile = lintFixture({
      source: `import { PopoverCompat } from '@universe/mycelium/popover-compat'\nexport { PopoverCompat }`,
      platform: 'both',
      fileName: 'web.ts',
    })
    expect(webNamedFile).toHaveLength(1)
    expect(webNamedFile[0]?.message).toContain('native leg')

    // native.ts importing a WEB-throwing entry: if the base name were
    // misread as a native suffix, the web leg check would be dropped
    // entirely and this would go silent. floating-overlay's native leg is
    // real, so only the fix's "check both legs" behavior catches the web throw.
    const nativeNamedFile = lintFixture({
      source: `import { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'\nexport { FloatingOverlayRoot }`,
      platform: 'both',
      fileName: 'native.ts',
    })
    expect(nativeNamedFile).toHaveLength(1)
    expect(nativeNamedFile[0]?.message).toContain('web leg')
  })

  test('fires on re-export and dynamic-import forms', () => {
    const source = `
export { FloatingOverlayRoot } from '@universe/mycelium/floating-overlay'
export * from '@universe/mycelium/floating-overlay'
export const lazy = async () => import('@universe/mycelium/floating-overlay')
`
    const diagnostics = lintFixture({ source, platform: 'web' })
    expect(diagnostics).toHaveLength(3)
  })

  test('stays silent on non-mycelium sources and unlisted mycelium entry points', () => {
    const source = `
import { FloatingOverlayRoot } from 'ui/src'
import { something } from '@universe/mycelium/not-a-real-entry'
export { FloatingOverlayRoot, something }
`
    // Unknown entry points are the alignment test's job
    // (mycelium-platform-legs.test.ts), not the rule's.
    expect(lintFixture({ source, platform: 'web', manifest: { '.': { web: 'real', native: 'real' } } })).toHaveLength(0)
  })

  test('appends the manifest note to the diagnostic', () => {
    const diagnostics = lintFixture({
      source: `import { Thing } from '@universe/mycelium/thing'\nexport { Thing }`,
      platform: 'web',
      manifest: { './thing': { web: 'throws', native: 'real', webNote: 'Use OtherThing instead (INFRA-0000).' } },
    })
    expect(diagnostics).toHaveLength(1)
    expect(diagnostics[0]?.message).toContain('Use OtherThing instead (INFRA-0000).')
  })

  // Guards against `entryPoints ?? {}` silently disabling every ban when a
  // manifest is malformed — a manifest missing its `entryPoints` key must
  // fail the lint run loudly (INFRA-3241 lesson), not degrade to "no bans".
  // Can't use lintFixture here: it treats any exit code other than 0/1 as an
  // oxlint failure and throws, which is exactly the outcome this case wants
  // to assert on, so it spawns oxlint directly instead.
  test('fails loud (does not silently pass) when the manifest has no entryPoints object', () => {
    const dir = mkdtempSync(join(fixtureRoot, 'malformed-manifest-'))
    const filePath = join(dir, 'Fixture.tsx')
    writeFileSync(filePath, `import { Thing } from '@universe/mycelium/thing'\nexport { Thing }\n`)
    const manifestPath = join(dir, 'platform-legs.json')
    writeFileSync(manifestPath, JSON.stringify({ notEntryPoints: {} }))
    const configPath = join(dir, '.oxlintrc.json')
    writeFileSync(
      configPath,
      JSON.stringify({
        plugins: [],
        categories: { correctness: 'off' },
        jsPlugins: [PLUGIN_PATH],
        rules: { 'universe-custom/no-throwing-stub-imports': ['error', { platform: 'web' }] },
      }),
    )

    const result = Bun.spawnSync([OXLINT_BIN, '-c', configPath, '--format', 'json', filePath], {
      cwd: dir,
      env: { ...process.env, MYCELIUM_PLATFORM_LEGS: manifestPath },
      stdout: 'pipe',
      stderr: 'pipe',
    })

    expect(result.exitCode).not.toBe(0)
    // oxlint prints JS-plugin load failures (including thrown errors from
    // module-level code like the manifest loader) to stdout, not stderr.
    expect(result.stdout.toString()).toContain('has no "entryPoints" object')
  })
})
