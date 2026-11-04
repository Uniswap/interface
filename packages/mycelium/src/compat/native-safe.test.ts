/**
 * Drift + rule gates for the native-safe compat safelist (INFRA-3253).
 *
 * The point of the artifact is that it is DERIVED: regenerating the web
 * safelist and re-running the filter must reproduce the checked-in file
 * byte-for-byte, and the exclusion must come from the rule rather than from a
 * captured list of class names — a generator change that adds a new theme
 * composite must be excluded by construction, not silently un-filtered.
 *
 * Class-name literals in this file are candidates to the web scanner and are
 * kept synthetic on purpose (see `emitted-classes.ts` PROBE_LEAK_CANARIES for
 * the same hazard); mobile's entry excludes `*.test.ts` from its scan outright.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { compatClassesFileContents } from './closed-set-manifest'
import { REACHABLE_VARIANT_PREFIXES, varIndirectionClasses } from './inline-style'
import {
  candidateSegments,
  nativeCompatClassesFileContents,
  nativeUnsafeCensus,
  nativeUnsafeReason,
  parseSafelistFile,
} from './native-safe'
import { THEME_VARIANTS } from './variant-codes'

const GEN_FILE = join(__dirname, '..', '..', 'compat-classes.gen.txt')
const NATIVE_GEN_FILE = join(__dirname, '..', '..', 'compat-classes.native.gen.txt')

describe('native-safe compat safelist', () => {
  it('checked-in compat-classes.native.gen.txt matches a fresh filter byte-for-byte', () => {
    expect(readFileSync(NATIVE_GEN_FILE, 'utf8')).toBe(nativeCompatClassesFileContents(readFileSync(GEN_FILE, 'utf8')))
  })

  it('filters the CHECKED-IN generator output, so regeneration cannot desync the two artifacts', () => {
    expect(readFileSync(GEN_FILE, 'utf8')).toBe(compatClassesFileContents())
  })

  it('excludes exactly the three tiers native cannot carry and nothing else', () => {
    const web = parseSafelistFile(readFileSync(GEN_FILE, 'utf8'))
    const native = parseSafelistFile(readFileSync(NATIVE_GEN_FILE, 'utf8'))
    expect({
      web: web.length,
      native: native.length,
      excluded: web.length - native.length,
      census: nativeUnsafeCensus(web),
    }).toEqual({
      // INFRA-3548 (landed on main) grows the named-group row to 9 twins
      // (cursor), +10 web var-twin entries (one per registered named
      // prefix), native untouched (web 9451 + 10 = 9461, native 1112,
      // excluded 8349).
      // INFRA-3490 (landed on main) added the 2 pointerEvents box-polyfill children
      // classes (`[&>*]:`-variant, base tier). They pass the three filter
      // rules and flow into the native artifact like the `-webkit-*` entries
      // — inert there (uniwind drops child selectors, pinned in the flex
      // native ledger's `[&>*]:*` family), while the native leg carries the
      // real RN box value through its style lane. They are not
      // theme-composed or twin-classified, so they add to web/native evenly
      // and leave the twin census below unaffected by INFRA-3490.
      // INFRA-3496 (landed on main) adds 13 more web entries on top of that:
      // 11 base-tier enumerations (whiteSpace wrap/initial, display grid
      // pair, the overflow-wrap / text-decoration long-tail singles) that
      // flow into the native artifact, plus those two properties' base var
      // twins (web-only).
      // Combined base: web 9461 + 2 (INFRA-3490) + 13 (INFRA-3496) = 9476,
      // native 1112 + 2 (INFRA-3490) + 11 (INFRA-3496) = 1125, excluded
      // 8349 + 2 = 8351.
      // INFRA-3274 adds 4 border-width ladder values × 5 border
      // prefixes = 20 base-tier enumerations. Plain entries (not
      // theme-composed, not twins), so they flow into the native artifact
      // evenly and leave the exclusion census untouched.
      // INFRA-3244 regenerates the text-compat mirror with ui/src's
      // chain_57073, adding its text-colour enumeration: a plain base-tier
      // entry, so +1 web and +1 native, exclusion census untouched.
      // INFRA-3487 (landed on main) registers the TouchableTextLink compat's
      // `[text-underline-position:from-font]` fixed class via
      // `touchableTextLinkFixedCompatClasses()`. It is a plain base-tier
      // literal (no theme variant, no var indirection), so it flows straight
      // into the native artifact too and `excluded` is unchanged: web
      // 9476 + 1 = 9477, native 1125 + 1 = 1126, excluded stays 8351.
      // INFRA-3330 (landed on main) adds the 8 animation-longhand base var
      // twins (`[animation-*:var(--c-*)]`): web-only like every twin, so web
      // and the var-twin census grow by 8 and the native artifact is
      // untouched: web 9477 + 8 = 9485, native 1126, excluded 8351 + 8 =
      // 8359.
      // Combining both branches' additions on top of that shared 9485/1126/8359
      // baseline: INFRA-3274 (+20 web, +20 native, excluded
      // untouched) and INFRA-3244 (+1 web, +1 native, excluded untouched) sum to
      // +21 web / +21 native / +0 excluded (web 9485 + 21 = 9506, native
      // 1126 + 21 = 1147, excluded stays 8359). INFRA-3589 (landed on main
      // separately) adds overflow-x / overflow-y to VARIANT_TWIN_PROPS: +204
      // web entries (2 props × 102 reachable variant prefixes), all web-only —
      // +180 var-twin, +24 outer-theme (the <theme>:<pseudo>: composites),
      // native untouched (excluded +204). Merging the two independent deltas
      // onto the 9485/1126/8359 baseline: web 9485 + 21 + 204 = 9710, native
      // 1126 + 21 + 0 = 1147, excluded 8359 + 0 + 204 = 8563.
      // INFRA-3604 (landed on main) adds the 3 directional enter presets
      // (`animate-spore-enter-fade-in-left`/`-right`/`-below`): plain
      // base-tier entries like the existing presets, so they flow into the
      // native artifact evenly and `excluded` is unchanged: web 9710 + 3 =
      // 9713, native 1147 + 3 = 1150.
      // INFRA-3654 (landed on main) adds the border side-color quartet
      // (border-bottom-color, then the top/left/right sides) to
      // VARIANT_TWIN_PROPS: +408 web entries (4 props × 102 reachable
      // variant prefixes), all web-only — +360 var-twin, +48 outer-theme
      // (the <theme>:<pseudo>: composites), native untouched: web
      // 9713 + 408 = 10121, native 1150, excluded 8563 + 408 = 8971.
      // INFRA-3491 adds the 6 ScrollView fixed-frame entries
      // (the per-axis overflow quartet, the translateZ compositing hint and
      // the -webkit momentum-scrolling declaration). All base-tier literals
      // (distinct from INFRA-3589's variant-prefixed twins), they pass the
      // three filter rules and flow into the native artifact like the earlier
      // `-webkit-*` entries — inert there (the native leg mounts a real RN
      // ScrollView that owns its base), so web and native grow evenly:
      // web 10121 + 6 = 10127, native 1150 + 6 = 1156, excluded stays 8971.
      // The curated Text wordBreak surface adds the 4 word-break base-tier
      // enumerations: plain base-tier literals, so they flow into the native
      // artifact evenly — inert there like word-wrap (RN has no word-break
      // rendering path, pinned in the Text native ledger). Registering
      // word-break in ARBITRARY_VAR_PROPS / VARIANT_TWIN_PROPS ('unset' and
      // variant pools ride the var twins) adds 1 base var twin + 102 variant
      // twins (1 prop × 102 reachable variant prefixes), all web-only like
      // every twin. web 10127 + 4 + 103 = 10234, native 1156 + 4 = 1160,
      // excluded 8971 + 103 = 9074.
      // INFRA-3673 (landed on main separately) admits the
      // overscroll-behavior family and WebkitMaskImage to the shared long
      // tail: 9 base-tier enumerations (3 overscroll props ×
      // auto/contain/none) flow into the native artifact evenly (inert
      // there — RN has no overscroll-behavior rendering path — dropped and
      // dev-warned by the legs), plus the 4 new properties' base var twins,
      // web-only like every twin. Merging the two independent deltas onto
      // the 10127/1156/8971 baseline: web 10127 + 4 + 103 + 13 = 10247,
      // native 1156 + 4 + 9 = 1169, excluded 8971 + 103 + 4 = 9078.
      // INFRA-3506 item 4 adds the 3 contrast tokens (neutral1Contrast /
      // surface1Contrast / surface3Contrast) to the ui/src theme; their
      // text-colour enumerations are plain base-tier entries (like
      // INFRA-3244's chain_57073), so web and native grow evenly and no
      // twin or theme composite appears: web 10247 + 3 = 10250, native
      // 1169 + 3 = 1172, excluded stays 9078.
      // INFRA-3825 adds `transition` to VARIANT_TWIN_PROPS (it already had a
      // base-tier twin since INFRA-3330, so no new base twin here) — 1 prop ×
      // 102 reachable variant prefixes = 102 new web-only variant twins,
      // native untouched: web 10250 + 102 = 10352, native stays 1172,
      // excluded 9078 + 102 = 9180.
      // INFRA-3808 adds Flex's `gridArea` as a base-tier arbitrary-property
      // twin (`[grid-area:var(--c-ga)]`) — web-only, no native leg, so
      // web 10352 + 1 = 10353, native stays 1172, excluded 9180 + 1 = 9181.
      // The TouchableArea frame's default web transition is a plain base-tier
      // fixed class, so it flows into the native artifact evenly (inert there):
      // web 10353 + 1 = 10354, native 1172 + 1 = 1173, excluded stays 9181.
      // The `background` SHORTHAND joins VARIANT_TWIN_PROPS (the accordion
      // trigger's live hoverStyle/focusStyle shape; its base var twin
      // already existed) — 1 prop × 102 reachable variant prefixes = 102 new
      // web-only variant twins, native untouched: web 10354 + 102 = 10456,
      // native stays 1173, excluded 9181 + 102 = 9283.
      // `overflow-clip` closes the last `OverflowValue` member the base pool
      // never enumerated (the Explore stocks issuer panel's `$platform-web`
      // clip). A plain base-tier literal, so it flows into the native artifact
      // evenly — inert there, like `overflow-auto`: RN honours only
      // visible/hidden/scroll, so the native leg drops the value and never
      // emits the class. web 10456 + 1 = 10457, native 1173 + 1 = 1174,
      // excluded stays 9283.
      // Whole-pixel line-heights then collapse `[line-height:23.4px]` (body1)
      // into the `[line-height:24px]` subheading1 already emits, so one
      // base-tier class disappears from both artifacts: web 10457 - 1 = 10456,
      // native 1174 - 1 = 1173, excluded stays 9283.
      // Pools brand green adds four plain theme entries (text, outline, background, border)
      // to both artifacts, leaving the exclusion census unchanged.
      // Deleting the Blast chain drops its one `chain_81457` text-colour class
      // from both artifacts: web 10460 - 1 = 10459, native 1177 - 1 = 1176.
      web: 10459,
      native: 1176,
      excluded: 9283,
      // negated-theme is 0 since INFRA-3263 respelled the light pool from
      // `not-dark:` to `light:` — the rule stays as vocabulary armor. The old
      // tier reclassified: 474 `light:<pseudo>:` composites → outer-theme,
      // 79 simple `light:` twins → var-twin, and the 3 literal `light:`
      // box-shadow entries now flow into the native artifact (1103 → 1106).
      // var-twin 7401 (post-INFRA-3548 main) + 2 (INFRA-3496's overflowWrap /
      // textDecoration base var twins) + 8 (INFRA-3330's animation-longhand
      // base var twins) = 7411, + 180 (INFRA-3589, landed on main
      // separately, overflow-x / overflow-y variant-prefixed twins) = 7591,
      // + 360 (INFRA-3654's border side-color quartet twins) = 7951,
      // + 91 (word-break: 90 variant twins + the base var twin) = 8042,
      // + 4 (INFRA-3673's overscroll-behavior trio + WebkitMaskImage base
      // var twins, landed on main separately) = 8046. INFRA-3825's 102 new
      // `transition` variant twins split 12 outer-theme (the 12
      // `<theme>:<pseudo>:` composite prefixes: dark:/light: × 6 pseudos
      // each) / 90 var-twin (every other reachable prefix) = 8046 + 90 = 8136,
      // + 1 (INFRA-3808's base-tier `grid-area` twin) = 8137, + 90
      // (`background`'s variant twins, the same split as transition's) =
      // 8227.
      // outer-theme 948 (post-INFRA-3548 main, untouched by INFRA-3330) + 24
      // (INFRA-3589's <theme>:<pseudo>: composites) + 48 (INFRA-3654's) =
      // 1020, + 12 (word-break's <theme>:<pseudo>: composites) = 1032
      // (INFRA-3673 adds no theme composites — its var twins are
      // base-tier only), + 12 (INFRA-3825's, above) = 1044, + 12
      // (`background`'s) = 1056.
      census: { 'outer-theme': 1056, 'negated-theme': 0, 'var-twin': 8227 },
    })
  })

  it('keeps every simple theme entry that is not a var twin — the working native theme tier', () => {
    const native = new Set(parseSafelistFile(readFileSync(NATIVE_GEN_FILE, 'utf8')))
    const web = parseSafelistFile(readFileSync(GEN_FILE, 'utf8'))
    const expectedKept: Record<string, number> = { dark: 10, light: 3 }
    for (const theme of THEME_VARIANTS) {
      const simple = web.filter((entry) => {
        const { variants } = candidateSegments(entry)
        return variants.length === 1 && variants[0] === theme
      })
      expect({ theme, count: simple.length }).toEqual({ theme, count: theme === 'dark' ? 98 : 91 })
      const dropped = simple.filter((entry) => !native.has(entry))
      expect({
        theme,
        kept: simple.length - dropped.length,
        droppedForAnotherReason: dropped.filter((entry) => nativeUnsafeReason(entry) !== 'var-twin'),
      }).toEqual({ theme, kept: expectedKept[theme], droppedForAnotherReason: [] })
    }
  })

  it('classifies by theme vocabulary, not by spelling — a new theme composite is excluded by construction', () => {
    // Synthetic candidates: not safelist members, so the rule is exercised
    // independently of what the generator happens to enumerate today.
    for (const theme of THEME_VARIANTS) {
      expect(nativeUnsafeReason(`${theme}:hover:some-future-utility`)).toBeDefined()
      expect(nativeUnsafeReason(`${theme}:some-future-media:some-future-utility`)).toBeDefined()
    }
    expect(nativeUnsafeReason('dark:some-future-utility')).toBeUndefined()
    // Theme LAST keeps its gate: uniwind's inner rule is the one that sets it.
    expect(nativeUnsafeReason('hover:dark:some-future-utility')).toBeUndefined()
    // Every `not-` theme spelling dies at the Tailwind layer regardless of position.
    expect(nativeUnsafeReason('not-dark:some-future-utility')).toBe('negated-theme')
    expect(nativeUnsafeReason('hover:not-dark:some-future-utility')).toBe('negated-theme')
  })

  it('classifies var twins by matrix membership, not by spelling', () => {
    expect(nativeUnsafeReason('p-[var(--c-p)]')).toBe('var-twin')
    expect(nativeUnsafeReason('active:bg-[color:var(--ca-bg)]')).toBe('var-twin')
    expect(nativeUnsafeReason('dark:gap-[var(--ck-gap)]')).toBe('var-twin')
    // Named-group reveal twins (INFRA-3481) are web-only like every twin.
    expect(nativeUnsafeReason('group-hover/item:[display:var(--cghi-di)]')).toBe('var-twin')
    // A `var(--c` SPELLING is not twin identity: these read theme/token
    // variables the native stylesheet declares (or deliberately does not) and
    // must survive the filter — a regex rule would sweep them in.
    expect(nativeUnsafeReason('[outline-color:var(--color-transparent)]')).toBeUndefined()
    expect(nativeUnsafeReason('dark:[outline-color:var(--color-surface1-hovered-dark)]')).toBeUndefined()
    expect(nativeUnsafeReason('[color:var(--stext-neutral1)]')).toBeUndefined()
  })

  it('keeps the theme censuses stable: a theme-composed twin stays classified by its theme rule', () => {
    expect(nativeUnsafeReason('dark:active:bg-[color:var(--cka-bg)]')).toBe('outer-theme')
    expect(nativeUnsafeReason('light:active:bg-[color:var(--cna-bg)]')).toBe('outer-theme')
    // A simple `light:` twin is theme-LAST, so the var-twin rule owns it —
    // the `light:` variant itself compiles natively since INFRA-3263.
    expect(nativeUnsafeReason('light:bg-[color:var(--cn-bg)]')).toBe('var-twin')
    // The retired negation spelling stays excluded by construction.
    expect(nativeUnsafeReason('not-dark:bg-[color:var(--cn-bg)]')).toBe('negated-theme')
  })

  it('excludes every member of the generated twin matrix by construction', () => {
    for (const prefix of ['', ...REACHABLE_VARIANT_PREFIXES]) {
      expect(varIndirectionClasses(prefix).filter((cls) => nativeUnsafeReason(cls) === undefined)).toEqual([])
    }
  })

  it('splits variant segments without being fooled by colons inside arbitrary values', () => {
    expect(candidateSegments('dark:active:bg-[color:var(--x)]')).toEqual({
      variants: ['dark', 'active'],
      utility: 'bg-[color:var(--x)]',
    })
    expect(candidateSegments('[background-color:var(--x)]')).toEqual({
      variants: [],
      utility: '[background-color:var(--x)]',
    })
    expect(nativeUnsafeReason('[background-color:var(--x)]')).toBeUndefined()
  })
})
