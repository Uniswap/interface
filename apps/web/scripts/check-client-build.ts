/* oxlint-disable no-console -- CI check script */
// Built-client gate (INFRA-3217 + bundle budgets): ONE pass over build/client
// that enforces
//  - the gzipped initial-JS baseline (entry + modulepreloads, ratcheted both ways),
//  - the render-blocking CSS gzip budget (pinned near the var-lane number per
//    the INFRA-3217 round-2 ruling so per-value enumeration cannot creep back),
//  - the compat class-emission contract: closed set ⊆ built CSS, the
//    batch-one fixture present, the probe-leak canaries ABSENT, and media-md
//    rules under the correct at-rule.
// Replaces the separate check-bundle-size/check-compat-css scripts, which
// each read every CSS asset (round-3 simplification pass, item 6).
// Requires a completed client build (build/client). Run via
// `bun run check:client-build`.
import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
// Relative cross-package import (script-only): the emitted-class parsing and
// the fixture MUST be shared with mycelium's emission gate so the two gates
// cannot diverge (round-3 simplification pass, items 4–5).
// nx-ignore-next-line
import {
  BATCH_ONE_BASE_FIXTURE,
  BATCH_ONE_VARIANT_TWINS,
  CURATED_SURFACE_3496_FIXTURE,
  emittedClassNames,
  NAMED_GROUP_REVEAL_TWINS,
  POINTER_EVENTS_BOX_POLYFILL,
  PROBE_LEAK_CANARIES,
} from '../../../packages/mycelium/src/compat/emitted-classes'
// Relative cross-package import (script-only): the closed-set reader, floor,
// vacuous-pass guards and resolution semantics MUST be shared with the
// extension's two compat gates so the three cannot diverge (INFRA-3296).
// nx-ignore-next-line
import {
  assertClosedSetFloor,
  assertProbeLeakCanariesNonEmpty,
  assertSidecarGateListsNonEmpty,
  declaresKeyframes,
  readClosedSet,
  referencedCustomProperties,
  SIDECAR_KEYFRAMES,
  SIDECAR_PROPERTY_PREFIXES,
  unresolvedCustomProperties,
} from '../../../packages/mycelium/src/compat/gate-helpers'

// Initial JS (entry + modulepreloads) gates every page's first render; growth must be deliberate.
// bundle-sizes.json must stay within this of the build, in either direction.
const BASELINE_TOLERANCE_BYTES = 5_000

// CI fails the build when the render-blocking stylesheet exceeds this gzipped.
// Pinned near the measured var-indirection number (~126.5 kB) so the retired
// per-value × variant enumeration, which measured 254 kB, cannot creep back.
const CSS_GZIP_BUDGET_BYTES = 163_000

const GZIP_LEVEL = 9

const webRoot = join(import.meta.dirname, '..')
const clientDir = join(webRoot, 'build', 'client')
const genFile = join(webRoot, '..', '..', 'packages', 'mycelium', 'compat-classes.gen.txt')
const baselineFile = join(webRoot, 'bundle-sizes.json')
const reportFile = join(webRoot, 'build', 'bundle-size-report.md')

function kb(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} kB`
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

/** Every JS file index.html fetches before first render: module entry scripts plus their modulepreloads. */
function parseInitialScriptPaths(html: string): string[] {
  const tags = html.match(/<(?:script|link)\b[^>]*>/g) ?? []
  return tags
    .filter((tag) => tag.includes('type="module"') || tag.includes('rel="modulepreload"'))
    .map((tag) => /\b(?:src|href)="([^"]+)"/.exec(tag)?.[1])
    .filter((src): src is string => src !== undefined && src.startsWith('/assets/') && src.endsWith('.js'))
}

function measureInitialJs(): { gzipBytes: number; files: number } {
  let html: string
  try {
    html = readFileSync(join(clientDir, 'index.html'), 'utf-8')
  } catch {
    fail(`Missing ${clientDir}/index.html — run a client build first (e.g. bun run build:staging).`)
  }
  const paths = parseInitialScriptPaths(html)
  if (paths.length === 0) {
    fail(
      'No module entry script or modulepreload under /assets/ found in build/client/index.html.\n' +
        'The build output layout may have changed — update scripts/check-client-build.ts.',
    )
  }
  let gzipBytes = 0
  for (const path of paths) {
    gzipBytes += gzipSync(readFileSync(join(clientDir, path)), { level: GZIP_LEVEL }).byteLength
  }
  console.info(`Initial JS: ${kb(gzipBytes)} gzip across ${paths.length} files (entry + modulepreloads).`)
  return { gzipBytes, files: paths.length }
}

function readBaselineInitialJs(): number {
  const { initialJsGzipBytes } = JSON.parse(readFileSync(baselineFile, 'utf-8')) as { initialJsGzipBytes?: unknown }
  if (typeof initialJsGzipBytes !== 'number') {
    fail(`${baselineFile} must contain a numeric initialJsGzipBytes.`)
  }
  return initialJsGzipBytes
}

function signedKb(bytes: number): string {
  return `${bytes >= 0 ? '+' : '−'}${kb(Math.abs(bytes))}`
}

function writeReport({
  initialJs,
  baseline,
  cssGzipBytes,
}: {
  initialJs: { gzipBytes: number; files: number }
  baseline: number
  cssGzipBytes: number
}): void {
  const delta = initialJs.gzipBytes - baseline
  const status = Math.abs(delta) > BASELINE_TOLERANCE_BYTES ? '❌' : '✅'
  const cssStatus = cssGzipBytes > CSS_GZIP_BUDGET_BYTES ? '❌' : '✅'
  const report =
    '### Web bundle size (gzip)\n\n' +
    '| | Size | Reference | Delta |\n|---|---|---|---|\n' +
    `| ${status} Initial JS (${initialJs.files} files) | ${kb(initialJs.gzipBytes)} | ${kb(baseline)} baseline | ${signedKb(delta)} |\n` +
    `| ${cssStatus} CSS | ${kb(cssGzipBytes)} | ${kb(CSS_GZIP_BUDGET_BYTES)} budget | ${signedKb(cssGzipBytes - CSS_GZIP_BUDGET_BYTES)} |\n\n` +
    `Initial JS is everything \`index.html\` loads before first render, \`/swap\` included. ` +
    `It must stay within ±${kb(BASELINE_TOLERANCE_BYTES)} of \`apps/web/bundle-sizes.json\`. ` +
    'Keep it flat: put new routes, modals and heavy dependencies behind `lazy()` / `import()` ' +
    'instead of importing them statically from the app shell.\n'
  writeFileSync(reportFile, report)
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)
  }
}

function checkInitialJsBudget(gzipBytes: number, baseline: number): void {
  const delta = gzipBytes - baseline
  const update = `set initialJsGzipBytes in apps/web/bundle-sizes.json to ${gzipBytes}`
  if (delta > BASELINE_TOLERANCE_BYTES) {
    fail(
      `Initial JS grew ${kb(delta)} over the baseline (${kb(baseline)}). It loads before every page renders, so ` +
        'move the new weight behind lazy() / import(), dedupe it, or drop it. ' +
        `If the growth is intended, ${update} and explain why in the PR.`,
    )
  }
  if (delta < -BASELINE_TOLERANCE_BYTES) {
    fail(`Initial JS shrank ${kb(-delta)} below the baseline — lock in the win: ${update}.`)
  }
  console.info(`Initial JS is within ${kb(BASELINE_TOLERANCE_BYTES)} of the baseline (${signedKb(delta)}).`)
}

/** Read every built CSS asset ONCE; both the budget and the compat checks consume this. */
function readCssAssets(): Map<string, string> {
  let cssFiles: string[]
  try {
    cssFiles = readdirSync(join(clientDir, 'assets')).filter((file) => file.endsWith('.css'))
  } catch {
    fail(`Missing ${clientDir}/assets — run a client build first (e.g. bun run build:staging).`)
  }
  if (cssFiles.length === 0) {
    // A build layout change must FAIL here: zero CSS files would otherwise
    // silently disarm both the budget and the emission gate (round-2 review).
    fail(`No .css assets under ${clientDir}/assets — the build output layout may have changed.`)
  }
  const cssByFile = new Map<string, string>()
  for (const file of cssFiles) {
    cssByFile.set(file, readFileSync(join(clientDir, 'assets', file), 'utf-8'))
  }
  return cssByFile
}

function measureCss(cssByFile: Map<string, string>): { gzipBytes: number; perAsset: string[] } {
  const perAsset: string[] = []
  let totalCssGzipBytes = 0
  for (const [file, css] of cssByFile) {
    const gzipBytes = gzipSync(Buffer.from(css), { level: GZIP_LEVEL }).byteLength
    totalCssGzipBytes += gzipBytes
    perAsset.push(`assets/${file}: ${kb(gzipBytes)} gzip`)
    console.info(`assets/${file}: ${kb(gzipBytes)} gzip`)
  }
  console.info(`CSS total: ${kb(totalCssGzipBytes)} gzip (budget: ${kb(CSS_GZIP_BUDGET_BYTES)})`)
  return { gzipBytes: totalCssGzipBytes, perAsset }
}

function checkCssBudget({ gzipBytes: totalCssGzipBytes, perAsset }: { gzipBytes: number; perAsset: string[] }): void {
  if (totalCssGzipBytes > CSS_GZIP_BUDGET_BYTES) {
    fail(
      `Built CSS is over budget by ${kb(totalCssGzipBytes - CSS_GZIP_BUDGET_BYTES)} ` +
        `(total ${kb(totalCssGzipBytes)}, budget ${kb(CSS_GZIP_BUDGET_BYTES)}). Per-asset gzip sizes:\n` +
        `  ${perAsset.join('\n  ')}\n` +
        'First check whether the compat-owned classes grew: diff the closed-set count in ' +
        'packages/mycelium/compat-classes.gen.txt against the last green run (this script prints it below).\n' +
        '- If the closed set did NOT grow, this is ordinary app CSS growth (a new route stylesheet, more ' +
        'utility classes) and raising CSS_GZIP_BUDGET_BYTES is the right response. Note CI gzips ~200 B ' +
        'larger than local builds of the same assets, so local checks read slightly optimistic.\n' +
        '- Only growth in the variant-twin tables (packages/mycelium/src/compat/twin-tiers.ts) should send ' +
        'you there, and the per-value enumeration (compat/closed-set.ts) must never creep back — that is what ' +
        'this budget pins (INFRA-3217 var-lane ruling).',
    )
  }
  console.info('CSS is within budget.')
}

/**
 * The Tamagui `$md` breakpoint, in every form the minifier may emit: the
 * inclusive max-width 640px and its 40rem equivalent (lightningcss can
 * rewrite to the range form and/or rem units — a legit `(width<=40rem)`
 * must PASS, round-4 review). Anything else — top level, min-width
 * inversion, a wrong breakpoint — fails.
 */
const MEDIA_MD_CONDITION = /\((?:max-width:\s*(?:640px|40rem)|width\s*<=\s*(?:640px|40rem))\)/

/**
 * The stack of rule preludes actually enclosing `index`, outermost first,
 * by brace counting (skipping quoted strings so `content` values cannot
 * skew the count). String proximity (`lastIndexOf('@media')` + a window)
 * is NOT containment: it false-passed twins hoisted to top level whenever
 * any earlier max-width-640 block existed in the asset (round-4 review).
 */
function enclosingRulePreludes(css: string, index: number): string[] {
  const stack: string[] = []
  let preludeStart = 0
  for (let i = 0; i < index; i++) {
    const ch = css[i]
    if (ch === '\\') {
      // Escaped char OUTSIDE a string — e.g. the \" in a selector like
      // .\[font-family\:…\"Segoe_UI\"…\] — is never a string delimiter;
      // treating it as one swallows every brace to the next quote.
      i++
    } else if (ch === '"' || ch === "'") {
      for (i++; i < index && css[i] !== ch; i++) {
        if (css[i] === '\\') {
          i++
        }
      }
    } else if (ch === '{') {
      stack.push(css.slice(preludeStart, i).trim())
      preludeStart = i + 1
    } else if (ch === '}' || ch === ';') {
      if (ch === '}') {
        stack.pop()
      }
      preludeStart = i + 1
    }
  }
  return stack
}

/**
 * The media-md rules must sit under Tamagui's inclusive max-width breakpoint,
 * NEVER Tailwind's mobile-first `min-width: 640px` — the exact inversion this
 * gate exists to catch. Checked on a variant TWIN (the media tier carries no
 * per-value enumeration since the round-2 ruling), on EVERY occurrence, via
 * the actually-enclosing at-rule block.
 */
function checkMediaMdAtRule(cssByFile: Map<string, string>): string | undefined {
  const probe = String.raw`.media-md\:gap-\[var\(--cE-gap\)\]`
  let occurrences = 0
  for (const [file, css] of cssByFile) {
    for (let index = css.indexOf(probe); index !== -1; index = css.indexOf(probe, index + probe.length)) {
      occurrences += 1
      const mediaPreludes = enclosingRulePreludes(css, index).filter((prelude) => prelude.startsWith('@media'))
      // Only the innermost @media is the twin's condition — the app's own
      // utilities legitimately emit other media blocks elsewhere.
      const innermost = mediaPreludes[mediaPreludes.length - 1]
      if (innermost === undefined) {
        return `${file}: ${probe} sits at TOP LEVEL (no enclosing @media block) — the at-rule collapsed?`
      }
      if (!MEDIA_MD_CONDITION.test(innermost)) {
        return `${file}: ${probe} is enclosed by "${innermost}", not the max-width 640px/40rem breakpoint — min-width inversion?`
      }
    }
  }
  return occurrences === 0 ? `no asset contains ${probe}` : undefined
}

function checkCompatEmission(cssByFile: Map<string, string>): void {
  const tailwindEntry = readFileSync(join(webRoot, 'src', 'tailwind.css'), 'utf-8')
  if (!tailwindEntry.includes('@universe/mycelium/tailwind')) {
    fail(
      'check:client-build FAILED — apps/web/src/tailwind.css no longer imports @universe/mycelium/tailwind, ' +
        'so the compat class safelist (and every mycelium style) is absent from the built CSS.',
    )
  }

  const emitted = new Set<string>()
  for (const css of cssByFile.values()) {
    for (const cls of emittedClassNames(css)) {
      emitted.add(cls)
    }
  }

  // Shared reader + floor (INFRA-3296): a missing safelist file or a gutted
  // set fails here with the shared message instead of a silent @source no-op.
  let closedSet: string[]
  try {
    closedSet = readClosedSet(genFile)
    assertClosedSetFloor(closedSet)
  } catch (error) {
    fail(`check:client-build FAILED — ${error instanceof Error ? error.message : String(error)}`)
  }
  const closedSetLookup = new Set(closedSet)

  // NAMED_GROUP_REVEAL_TWINS pins INFRA-3481 in the BUILT CSS: named-group
  // reveals previously shipped a class with no rule and every gate stayed
  // green — this fixture reds the build gate if those entries vanish again.
  // POINTER_EVENTS_BOX_POLYFILL pins INFRA-3490 the same way: the box-none /
  // box-only pair must keep real rules in the built CSS.
  // CURATED_SURFACE_3496_FIXTURE pins the INFRA-3496 P6-P8 surface the same way.
  const fixture = [
    ...BATCH_ONE_BASE_FIXTURE,
    ...BATCH_ONE_VARIANT_TWINS,
    ...NAMED_GROUP_REVEAL_TWINS,
    ...POINTER_EVENTS_BOX_POLYFILL,
    ...CURATED_SURFACE_3496_FIXTURE,
  ]
  // The fixture must stay a covered subset of the closed set — otherwise the
  // subset-of-CSS check below can only fire when the safelist is gutted.
  const fixtureOutsideSet = fixture.filter((cls) => !closedSetLookup.has(cls))
  const missingClosed = closedSet.filter((cls) => !emitted.has(cls))
  const missingFixture = fixture.filter((cls) => !emitted.has(cls))
  // Probe-leak canaries live ONLY in test files: their presence in built CSS
  // means test files leaked back into the @source scan or the per-value
  // variant enumeration crept back (round-2 review, carried item). An emptied
  // canary list would pass vacuously — the guard the extension gates already
  // carried and this one lacked (INFRA-3296 fix bar item 1).
  try {
    assertProbeLeakCanariesNonEmpty()
  } catch (error) {
    fail(`check:client-build FAILED — ${error instanceof Error ? error.message : String(error)}`)
  }
  const leakedCanaries = PROBE_LEAK_CANARIES.filter((cls) => emitted.has(cls))
  const atRuleProblem = checkMediaMdAtRule(cssByFile)

  console.info(`Scanned ${cssByFile.size} css asset(s); ${emitted.size} distinct classes emitted.`)
  console.info(`Closed set: ${closedSet.length - missingClosed.length}/${closedSet.length} present.`)
  console.info(
    `Batch-one fixture: ${fixture.length - missingFixture.length}/${fixture.length} present, ` +
      `${fixture.length - fixtureOutsideSet.length}/${fixture.length} in closed set.`,
  )

  if (missingClosed.length > 0 || missingFixture.length > 0 || fixtureOutsideSet.length > 0) {
    const sample = [...new Set([...missingFixture, ...fixtureOutsideSet, ...missingClosed])].slice(0, 40)
    fail(
      `\ncheck:client-build FAILED — ${missingClosed.length} closed-set / ${missingFixture.length} fixture class(es) ` +
        `absent from the built CSS; ${fixtureOutsideSet.length} fixture class(es) outside the closed set. ` +
        `A compat-computed class that is not emitted ships silently unstyled pages.\n` +
        `First missing classes:\n  ${sample.join('\n  ')}\n\n` +
        `Likely causes: the @source "./compat-classes.gen.txt" registration was removed from ` +
        `packages/mycelium/tailwind.css, or the safelist is stale — regenerate with ` +
        `\`bun nx run @universe/mycelium:generate:compat-classes\`.`,
    )
  }
  if (leakedCanaries.length > 0) {
    fail(
      `\ncheck:client-build FAILED — test-only probe class(es) found in the built CSS: ${leakedCanaries.join(', ')}. ` +
        `Either test files are being scanned again (restore the '@source not' exclusions in packages/mycelium/tailwind-sources.css) ` +
        `or the per-value variant enumeration crept back into the safelist.`,
    )
  }
  if (atRuleProblem !== undefined) {
    fail(`\ncheck:client-build FAILED — ${atRuleProblem}`)
  }
  console.info('Compat emission checks OK.')
}

/**
 * RESOLUTION gate (INFRA-3262 precedent, apps/web leg): emission proves a
 * compat class has a rule, not that the rule resolves — arbitrary-property
 * classes emit unconditionally, so the closed set can be 100% present while
 * every `var(--stext-*)` dereferences a custom property nothing defines and
 * compat text ships silently unstyled (TextCompat colors fall back to
 * inheritance — accent pink inside anchors). The definitions come from
 * mycelium's side-car stylesheets (text-compat.css, shimmer.css,
 * button-compat.css), imported by src/tailwind.css.
 *
 * Unlike the extension's per-entry stylesheets, every apps/web CSS asset
 * loads into the SAME document alongside the render-blocking entry
 * stylesheet, so references and definitions are checked across the union of
 * assets rather than per file.
 */
function checkCompatResolution(cssByFile: Map<string, string>): void {
  // An emptied prefix or keyframe list would make every check below pass with
  // zero assertions executed — the same vacuous pass as an emptied canary
  // list — so assert both first.
  try {
    assertSidecarGateListsNonEmpty()
  } catch (error) {
    fail(`\ncheck:client-build FAILED — ${error instanceof Error ? error.message : String(error)}`)
  }

  const allCss = [...cssByFile.values()].join('\n')
  for (const prefix of SIDECAR_PROPERTY_PREFIXES) {
    const referenced = referencedCustomProperties(allCss, prefix)
    // Every prefix has guaranteed referencing rules — the closed set emits
    // --stext- ones, ButtonCompat's scanned base classes emit --sbtn- ones —
    // so zero references means this gate stopped seeing them (parser or
    // build-layout drift): fail per prefix, never pass vacuously.
    if (referenced.size === 0) {
      fail(
        `\ncheck:client-build FAILED — no var(${prefix}*) references found in any built CSS asset, but ` +
          'compat rules reference such properties — the resolution gate is no longer seeing them.',
      )
    }
    const unresolved = unresolvedCustomProperties(allCss, prefix)
    if (unresolved.length > 0) {
      fail(
        `\ncheck:client-build FAILED — ${unresolved.length} ${prefix}* custom propert(ies) referenced but never ` +
          `defined in the built CSS:\n  ${unresolved.slice(0, 20).join('\n  ')}\n` +
          'A rule that dereferences an undefined custom property ships silently unstyled. The definitions come ' +
          'from the mycelium side-car stylesheets — restore the @universe/mycelium/{text-compat,shimmer,button-compat}.css ' +
          'imports in src/tailwind.css.',
      )
    }
    console.info(`${prefix}*: ${referenced.size} referenced, all resolved.`)
  }

  // The same side-cars declare the keyframes compat components animate by
  // name at runtime (TextCompat loading shine, Shimmer sweep, ButtonCompat
  // spinner) — equally invisible to emission checks, so pin them too.
  const absentKeyframes = SIDECAR_KEYFRAMES.filter((name) => !declaresKeyframes(allCss, name))
  if (absentKeyframes.length > 0) {
    fail(
      `\ncheck:client-build FAILED — @keyframes ${absentKeyframes.join(', ')} missing from the built CSS. ` +
        'Compat components animate these by name at runtime. Restore the mycelium side-car stylesheet imports ' +
        'in src/tailwind.css.',
    )
  }
  console.info('Compat resolution checks OK.')
}

function main(): void {
  const initialJs = measureInitialJs()
  const baseline = readBaselineInitialJs()
  const cssByFile = readCssAssets()
  const css = measureCss(cssByFile)
  writeReport({ initialJs, baseline, cssGzipBytes: css.gzipBytes })
  checkInitialJsBudget(initialJs.gzipBytes, baseline)
  checkCssBudget(css)
  checkCompatEmission(cssByFile)
  checkCompatResolution(cssByFile)
  console.info('check:client-build OK.')
}

main()
