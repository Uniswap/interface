/**
 * ButtonCompat COMPILED-CSS GATE (INFRA-3230).
 *
 * Every other test in this family asserts on class *names* — the rendered
 * string (`web-class-pin.test.tsx`), the compiler's output, the native
 * expectations. None of them touches the compiled stylesheet, so none of them
 * can see the one failure mode that class-name assertions are structurally
 * blind to: a class that is emitted into the DOM but that Tailwind never
 * generated a rule for. It renders, it looks right in a snapshot, and it paints
 * nothing.
 *
 * That is not hypothetical here. Tailwind v4 builds CSS from Oxide's *text*
 * scan of the registered `@source` roots. Decomposing the [variant][emphasis]
 * cells into `ScopedCell` scopes moved every `hover:` / `active:` /
 * `focus-visible:` / `group-hover/sbtn:` prefixed class out of source text and
 * into a runtime concatenation in `joinScopes`, which a text scanner cannot see.
 * `FRAME_JOINED_CELLS` / `TEXT_JOINED_CELLS` in `./variantEmphasisHash` are the
 * literals that put them back. This file is what makes that load-bearing
 * instead of decorative.
 *
 * NOTE FOR EDITORS: do not write a full prefixed class name anywhere in this
 * file, not even in a comment. The scan below covers this file too, so a token
 * spelled here would make its own assertion pass. Every expectation is derived
 * by calling the compilers; keep it that way.
 *
 * Three assertions, in the order a regression would hit them:
 *
 *  1. SET EQUALITY — the literal tables cover exactly the compound tokens
 *     `joinScopes` produces from the `ScopedCell` data. Neither table is the
 *     source of truth for the other; a divergence in either direction fails.
 *  2. COMPILED-CSS COVERAGE — compile the REAL consumer entry
 *     (`apps/web/src/tailwind.css`) with the real Tailwind Node API, over a real
 *     Oxide scan of mycelium's sources, then assert every interaction class the
 *     web leg can emit, over the full prop matrix, resolves to an actual rule
 *     with actual declarations. The entry's own `@import` graph is the only thing
 *     that can supply those rules — there is no hand-written mirror of the entry
 *     anywhere in this file, which is the point: a mirror stays green while the
 *     real entry stops importing mycelium.
 *  3. CONSUMER COVERAGE — assertion 2 proves the entry's imports generate those
 *     rules for a scan of `packages/mycelium/src`; on its own it cannot prove the
 *     app performs such a scan, so narrowing the consumer's `@source` root would
 *     strip all 56 classes with this file still green. So: compose the same
 *     entry's scan roots exactly as `@tailwindcss/vite` does, keep the positive
 *     ones that reach mycelium's sources, carry every `@source not` through to
 *     Oxide unchanged, and re-scan for the same tokens. Roots are matched as
 *     resolved absolute globs, segment by segment with glob segments treated as
 *     globs, never string-compared — so an equivalently spelled or genuinely
 *     broader root (a wildcard package segment, the whole repo) passes and only a
 *     narrowed, dropped, or newly excluded one fails.
 *
 * Both compiled assertions run off ONE compile of that entry, kept rather than
 * discarded, so nothing in this gate describes the consumer second-hand.
 *
 * The scan in assertion 2 is scoped to `packages/mycelium/src` — exactly the
 * `@source` root a consuming app registers for mycelium. Deliberately NOT the
 * consumer's own tree: mycelium has to be self-sufficient, and widening the scan
 * would let unrelated coincidences elsewhere in the monorepo stand in for
 * coverage this package owes (measured: `labs/sandbox` happens to spell 5 of
 * these 42 tokens, in an app with a separate Tailwind build that does nothing
 * for apps/web).
 *
 * Assertion 3 pins apps/web only. It is the app the web leg ships into, and it
 * is the only mycelium consumer whose coverage is a bare `@source` line — the
 * positional, silently-breakable mechanism the assertion exists to hold. The
 * other consumers (apps/dev-portal, apps/mission-control, labs/workbench,
 * apps/pools-xyz) get theirs from `content` globs in a `@config` JS config instead,
 * which is a different mechanism to pin (and one `compile()` cannot evaluate
 * without a module loader); pinning those belongs with whoever owns those
 * entries. Reading a consumer file by path keeps this a one-way dependency:
 * mycelium must never take a build edge on an app.
 *
 * The expected token set is DERIVED — computed by running the web compilers over
 * the matrix — so this file contains no class literals of its own and cannot
 * scanner-feed its own assertions.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve, sep } from 'node:path'
import { Scanner } from '@tailwindcss/oxide'
import { compile } from 'tailwindcss'
import { beforeAll, describe, expect, it } from 'vitest'
import { getMaybeHexOrRgbColor } from '../button-frame-compat/custom-color'
import {
  BUTTON_EMPHASES,
  BUTTON_FOCUS_SCALINGS,
  BUTTON_ICON_POSITIONS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  buttonCompatFrameClassName,
  buttonCompatIconClassName,
  buttonCompatSpinnerClassName,
  buttonCompatTextClassName,
  FRAME_SCOPE_PREFIXES,
  getContrastTextClass,
  TEXT_SCOPE_PREFIXES,
  type ButtonContentClassProps,
  type ButtonCompatStyleProps,
  type ButtonEmphasis,
  type ButtonFocusScaling,
  type ButtonIconPosition,
  type ButtonSize,
  type ButtonVariant,
} from './compile'
import type { ButtonCompatDimensionProps } from './dimensions'
import {
  FRAME_JOINED_CELLS,
  FRAME_VARIANT_EMPHASIS,
  joinScopes,
  TEXT_JOINED_CELLS,
  TEXT_VARIANT_EMPHASIS,
} from './variantEmphasisHash'
import { buttonCompatDimensionClasses } from './web-dimensions'

const requireFromHere = createRequire(import.meta.url)
const myceliumRoot = resolve(dirname(new URL(import.meta.url).pathname), '..', '..')
const myceliumSrc = join(myceliumRoot, 'src')
const tailwindPkgRoot = join(myceliumRoot, '..', 'tailwind')

/** The consumer that ships the web leg. Read by path only — never imported. */
const webAppRoot = resolve(myceliumRoot, '..', '..', 'apps', 'web')
const webTailwindEntry = join(webAppRoot, 'src', 'tailwind.css')

/** The variant prefixes the web leg emits, as regex-safe alternatives. */
const SCOPE_PREFIXES: string[] = [...Object.values(FRAME_SCOPE_PREFIXES), ...Object.values(TEXT_SCOPE_PREFIXES)].filter(
  (prefix) => prefix !== '',
)

function isScopedClass(cls: string): boolean {
  return SCOPE_PREFIXES.some((prefix) => cls.startsWith(prefix))
}

async function loadStylesheet(id: string, base: string): Promise<{ content: string; base: string; path: string }> {
  let path: string
  if (id.startsWith('.')) {
    path = resolve(base, id)
  } else if (id === 'tailwindcss') {
    path = requireFromHere.resolve('tailwindcss/index.css')
  } else if (id === '@universe/mycelium/tailwind') {
    path = join(myceliumRoot, 'tailwind.css')
  } else if (id === '@universe/tailwind/tailwind') {
    path = join(tailwindPkgRoot, 'tailwind.css')
  } else {
    path = requireFromHere.resolve(id)
  }
  return { content: readFileSync(path, 'utf8'), base: dirname(path), path }
}

/* ----------------------- what the web leg can emit ------------------------ */

const CONTENT_STATES: Pick<ButtonCompatStyleProps, 'disabled' | 'loading' | 'backgroundColor'>[] = [
  {},
  { disabled: true },
  { loading: true },
  { backgroundColor: '#fa2' },
  // A theme token keeps the variant cell and the cell's label colour.
  { backgroundColor: '$surface3' },
]

/** The label/icon/spinner override a `backgroundColor` produces, on the same split the web leg applies. */
function contrastTextClassFor(backgroundColor: string | undefined): string | undefined {
  const customBackgroundColor = getMaybeHexOrRgbColor(backgroundColor)
  return customBackgroundColor === undefined ? undefined : getContrastTextClass(customBackgroundColor)
}

/**
 * Every distinct class the four web selectors emit across the full supported
 * prop matrix. The prop pools come from `./compile`'s derived exports, so a new
 * size/variant/emphasis widens this automatically.
 */
function emittedClasses(): Set<string> {
  const all = new Set<string>()
  const add = (className: string): void => {
    for (const cls of className.split(' ').filter(Boolean)) {
      all.add(cls)
    }
  }
  for (const variant of BUTTON_VARIANTS as ButtonVariant[]) {
    for (const emphasis of BUTTON_EMPHASES as ButtonEmphasis[]) {
      for (const size of BUTTON_SIZES as ButtonSize[]) {
        for (const state of CONTENT_STATES) {
          for (const fill of [true, false]) {
            for (const iconPosition of BUTTON_ICON_POSITIONS as ButtonIconPosition[]) {
              for (const focusScaling of BUTTON_FOCUS_SCALINGS as ButtonFocusScaling[]) {
                add(
                  buttonCompatFrameClassName({
                    variant,
                    emphasis,
                    size,
                    fill,
                    iconPosition,
                    focusScaling,
                    ...state,
                  }),
                )
              }
            }
          }
          const isDisabled = Boolean(state.disabled) || Boolean(state.loading)
          const ctx: ButtonContentClassProps = {
            variant,
            emphasis,
            size,
            isDisabled,
            customTextClass: contrastTextClassFor(state.backgroundColor),
          }
          for (const lineHeightDisabled of [true, false]) {
            add(buttonCompatTextClassName({ ...ctx, lineHeightDisabled }))
          }
          add(buttonCompatIconClassName(ctx))
          add(buttonCompatSpinnerClassName(ctx))
        }
      }
    }
  }
  return all
}

/** The compound tokens the joined-cell literals spell out. */
function literalScopedTokens(): Set<string> {
  const tokens = new Set<string>()
  for (const table of [FRAME_JOINED_CELLS, TEXT_JOINED_CELLS]) {
    for (const row of Object.values(table)) {
      for (const cell of Object.values(row)) {
        for (const cls of cell.split(' ').filter(Boolean)) {
          if (isScopedClass(cls)) {
            tokens.add(cls)
          }
        }
      }
    }
  }
  return tokens
}

/** The compound tokens `joinScopes` derives from the `ScopedCell` data. */
function derivedScopedTokens(): Set<string> {
  const tokens = new Set<string>()
  const tables = [
    [FRAME_VARIANT_EMPHASIS, FRAME_SCOPE_PREFIXES] as const,
    [TEXT_VARIANT_EMPHASIS, TEXT_SCOPE_PREFIXES] as const,
  ]
  for (const [table, prefixes] of tables) {
    for (const row of Object.values(table)) {
      for (const cell of Object.values(row)) {
        for (const cls of joinScopes(cell, prefixes).split(' ').filter(Boolean)) {
          if (isScopedClass(cls)) {
            tokens.add(cls)
          }
        }
      }
    }
  }
  return tokens
}

/* ------------------------------ the CSS build ------------------------------ */

/** Unescape a CSS class selector (`.hover\:bg-x:hover` → `hover:bg-x`). */
function unescapeClass(raw: string): string {
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === '\\') {
      i++
      out += i < raw.length ? raw[i] : ''
    } else {
      out += raw[i]
    }
  }
  return out
}

/**
 * A single-class selector (`.hover\:bg-x`), escapes ignored when looking for
 * combinators — a variant utility's scoping arrives as nested `&…` parts, so
 * the outer selector is always the bare class.
 */
function plainUtilityClass(selector: string): string | undefined {
  if (!selector.startsWith('.')) {
    return undefined
  }
  const withoutEscapes = selector.slice(1).replaceAll(/\\./g, 'x')
  return /[\s>+~:[\]()&*,]/.test(withoutEscapes) ? undefined : unescapeClass(selector.slice(1))
}

/**
 * Tailwind always terminates declarations with `;`, while nested selectors and
 * at-rule preludes (`&:is(…)`, `@media (hover: hover)`) are followed by `{`.
 * Requiring a `;` with no intervening brace separates the two.
 */
function hasDeclaration(subtree: string): boolean {
  return /[-a-zA-Z]+\s*:[^;{}]*;/.test(subtree)
}

/**
 * Class names the compiled stylesheet actually declares something for.
 *
 * Tailwind v4 emits variant utilities as NESTED rules — `.hover\:bg-x { &:hover
 * { @media (hover: hover) { background-color: … } } }` — so a rule's own body
 * holds no declarations and the check has to look at the whole subtree. A
 * selector counts only if a declaration exists somewhere beneath it, so an empty
 * rule cannot pass for coverage.
 */
function declaredClasses(css: string): Set<string> {
  const declared = new Set<string>()
  const walk = (block: string): void => {
    let i = 0
    let preludeStart = 0
    while (i < block.length) {
      const ch = block[i]
      if (ch === '{') {
        const prelude = block.slice(preludeStart, i).trim()
        const bodyStart = i + 1
        let depth = 1
        let j = bodyStart
        while (j < block.length && depth > 0) {
          if (block[j] === '{') {
            depth++
          } else if (block[j] === '}') {
            depth--
          }
          j++
        }
        const body = block.slice(bodyStart, depth === 0 ? j - 1 : j)
        if (hasDeclaration(body)) {
          for (const part of prelude.split(',')) {
            const cls = plainUtilityClass(part.trim())
            if (cls !== undefined) {
              declared.add(cls)
            }
          }
        }
        walk(body)
        i = j
        preludeStart = i
        continue
      }
      if (ch === '}' || ch === ';') {
        preludeStart = i + 1
      }
      i++
    }
  }
  walk(css)
  return declared
}

interface CompiledSheet {
  css: string
  candidates: string[]
  declared: Set<string>
}

/** A scan root in Tailwind's own shape (`compile()` returns these). */
interface ScanSource {
  base: string
  pattern: string
  negated: boolean
}

/**
 * Exactly the `@source` root a consumer registers for this package. Nothing
 * else: see the file header on why the scan is deliberately not widened.
 */
const MYCELIUM_SOURCE: ScanSource = { base: myceliumSrc, pattern: '**/*', negated: false }

function scanCandidates(sources: ScanSource[]): string[] {
  return new Scanner({ sources }).scan()
}

async function compileFromScannedSources(): Promise<CompiledSheet> {
  const { build } = await consumerEntry()
  const candidates = scanCandidates([MYCELIUM_SOURCE])
  const css = build(candidates)
  return { css, candidates, declared: declaredClasses(css) }
}

/* ------------------------- what the consumer scans ------------------------- */

interface ConsumerEntry {
  /** The scan roots the entry registers. */
  roots: ScanSource[]
  /** The stylesheet the entry's own `@import` graph produces for a candidate list. */
  build: (candidates: string[]) => string
}

let entryCompile: Promise<ConsumerEntry> | undefined

/**
 * The real consumer entry, compiled ONCE and kept — compiler included.
 *
 * Roots are composed the way `@tailwindcss/vite` composes them: the implicit
 * root — the app's vite root, unless the entry pins one with `source(…)` — then
 * every `@source` it declares. Keeping `build` beside them is what puts the
 * entry's `@import` graph under test rather than a mirror of it: the rules
 * assertion 2 looks for can only come from what this file actually imports.
 */
function consumerEntry(): Promise<ConsumerEntry> {
  entryCompile ??= (async () => {
    const { root, sources, build } = await compile(readFileSync(webTailwindEntry, 'utf8'), {
      base: dirname(webTailwindEntry),
      loadStylesheet,
    })
    const implicit: ScanSource[] =
      root === 'none'
        ? []
        : root === null
          ? [{ base: webAppRoot, pattern: '**/*', negated: false }]
          : [{ ...root, negated: false }]
    return { roots: [...implicit, ...sources], build }
  })()
  return entryCompile
}

/** Where a root's glob resolves to, absolute — glob segments left intact. */
function rootPath(source: ScanSource): string {
  return resolve(source.base, source.pattern)
}

/** One glob path segment against one literal one. Segments hold no separator. */
function segmentMatches(segment: string, literal: string): boolean {
  if (!/[*?[{]/.test(segment)) {
    return segment === literal
  }
  let source = ''
  let braces = 0
  let inClass = false
  for (const ch of segment) {
    if (inClass) {
      source += ch
      inClass = ch !== ']'
    } else if (ch === '*') {
      source += '.*'
    } else if (ch === '?') {
      source += '.'
    } else if (ch === '[') {
      source += '['
      inClass = true
    } else if (ch === '{') {
      braces++
      source += '(?:'
    } else if (ch === '}' && braces > 0) {
      braces--
      source += ')'
    } else if (ch === ',' && braces > 0) {
      source += '|'
    } else {
      source += ch.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
    }
  }
  return new RegExp(`^${source}$`).test(literal)
}

/**
 * Whether a resolved root glob can scan `dir` — matching paths inside it, or
 * resolving to an ancestor of it.
 *
 * Compared segment by segment with glob segments matched AS globs, not string-
 * compared: a root can still carry wildcards after resolution, and those neither
 * equal, prefix, nor are prefixed by a literal path. The implicit vite root
 * always resolves to a recursive wildcard under the app root, and an `@source`
 * over `packages` with a wildcard package segment is a genuinely wider scan —
 * both reach mycelium and both must pass, or the gate fails a build that does
 * cover it. A `**` segment descends arbitrarily deep, so a prefix that matches up
 * to one reaches everything below.
 */
function globReaches(glob: string, dir: string): boolean {
  const globSegments = glob.split(sep).filter(Boolean)
  const dirSegments = dir.split(sep).filter(Boolean)
  for (let i = 0; i < Math.min(globSegments.length, dirSegments.length); i++) {
    const segment = globSegments[i] ?? ''
    if (segment === '**') {
      return true
    }
    if (!segmentMatches(segment, dirSegments[i] ?? '')) {
      return false
    }
  }
  return true
}

/**
 * The POSITIVE roots that can scan `dir` — resolving to it, beneath it, or to an
 * ancestor of it. Matches resolved absolute globs rather than the written
 * `@source` text, so any spelling of the same (or a broader) root still counts,
 * while a root that only reaches a sibling tree — the app's own sources included
 * — can't stand in for coverage of `dir`. Negations don't cover anything, so they
 * are not candidates here; `consumerScan` re-applies them.
 */
function positiveRootsReaching(sources: ScanSource[], dir: string): ScanSource[] {
  return sources.filter((source) => !source.negated && globReaches(rootPath(source), dir))
}

/**
 * The scan the consumer's build performs over `dir`, composed the way
 * `@tailwindcss/vite` composes it: hand the sources to Oxide and let IT apply the
 * exclusions. `@source not` survives `compile()` as `SourceEntry.negated`, the
 * vite plugin concatenates those entries into the `Scanner` untouched, and Oxide
 * subtracts them from the globs it walks — so no exclusion logic is reimplemented
 * here.
 *
 * Positive roots are narrowed to the ones reaching `dir`, so a coincidental
 * spelling in the app's own tree can't stand in for coverage this package owes.
 * Negations are passed through in full: they can be based anywhere and still bite
 * (`@source not` in `apps/web/src` reaching up into `packages/mycelium/src` does),
 * and one that covers `dir` empties the scan and fails the gate rather than being
 * dropped — which is the whole point of the gate.
 */
function consumerScan(sources: ScanSource[], dir: string): { positives: ScanSource[]; candidates: Set<string> } {
  const positives = positiveRootsReaching(sources, dir)
  const negations = sources.filter((source) => source.negated)
  return { positives, candidates: new Set(scanCandidates([...positives, ...negations])) }
}

/* ------------------------ the matcher's own contract ------------------------ */

// `segmentMatches`/`globReaches` are this gate's only judgement call — every
// other assertion is a set comparison over compiler output. The real apps/web
// roots are literal paths today, so nothing above exercises the glob branches
// (wildcards, braces, char classes); these pin them directly before any real
// config relies on them.

/** Join path segments with the platform separator, absolute. */
function abs(...segments: string[]): string {
  return sep + segments.join(sep)
}

describe('segmentMatches', () => {
  it('matches a literal segment only against itself', () => {
    expect(segmentMatches('mycelium', 'mycelium')).toBe(true)
    expect(segmentMatches('mycelium', 'mycelia')).toBe(false)
    expect(segmentMatches('mycelium', 'mycelium2')).toBe(false)
  })

  it('compares glob-free segments as strings, never as regex', () => {
    expect(segmentMatches('a.b', 'a.b')).toBe(true)
    expect(segmentMatches('a.b', 'axb')).toBe(false)
    expect(segmentMatches('a+b', 'ab')).toBe(false)
  })

  it('escapes regex metacharacters in segments that do hold glob syntax', () => {
    expect(segmentMatches('*.css', 'tailwind.css')).toBe(true)
    expect(segmentMatches('*.css', 'tailwindxcss')).toBe(false)
    expect(segmentMatches('a*+b', 'aX+b')).toBe(true)
    expect(segmentMatches('a*+b', 'aXb')).toBe(false)
  })

  it('* matches any run of characters, including none', () => {
    expect(segmentMatches('*', 'anything')).toBe(true)
    expect(segmentMatches('my*um', 'mycelium')).toBe(true)
    expect(segmentMatches('my*um', 'myum')).toBe(true)
    expect(segmentMatches('my*um', 'mycelia')).toBe(false)
  })

  it('? matches exactly one character', () => {
    expect(segmentMatches('sr?', 'src')).toBe(true)
    expect(segmentMatches('sr?', 'sr')).toBe(false)
    expect(segmentMatches('sr?', 'srcs')).toBe(false)
  })

  it('brace groups match any alternative, and only inside the braces', () => {
    expect(segmentMatches('{a,b}', 'a')).toBe(true)
    expect(segmentMatches('{a,b}', 'b')).toBe(true)
    expect(segmentMatches('{a,b}', 'c')).toBe(false)
    expect(segmentMatches('{a,b}', 'a,b')).toBe(false)
    expect(segmentMatches('{web,mobile}-app', 'web-app')).toBe(true)
    expect(segmentMatches('{web,mobile}-app', 'mobile-app')).toBe(true)
    expect(segmentMatches('{web,mobile}-app', 'cli-app')).toBe(false)
    // a comma outside any brace group is a literal comma
    expect(segmentMatches('a*,b', 'aX,b')).toBe(true)
    expect(segmentMatches('a*,b', 'aXb')).toBe(false)
  })

  it('character classes match one character from the set or range', () => {
    expect(segmentMatches('[ab]c', 'ac')).toBe(true)
    expect(segmentMatches('[ab]c', 'bc')).toBe(true)
    expect(segmentMatches('[ab]c', 'cc')).toBe(false)
    expect(segmentMatches('[ab]c', 'abc')).toBe(false)
    expect(segmentMatches('v[0-9]', 'v4')).toBe(true)
    expect(segmentMatches('v[0-9]', 'vx')).toBe(false)
  })
})

describe('globReaches', () => {
  const dir = abs('repo', 'packages', 'mycelium', 'src')

  it('a literal root reaches the dir itself, an ancestor of it, or a descendant', () => {
    expect(globReaches(dir, dir)).toBe(true)
    // root above dir: scanning `packages` recursively covers mycelium/src
    expect(globReaches(abs('repo', 'packages'), dir)).toBe(true)
    // root below dir: scans part of it, still coverage
    expect(globReaches(abs('repo', 'packages', 'mycelium', 'src', 'unicon'), dir)).toBe(true)
  })

  it('a root over a disjoint tree does not reach', () => {
    expect(globReaches(abs('repo', 'apps', 'web'), dir)).toBe(false)
    expect(globReaches(abs('repo', 'packages', 'tailwind', 'src'), dir)).toBe(false)
  })

  it('** descends arbitrarily deep from where it appears', () => {
    expect(globReaches(abs('repo', '**', '*'), dir)).toBe(true)
    expect(globReaches(abs('repo', 'packages', '**'), dir)).toBe(true)
    // but only after the literal prefix matched
    expect(globReaches(abs('repo', 'apps', '**'), dir)).toBe(false)
  })

  it('glob segments match as globs, not as strings', () => {
    // a wildcard package segment is a genuinely wider scan and must pass
    expect(globReaches(abs('repo', 'packages', '*', 'src'), dir)).toBe(true)
    expect(globReaches(abs('repo', '{packages,apps}', 'mycelium'), dir)).toBe(true)
    expect(globReaches(abs('repo', 'packages', 'myceli?m', 'src'), dir)).toBe(true)
    // and a wildcard that resolves elsewhere still fails
    expect(globReaches(abs('repo', 'apps', '*', 'src'), dir)).toBe(false)
    expect(globReaches(abs('repo', '{apps,labs}', 'mycelium'), dir)).toBe(false)
  })
})

/* --------------------------------- the gate -------------------------------- */

describe('the joined-cell literals and the ScopedCell data describe the same tokens', () => {
  it('literal set === runtime-derived set', () => {
    expect([...literalScopedTokens()].sort()).toEqual([...derivedScopedTokens()].sort())
  })
})

describe('every interaction class the web leg emits resolves to a compiled CSS rule', () => {
  // One Oxide scan + one Tailwind build shared by both assertions below; each
  // still asserts on its own thing.
  let sheet: CompiledSheet
  beforeAll(async () => {
    sheet = await compileFromScannedSources()
  })

  it('compiles the consumer stylesheet from a real Oxide scan of mycelium sources', () => {
    const { css, candidates, declared } = sheet
    expect(candidates.length).toBeGreaterThan(0)
    expect(css.length).toBeGreaterThan(0)
    expect(declared.size).toBeGreaterThan(0)
  })

  it('generates a rule for every scoped class in the emitted matrix', () => {
    const { declared, candidates } = sheet
    const scoped = [...emittedClasses()].filter(isScopedClass).sort()
    // Guard against the matrix silently collapsing to nothing to assert on.
    expect(scoped.length).toBeGreaterThanOrEqual(56)

    const missing = scoped.filter((cls) => !declared.has(cls))
    const diagnosis = missing.map((cls) => `${cls} (scanner candidate: ${candidates.includes(cls) ? 'yes' : 'NO'})`)
    expect(
      diagnosis,
      'these classes are emitted into the DOM but Tailwind generated no rule for them — they paint nothing. ' +
        'A "scanner candidate: NO" means the class exists nowhere in the scanned source text, so Oxide never saw it: ' +
        'add it to FRAME_JOINED_CELLS / TEXT_JOINED_CELLS in ./variantEmphasisHash.',
    ).toEqual([])
  })
})

/* ----------------------- the margin cascade (INFRA-3661) ----------------------- */

// `dimensions.ts` rests its m+side co-emission on Tailwind ordering the margin
// utilities m < mx/my < sides in the compiled CSS — the rendered-class tests
// can only assert co-presence, so which margin PAINTS is invisible to them.
// This pins the declaration order in the real consumer entry, making that
// precedence comment load-bearing instead of assumed. The tiers are the
// expectation; the class for each prop is derived by calling the dimension
// compiler (per the editors' note above, never spelled), one shared token
// value across all seven utilities so the order under test is purely the
// utility tier, never the value.
const MARGIN_CASCADE_TIERS = [
  ['m'],
  ['mx', 'my'],
  ['mt', 'mb', 'ml', 'mr'],
] as const satisfies readonly (readonly (keyof ButtonCompatDimensionProps)[])[]

function marginClassOf(prop: (typeof MARGIN_CASCADE_TIERS)[number][number]): string {
  const props: ButtonCompatDimensionProps = {}
  props[prop] = '$spacing8'
  const classes = buttonCompatDimensionClasses(props)
  expect(classes).toHaveLength(1)
  return classes[0] ?? ''
}

// The disabled label carries BOTH colour classes (cn has no [color:...]
// conflict group), so which paints is pure declaration order. This pins the
// order the ButtonCompat.test.tsx disabled-token case relies on.
describe('the compiled CSS declares the disabled palette after the Button.Text token twin', () => {
  it('text-neutral2 outdeclares the neutral3 token twin, so a disabled label paints neutral2', async () => {
    const { build } = await compile(readFileSync(webTailwindEntry, 'utf8'), {
      base: dirname(webTailwindEntry),
      loadStylesheet,
    })
    // Composed at runtime: a literal twin in this scanned tree would register
    // as scanner-visible in the native parity harness's coverage model.
    const token = 'neutral3'
    const tokenTwin = `[color:var(--stext-${token})]`
    const css = build(['text-neutral2', tokenTwin])
    const ruleIndexOf = (cls: string): number => {
      const index = css.indexOf(`.${cls.replaceAll(/[^a-zA-Z0-9-]/g, String.raw`\$&`)}`)
      expect(index, `the entry compiled no rule for ${cls}`).toBeGreaterThanOrEqual(0)
      return index
    }
    expect(ruleIndexOf('text-neutral2')).toBeGreaterThan(ruleIndexOf(tokenTwin))
  })
})

describe('the compiled CSS orders the margin utilities m < mx/my < sides', () => {
  it('each tier declares after the one before it, so the more specific margin paints', async () => {
    // A fresh compile of the same real entry, fed the seven derived classes as
    // candidates directly — this asserts Tailwind's utility registration
    // order, which no scan root can change, so no scan is involved.
    const { build } = await compile(readFileSync(webTailwindEntry, 'utf8'), {
      base: dirname(webTailwindEntry),
      loadStylesheet,
    })
    const tiers = MARGIN_CASCADE_TIERS.map((tier) => tier.map(marginClassOf))
    const css = build(tiers.flat())
    const ruleIndexOf = (cls: string): number => {
      // The selector as Tailwind writes it: every non-alphanumeric escaped.
      const index = css.indexOf(`.${cls.replaceAll(/[^a-zA-Z0-9-]/g, String.raw`\$&`)}`)
      expect(index, `the entry compiled no rule for ${cls}`).toBeGreaterThanOrEqual(0)
      return index
    }
    const indexed = tiers.map((tier) => tier.map((cls) => ({ cls, index: ruleIndexOf(cls) })))
    for (let tier = 1; tier < indexed.length; tier++) {
      for (const earlier of indexed[tier - 1] ?? []) {
        for (const later of indexed[tier] ?? []) {
          expect(
            later.index,
            `${later.cls} must be declared after ${earlier.cls} — the cascade is what lets the more ` +
              'specific margin win when both classes are emitted (dimensions.ts precedence comment)',
          ).toBeGreaterThan(earlier.index)
        }
      }
    }
  })
})

describe('the app that ships the web leg scans mycelium for those classes', () => {
  it('the apps/web Tailwind entry registers a root that scans them', async () => {
    const { roots } = await consumerEntry()
    const registered = roots.map((source) => `${source.negated ? '!' : ''}${rootPath(source)}`).join('\n  ')
    const { positives, candidates } = consumerScan(roots, myceliumSrc)
    expect(
      positives.length,
      `apps/web/src/tailwind.css registers no scan root reaching ${myceliumSrc}, so Tailwind prunes every ` +
        `mycelium class from the app's CSS while this file's own scan stays green. Roots it registers:\n  ${registered}`,
    ).toBeGreaterThan(0)

    const scoped = [...emittedClasses()].filter(isScopedClass).sort()
    expect(scoped.length).toBeGreaterThanOrEqual(56)

    const unscanned = scoped.filter((cls) => !candidates.has(cls))
    expect(
      unscanned,
      "these classes are not candidates in apps/web's own build, so the app's Tailwind generates no rule for them " +
        'however green the mycelium-scoped scan above is: in apps/web/src/tailwind.css, widen the @source root back ' +
        `to cover ${myceliumSrc} — or drop the @source not (marked "!" below) that excludes it. Roots it ` +
        `registers:\n  ${registered}`,
    ).toEqual([])
  })
})
