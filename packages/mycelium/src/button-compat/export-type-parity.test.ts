/**
 * TYPE-level export parity across ButtonCompat's three platform legs (INFRA-3230).
 *
 * `platform-legs.test.tsx` compares `Object.keys(...)` of the two modules, which
 * is VALUE-only: types are erased at runtime, so an `export type` present on one
 * leg and missing from the other passes that test invisibly. A consumer writing
 * `import type { ButtonTextProps } from '@universe/mycelium'` would then compile
 * on web and fail on device (or vice versa) with nothing in CI to catch it.
 *
 * WHY A GENERATED tsc PROBE rather than a static contract file. The house
 * template for type-level contracts is a checked-in source file compiled by its
 * own tsconfig, and it is the right shape when the
 * contract is "surface A covers surface B" — `keyof` does that work. It cannot do
 * THIS job: TypeScript offers no reflection over a module's exported TYPE names,
 * so a static file would have to hand-list them, and a hand-listed set is exactly
 * the thing that drifts. So the export names are EXTRACTED FROM THE TWO LEG
 * SOURCES and a probe importing every extracted name from BOTH legs is generated
 * and compiled — a name only one leg exports fails with TS2305 naming it.
 *
 * Harness shape (and its two safety features) come from #37907's
 * `../components/icons/icon-type-exports.test.ts`:
 *   - a NEGATIVE CONTROL leg that must fail `TS2305`, so a probe that silently
 *     stopped resolving the module cannot report a pass;
 *   - `if (result.error) throw result.error`, so a missing/unspawnable `tsc`
 *     surfaces as an error instead of a green run.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const REPO_ROOT = join(__dirname, '..', '..', '..', '..')
const LEG_DIR = __dirname

const LEGS = {
  base: join(LEG_DIR, 'ButtonCompat.tsx'),
  web: join(LEG_DIR, 'ButtonCompat.web.tsx'),
  native: join(LEG_DIR, 'ButtonCompat.native.tsx'),
} as const

// Temp files live under the repo so module/type resolution sees the real
// node_modules (icon-type-exports.test.ts pattern).
const CACHE_ROOT = join(REPO_ROOT, 'node_modules', '.cache')
mkdirSync(CACHE_ROOT, { recursive: true })
const TEMP_ROOT = mkdtempSync(join(CACHE_ROOT, 'button-compat-export-types-'))

afterAll(() => {
  rmSync(TEMP_ROOT, { recursive: true, force: true })
})

/**
 * The TYPE names a leg exports: its own `export interface` / `export type`
 * declarations plus every name in an `export type { … } from '…'` re-export.
 * Read out of the source so the set can never be stale.
 */
function exportedTypeNames(legPath: string): string[] {
  const source = readFileSync(legPath, 'utf8')
  const names = new Set<string>()
  for (const match of source.matchAll(/^export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(match[1] as string)
  }
  for (const block of source.matchAll(/^export\s+type\s*\{([^}]*)\}/gm)) {
    for (const entry of (block[1] as string).split(',')) {
      // `Name`, `type Name` and `Name as Alias` all yield the SOURCE-side name,
      // which is the one that has to exist on the other leg. An empty entry (a
      // trailing comma) simply does not match. Kept as two single-quantifier
      // regexes rather than one nested-quantifier pattern (detect-unsafe-regex).
      const name = /^[A-Za-z_$][\w$]*/.exec(entry.replace(/^\s*type\s/, '').trim())?.[0]
      if (name !== undefined) {
        names.add(name)
      }
    }
  }
  return [...names].sort()
}

/** Import specifier for a leg — extensionless, as TS requires. */
function specifier(legPath: string): string {
  return JSON.stringify(legPath.replace(/\.tsx$/, ''))
}

function typecheck(source: string): { ok: boolean; output: string } {
  const dir = mkdtempSync(join(TEMP_ROOT, 'case-'))
  const probePath = join(dir, 'probe.ts')
  writeFileSync(probePath, source)
  const configPath = join(dir, 'tsconfig.json')
  writeFileSync(
    configPath,
    JSON.stringify({
      extends: join(REPO_ROOT, 'config', 'tsconfig', 'app.json'),
      // The harness follows imports into source (no project references), so
      // files owned by other projects can report diagnostics that only reflect
      // this flag set; the assertions below scope to the probe.
      compilerOptions: {
        noEmit: true,
        composite: false,
        noPropertyAccessFromIndexSignature: false,
        types: ['node'],
      },
      // index.d.ts supplies the repo-global JSX namespace; mycelium's
      // global.d.ts supplies the asset module shapes its closure needs.
      files: [join(REPO_ROOT, 'index.d.ts'), join(REPO_ROOT, 'packages', 'mycelium', 'src', 'global.d.ts'), probePath],
    }),
  )
  // `--pretty false` is load-bearing, not cosmetic: nx injects `FORCE_COLOR`
  // into every forked task (the normal CI path, `bun nx affected -t test`),
  // which makes tsc emit the colourised multi-line format where the code reads
  // `\x1b[91merror\x1b[0m\x1b[90m TS2322`. The `/error TS/` filter in
  // `probeDiagnostics` then matches NOTHING, so a failure degrades to a bare
  // exit-code assertion with no diagnostics naming the drifted prop. The env
  // pins are belt-and-braces so the parse does not rest on a single flag.
  const result = spawnSync(
    join(REPO_ROOT, 'node_modules', '.bin', 'tsc'),
    ['-p', configPath, '--noErrorTruncation', '--pretty', 'false'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    },
  )
  // Surface a missing/unspawnable tsc readably (Bun.spawnSync throws on ENOENT;
  // node:child_process reports it here instead) — without this a broken binary
  // would look like a pass.
  if (result.error) {
    throw result.error
  }
  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}` }
}

/** Diagnostics reported against the generated probe itself. */
function probeDiagnostics(output: string): string[] {
  return output
    .split('\n')
    .filter((line) => /error TS/.test(line))
    .filter((line) => line.includes('probe.ts'))
}

const TSC_TIMEOUT_MS = 300_000

describe('ButtonCompat platform legs export the same TYPE names (INFRA-3230)', () => {
  it('the extracted name sets are non-empty and equal across all three legs', () => {
    const base = exportedTypeNames(LEGS.base)
    const web = exportedTypeNames(LEGS.web)
    const native = exportedTypeNames(LEGS.native)
    // A regex that stopped matching would make every assertion below vacuous.
    expect(base.length, 'no exported types found on the base leg — the extractor broke').toBeGreaterThan(4)
    expect(web).toEqual(base)
    expect(native).toEqual(base)
  })

  it(
    'every extracted name imports as a type from ALL THREE legs (tsc)',
    () => {
      const names = exportedTypeNames(LEGS.base)
      const lines = [
        `import type { ${names.join(', ')} } from ${specifier(LEGS.base)}`,
        `import type { ${names.map((name) => `${name} as Web${name}`).join(', ')} } from ${specifier(LEGS.web)}`,
        `import type { ${names.map((name) => `${name} as Native${name}`).join(', ')} } from ${specifier(LEGS.native)}`,
        '',
        // Reference every name so an unused-import lint or an elided import can
        // never hide a resolution failure.
        ...names.flatMap((name) => [
          `export type Base_${name} = ${name}`,
          `export type Web_${name} = Web${name}`,
          `export type Native_${name} = Native${name}`,
        ]),
        '',
      ].join('\n')
      const result = typecheck(lines)
      expect(probeDiagnostics(result.output), result.output.slice(0, 4000)).toEqual([])
      expect(result.ok).toBe(true)
    },
    TSC_TIMEOUT_MS,
  )

  it(
    'negative control: a name neither leg exports fails with TS2305',
    () => {
      const result = typecheck(
        [
          `import type { DefinitelyNotAButtonCompatExport } from ${specifier(LEGS.native)}`,
          '',
          'export type Probe = DefinitelyNotAButtonCompatExport',
          '',
        ].join('\n'),
      )
      expect(result.ok).toBe(false)
      expect(result.output).toContain('TS2305')
    },
    TSC_TIMEOUT_MS,
  )

  it(
    'the shared call-site prop surface is present on BOTH legs (tsc)',
    () => {
      // `ButtonCompatProps` is deliberately NOT structurally identical across the
      // legs — the web leg extends `ButtonHTMLAttributes`, the native leg does
      // not — so identity is the wrong assertion. What every converted call site
      // needs is that the shared props exist on both, which is what drifts.
      // The base stub type-re-exports the web leg's props, so web is the leg to
      // probe here.
      const shared = [
        'variant',
        'emphasis',
        'size',
        'fill',
        'focusScaling',
        'iconPosition',
        'loading',
        'disabled',
        'onDisabledPress',
        'backgroundColor',
        'width',
        'height',
        'minWidth',
        'minHeight',
        'maxWidth',
        'maxHeight',
        'justifyContent',
        'gap',
        'p',
        'padding',
        'm',
        'mx',
        'my',
        'mt',
        'mb',
        'ml',
        'mr',
        'margin',
        'marginHorizontal',
        'marginVertical',
        'marginTop',
        'marginBottom',
        'marginLeft',
        'marginRight',
        'flex',
        'flexBasis',
        'borderRadius',
        'alignSelf',
        '$platform-web',
        'group',
        'tag',
        'href',
        'target',
        'rel',
        // The INFRA-3240 responsive media pools: web-rendered,
        // accepted-and-dev-warned on native — shared surface either way.
        '$xxs',
        '$xs',
        '$sm',
        '$md',
        '$lg',
        '$xl',
        '$xxl',
        '$xxxl',
        '$short',
        '$midHeight',
        '$lgHeight',
        'shouldAnimateBetweenLoadingStates',
        'lineHeightDisabled',
        'icon',
        'testID',
        'children',
        'onPress',
      ]
      const union = shared.map((prop) => JSON.stringify(prop)).join(' | ')
      const result = typecheck(
        [
          `import type { ButtonCompatProps } from ${specifier(LEGS.web)}`,
          `import type { ButtonCompatProps as NativeButtonCompatProps } from ${specifier(LEGS.native)}`,
          '',
          `type Shared = ${union}`,
          '',
          '// Each assignment fails NAMING the missing props if a leg drops one.',
          'export type WebCovers = Shared extends keyof ButtonCompatProps',
          '  ? true',
          '  : { missingFromWebLeg: Exclude<Shared, keyof ButtonCompatProps> }',
          'export const webCovers: WebCovers = true',
          'export type NativeCovers = Shared extends keyof NativeButtonCompatProps',
          '  ? true',
          '  : { missingFromNativeLeg: Exclude<Shared, keyof NativeButtonCompatProps> }',
          'export const nativeCovers: NativeCovers = true',
          '',
        ].join('\n'),
      )
      expect(probeDiagnostics(result.output), result.output.slice(0, 4000)).toEqual([])
      expect(result.ok).toBe(true)
    },
    TSC_TIMEOUT_MS,
  )

  /*
   * SHAPES, NOT JUST NAMES (review round 1).
   *
   * Everything above pins the export NAME set and prop PRESENCE. Neither can
   * see a prop whose TYPE diverges between the legs — the same class of hole as
   * the exclusions ledger: a future divergence would pass in silence, and a
   * silent type divergence is precisely how a shared call site compiles green
   * and misbehaves on device.
   *
   * So every shared prop's type is compared for exact identity across the legs,
   * and the set that legitimately differs is PINNED with its reason below. A new
   * divergence fails; so does a stale entry that stopped diverging.
   */
  const SHAPE_PINNED_PROPS = [
    'variant',
    'emphasis',
    'size',
    'fill',
    'focusScaling',
    'iconPosition',
    'loading',
    'disabled',
    'onDisabledPress',
    'backgroundColor',
    // The INFRA-3478 layout lane: `width` renders on both legs, `height` and
    // `justifyContent` are accepted-and-dev-warned on native. Shared surface
    // either way, so its types must not drift.
    'width',
    'height',
    'justifyContent',
    // The INFRA-3472 spacing lane: rendered on BOTH legs (class lane on web,
    // class + style lanes on native), so its types must not drift either.
    'gap',
    'p',
    'padding',
    // The INFRA-3661 margin family: same both-leg wired status as gap/p, both
    // spellings of every prop.
    'm',
    'mx',
    'my',
    'mt',
    'mb',
    'ml',
    'mr',
    'margin',
    'marginHorizontal',
    'marginVertical',
    'marginTop',
    'marginBottom',
    'marginLeft',
    'marginRight',
    // The INFRA-3478 link form: anchor-rendered on web, accepted-and-dev-warned
    // on native (no anchor host exists) — same shared-surface reasoning as the
    // layout lane above.
    'tag',
    'href',
    'target',
    'rel',
    // The INFRA-3603 flex lane: `flex` renders on both legs, `flexBasis` is
    // accepted-and-dev-warned on native (web-only call sites): same
    // shared-surface reasoning as height.
    'flex',
    'flexBasis',
    // The INFRA-3541 link-surface residue: borderRadius/alignSelf are
    // web-rendered + accepted-and-dev-warned on native like height; the
    // $platform-web pool is web-rendered + deliberately INERT on native
    // (legacy parity — Tamagui ignores it on device too, so no warning).
    'borderRadius',
    'alignSelf',
    '$platform-web',
    // The INFRA-3550 group anchor: web-rendered marker, accepted-and-dev-warned
    // on native (uniwind drops group-* variants) — same reasoning as height.
    'group',
    'minWidth',
    'minHeight',
    'maxWidth',
    'maxHeight',
    '$xxs',
    '$xs',
    '$sm',
    '$md',
    '$lg',
    '$xl',
    '$xxl',
    '$xxxl',
    '$short',
    '$midHeight',
    '$lgHeight',
    'shouldAnimateBetweenLoadingStates',
    'lineHeightDisabled',
    'icon',
    'testID',
    'children',
    'onPress',
    'className',
    'style',
    'primary-color',
    'dd-action-name',
  ]

  /**
   * Shared props whose type deliberately differs between the legs, each with
   * the reason it cannot be unified today. Anything NOT listed must be
   * type-identical on both legs.
   *
   * `onPress` / `onDisabledPress` used to be pinned here (web
   * `MouseEventHandler` vs native RNGH handler) — the divergence that let a
   * shared file call `e.preventDefault()` in a press handler, typecheck clean,
   * and throw on device. INFRA-3261 unified both legs on the platform-neutral
   * `ButtonPressHandler` (`./press-handler`), so the shape probe now asserts
   * them identical like any other shared prop.
   */
  const KNOWN_SHAPE_DIVERGENCES: Record<string, string | undefined> = {
    style: 'web CSSProperties vs native StyleProp<ViewStyle>',
  }

  it(
    'every shared prop is type-IDENTICAL across the legs, except the pinned divergences (tsc)',
    () => {
      // The standard invariant type-equality probe: two conditional types are
      // mutually assignable only when their checked types are identical, which
      // (unlike `extends` in both directions) also separates `any`, unions and
      // optionality.
      const eq = 'type Eq<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false'
      const lines = [
        `import type { ButtonCompatProps as WebProps } from ${specifier(LEGS.web)}`,
        `import type { ButtonCompatProps as NativeProps } from ${specifier(LEGS.native)}`,
        '',
        eq,
        '',
        ...SHAPE_PINNED_PROPS.map((prop, index) => {
          const expected = KNOWN_SHAPE_DIVERGENCES[prop] === undefined ? 'true' : 'false'
          // The const name carries the prop so a failure names it directly.
          const safe = prop.replace(/[^A-Za-z0-9]/g, '_')
          return `export const shape_${index}_${safe}: Eq<WebProps[${JSON.stringify(prop)}], NativeProps[${JSON.stringify(prop)}]> = ${expected}`
        }),
        '',
      ].join('\n')
      const result = typecheck(lines)
      // A failure here reads `Type 'true' is not assignable to type 'false'` (or
      // the reverse) on the line whose const names the prop.
      expect(probeDiagnostics(result.output), result.output.slice(0, 4000)).toEqual([])
      expect(result.ok).toBe(true)
    },
    TSC_TIMEOUT_MS,
  )

  it('every pinned divergence is a prop the shape probe actually checks', () => {
    // A divergence entry for a prop outside SHAPE_PINNED_PROPS would assert
    // nothing at all.
    for (const prop of Object.keys(KNOWN_SHAPE_DIVERGENCES)) {
      expect(SHAPE_PINNED_PROPS, `${prop} is pinned as divergent but never probed`).toContain(prop)
    }
    expect(SHAPE_PINNED_PROPS.length).toBeGreaterThan(15)
  })

  it(
    'ButtonPressHandler keeps rejecting web-only members on an inferred event (tsc)',
    () => {
      // The probes above only prove both legs reference the same
      // `ButtonPressHandler` SYMBOL — if that symbol itself regressed to a
      // plain DOM handler they would all stay green while the on-device crash
      // class (INFRA-3261) returned. So the invariant is pinned directly: an
      // INFERRED event parameter may only touch members present on both legs'
      // events. The native leg now dispatches RN's GestureResponderEvent,
      // which has `preventDefault`/`stopPropagation` (pinned below as shared),
      // but no DOM-only member like `clientX` — so that access must be a
      // compile error. On a regression the `@ts-expect-error` flips to TS2578
      // (unused directive) and this probe fails naming it. The positive pins
      // guard the other half of the contract: bivariance keeps the existing
      // call-site idioms assignable.
      const result = typecheck(
        [
          `import type { ButtonPressHandler, WebButtonPressEvent } from ${specifier(LEGS.base)}`,
          '',
          '// @ts-expect-error — clientX is web-only; an inferred event param must not reach it',
          'export const inferredWebOnly: ButtonPressHandler = (event) => void event.clientX',
          'export const inferredShared: ButtonPressHandler = (event) => {',
          '  event.preventDefault()',
          '  event.stopPropagation()',
          '}',
          '',
          'export const webAnnotated: ButtonPressHandler = (event: WebButtonPressEvent) => event.preventDefault()',
          'export const noArg: ButtonPressHandler = () => {}',
          '',
        ].join('\n'),
      )
      expect(probeDiagnostics(result.output), result.output.slice(0, 4000)).toEqual([])
      expect(result.ok).toBe(true)
    },
    TSC_TIMEOUT_MS,
  )
})
