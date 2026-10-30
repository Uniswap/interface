/**
 * swap-ui movability ledger
 *
 * Scans the swap tree and classifies every view component's blockers against
 * the swap-ui definition of done: all data via props, actions via callbacks,
 * zero imports from business logic or analytics code.
 *
 * A file is MOVABLE into @universe/swap-ui when it has zero blockers.
 * A file that imports from @universe/swap-ui is an ADAPTER: the packages/uniswap
 * side of a finished split. It reads stores and derives props on purpose, so it
 * is reported on its own and never counted as a view, movable or blocked.
 * The policies behind the classes live in scripts/swap-ui/POLICIES.md.
 *
 * Changelog (schema = JSON shape, heuristic = classification rules):
 *   schema 1 / heuristic 1: initial ledger, every .tsx in the swap tree is a view.
 *   schema 2 / heuristic 2: adapters. Files importing @universe/swap-ui get
 *     files[].adapter = true and are counted in ledger.adapters instead of
 *     total / movable / byClass, are left out of --batches, and print as
 *     ADAPTER in --files.
 *
 * Deliberately dependency-free (node builtins only) so CI can run it without
 * an install.
 *
 * Usage:
 *   bun scripts/swap-ui/ledger.ts                  # console summary
 *   bun scripts/swap-ui/ledger.ts --json <path>    # machine-readable ledger
 *   bun scripts/swap-ui/ledger.ts --html <path>    # static HTML report
 *   bun scripts/swap-ui/ledger.ts --summary <path> # markdown summary (CI step summary)
 *   bun scripts/swap-ui/ledger.ts --files          # per-file detail (ADAPTER / MOVABLE / blocker classes)
 *   bun scripts/swap-ui/ledger.ts --batches        # suggested work batches (grouped, sized, ordered)
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'

const REPO_ROOT = new URL('../..', import.meta.url).pathname
const SWAP_ROOT = join(REPO_ROOT, 'packages/uniswap/src/features/transactions/swap')

/** Bump when the JSON shape changes (consumers pin this). */
export const SCHEMA_VERSION = 2
/** Bump when classification rules change (what counts as a blocker), independent of shape. */
export const HEURISTIC_VERSION = 2
/** Importing the package marks a file as the uniswap-side adapter of an extracted view. */
export const ADAPTER_SOURCE = '@universe/swap-ui'

/** Blocker classes, ordered by how we expect them to drain. */
export const BLOCKER_CLASSES = [
  'store-read', // swap zustand stores / contexts / redux, resolves via view/adapter split
  'flags', // @universe/gating, adapter resolves flags, passes booleans
  'query', // @tanstack/react-query, adapter concern
  'telemetry', // Trace / sendAnalyticsEvent, wrapper stays in uniswap
  'modal-shell', // uniswap Modal shells, views render content, adapters own shells
  'ui-src', // legacy ui/src component library; import swap to mycelium, or slot
  'uniswap-runtime', // other value imports from uniswap/src, must be severed or slotted
  'types-pending', // type-only uniswap/src imports, replaced by swap-ui-owned prop types
] as const

export type BlockerClass = (typeof BLOCKER_CLASSES)[number]

export interface FileEntry {
  path: string
  /** Always empty for adapters: their store reads and derivations are the point, not blockers. */
  blockers: Partial<Record<BlockerClass, string[]>>
  movable: boolean
  /** Platform-split stub (throws PlatformSplitStubError), trivially clean, not a real view. */
  stub: boolean
  /** Imports @universe/swap-ui: the uniswap side of a finished split, never a move candidate. */
  adapter: boolean
}

export interface Ledger {
  schemaVersion: number
  heuristicVersion: number
  generatedAt: string
  scanRoot: string
  /** View files (real views + platform stubs). Adapters are listed in files[] but not counted here. */
  total: number
  movable: number
  stubs: number
  adapters: number
  /** Class definitions ship in the JSON so consumers never re-encode them. */
  blockerClasses: Record<BlockerClass, { short: string; definition: string; drains: string }>
  byClass: Record<BlockerClass, number>
  files: FileEntry[]
}

/**
 * Blocker-class definitions. Shipped inside the JSON (census-style) so consumers
 * never re-encode them, and rendered as the definitions section of the HTML report.
 */
export const BLOCKER_DEFS: Record<BlockerClass, { short: string; definition: string; drains: string }> = {
  'store-read': {
    short: 'reads swap state directly',
    definition:
      'Imports a swap Zustand store hook or context (useSwapFormStore, useSwapReviewTransactionStore, swapFormScreenStore, transaction-settings stores, TransactionModalContext, UniswapContext) or redux (react-redux). The component knows where its data lives instead of receiving it.',
    drains:
      'The view/adapter split: a thin adapter in packages/uniswap keeps the store read and spreads the values onto the view as props.',
  },
  flags: {
    short: 'resolves flags / compliance',
    definition:
      'Imports @universe/gating (feature flags) or @universe/compliance (geo/token gating). Whether a feature is enabled is a business fact, not a presentational one.',
    drains: 'The adapter resolves the flag and passes a boolean or variant prop.',
  },
  query: {
    short: 'fetches data in render',
    definition:
      'Imports @tanstack/react-query. Data fetching from a view couples it to network and cache state. Currently zero files, fetching already lives in the provider layer.',
    drains: 'Stays in providers/adapters; views only ever see the fetched result as props.',
  },
  telemetry: {
    short: 'imports analytics',
    definition:
      'Imports uniswap/src/features/telemetry or utilities/src/telemetry (Trace, sendAnalyticsEvent, ElementName constants). The definition of done says zero analytics in views.',
    drains:
      'Trace wrappers stay in uniswap and compose AROUND the view (SwapFormButtonTrace pattern); views emit callbacks and adapters decide what to log.',
  },
  'modal-shell': {
    short: 'imports a Modal shell',
    definition:
      'Imports uniswap/src/components/modals (Modal, WarningModal shells). The native Modal deliberately stays gorhom-based inside uniswap, so a view importing a shell can never leave.',
    drains: 'The view exports the modal CONTENT as a plain component; the adapter wraps it in the shell.',
  },
  'ui-src': {
    short: 'imports ui/src',
    definition:
      'Imports the legacy ui/src component library. The package is mycelium-only, so every ui/src import keeps the file in place until it is swapped or slotted.',
    drains:
      'Swap the import for the mycelium equivalent (same props) when one exists. A component with no mycelium leg stays in the adapter and reaches the view as a slot. The guide preflight lists both cases.',
  },
  'uniswap-runtime': {
    short: 'other uniswap value imports',
    definition:
      'Any other VALUE import from uniswap/src: shared components rendered inline (TransactionDetails, CurrencyInputPanel), utils called at render time (getSwapFeeUsd, routing predicates), constants. Each one is a concrete edge that would create the forbidden swap-ui → uniswap dependency.',
    drains:
      'Per import, one of three moves: sever (derivation moves into the adapter), slot (shared component passed in as a ReactNode prop), or replace the type with a swap-ui-owned prop type. This is the widest class and the real design work.',
  },
  'types-pending': {
    short: 'type-only uniswap imports',
    definition:
      "An `import type` from uniswap/src (DerivedSwapInfo, Warning, GasFeeResult...). No runtime coupling, but package graphs don't distinguish type edges, so it still blocks the move.",
    drains:
      'The view takes a swap-ui-owned prop type instead (the package vocabulary in packages/swap-ui/src/types.ts). There is no shared types package.',
  },
}

const STORE_SOURCE_PATTERNS = [
  /features\/transactions\/swap\/(stores|form\/stores|review\/stores|plan)\//,
  /features\/transactions\/components\/settings\/stores/,
  /features\/transactions\/components\/TransactionModal\/TransactionModalContext/,
  /contexts\/UniswapContext/,
  /^react-redux$/,
  /^redux/,
]

const STORE_NAME_PATTERN = /^use[A-Z]\w*(Store|StoreActions|StoreBase|StoreDerivedSwapInfo)$/

function isTsxSource(name: string): boolean {
  return (
    name.endsWith('.tsx') && !name.endsWith('.test.tsx') && !name.endsWith('.stories.tsx') && !name.includes('.fixture')
  )
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) {
      if (name === '__mocks__' || name === '__tests__') {
        continue
      }
      walk(full, out)
    } else if (isTsxSource(name)) {
      out.push(full)
    }
  }
  return out
}

export interface ParsedImport {
  source: string
  names: string[]
  typeOnly: boolean
}

/** Matches whole import statements, including multi-line named imports. */
const IMPORT_RE = /import\s+(type\s+)?([\s\S]*?)\s*from\s*['"]([^'"]+)['"]/g

export function parseImports(content: string): ParsedImport[] {
  const imports: ParsedImport[] = []
  for (const match of content.matchAll(IMPORT_RE)) {
    const [, typeKeyword, clause, source] = match
    const names = [...(clause ?? '').matchAll(/[{,\s]([A-Za-z_$][\w$]*)/g)].map((m) => m[1] ?? '')
    imports.push({ source: source ?? '', names, typeOnly: Boolean(typeKeyword) })
  }
  return imports
}

export function classify(imp: ParsedImport): { cls: BlockerClass; detail: string } | undefined {
  const { source, names, typeOnly } = imp

  if (source.startsWith('ui/src')) {
    return { cls: 'ui-src', detail: source }
  }
  if (source === '@universe/gating' || source.startsWith('@universe/gating/')) {
    return { cls: 'flags', detail: source }
  }
  if (source === '@universe/compliance') {
    return { cls: 'flags', detail: source }
  }
  if (source.startsWith('@tanstack/react-query')) {
    return { cls: 'query', detail: source }
  }
  if (/features\/telemetry|utilities\/src\/telemetry/.test(source)) {
    return { cls: 'telemetry', detail: source }
  }
  if (/uniswap\/src\/components\/modals/.test(source)) {
    return { cls: 'modal-shell', detail: source }
  }
  if (STORE_SOURCE_PATTERNS.some((p) => p.test(source))) {
    return { cls: 'store-read', detail: source }
  }
  if (source.startsWith('uniswap/src')) {
    const storeNames = names.filter((n) => STORE_NAME_PATTERN.test(n))
    if (storeNames.length > 0) {
      return { cls: 'store-read', detail: `${source} (${storeNames.join(', ')})` }
    }
    if (typeOnly) {
      return { cls: 'types-pending', detail: source }
    }
    return { cls: 'uniswap-runtime', detail: source }
  }
  return undefined
}

export function isAdapter(imports: ParsedImport[]): boolean {
  return imports.some((imp) => imp.source === ADAPTER_SOURCE || imp.source.startsWith(`${ADAPTER_SOURCE}/`))
}

/** Classifies one file from its source. Pure, so fixtures can exercise every branch without a tree. */
export function analyzeFile(path: string, content: string): FileEntry {
  const imports = parseImports(content)
  const stub = content.includes('PlatformSplitStubError')
  const adapter = isAdapter(imports)
  const blockers: Partial<Record<BlockerClass, string[]>> = {}
  if (!adapter) {
    for (const imp of imports) {
      const hit = classify(imp)
      if (hit) {
        ;(blockers[hit.cls] ??= []).push(hit.detail)
      }
    }
  }
  return {
    path,
    blockers,
    movable: !stub && !adapter && Object.keys(blockers).length === 0,
    stub,
    adapter,
  }
}

export function scan(root: string = SWAP_ROOT): Ledger {
  const entries = walk(root)
    .sort()
    .map((full) => analyzeFile(relative(root, full), readFileSync(full, 'utf8')))
  const views = entries.filter((e) => !e.adapter)

  const byClass = Object.fromEntries(
    BLOCKER_CLASSES.map((cls) => [cls, views.filter((e) => e.blockers[cls]).length]),
  ) as Record<BlockerClass, number>

  return {
    schemaVersion: SCHEMA_VERSION,
    heuristicVersion: HEURISTIC_VERSION,
    generatedAt: new Date().toISOString(),
    scanRoot: relative(REPO_ROOT, root),
    total: views.length,
    movable: views.filter((e) => e.movable).length,
    stubs: views.filter((e) => e.stub).length,
    adapters: entries.length - views.length,
    blockerClasses: BLOCKER_DEFS,
    byClass,
    files: entries,
  }
}

function topDir(path: string): string {
  const idx = path.indexOf('/')
  return idx === -1 ? '(root)' : path.slice(0, idx)
}

interface DirRow {
  /** View files in the directory, adapters excluded (same rule as Ledger.total). */
  total: number
  movable: number
  stubs: number
  adapters: number
  byClass: Record<string, number>
}

function groupByDir(ledger: Ledger): Map<string, DirRow> {
  const dirs = new Map<string, DirRow>()
  for (const f of ledger.files) {
    const dir = topDir(f.path)
    const row = dirs.get(dir) ?? { total: 0, movable: 0, stubs: 0, adapters: 0, byClass: {} }
    if (f.adapter) {
      row.adapters += 1
      dirs.set(dir, row)
      continue
    }
    row.total += 1
    if (f.movable) {
      row.movable += 1
    }
    if (f.stub) {
      row.stubs += 1
    }
    for (const cls of Object.keys(f.blockers)) {
      row.byClass[cls] = (row.byClass[cls] ?? 0) + 1
    }
    dirs.set(dir, row)
  }
  return dirs
}

function sortedDirs(ledger: Ledger): [string, DirRow][] {
  return [...groupByDir(ledger).entries()].sort((a, b) => b[1].total - a[1].total)
}

function printSummary(ledger: Ledger): void {
  console.log(`\nswap-ui movability ledger: ${ledger.scanRoot}`)
  console.log(`scanned ${ledger.total} view files · movable today: ${ledger.movable} · adapters: ${ledger.adapters}\n`)

  const header = ['directory', 'files', 'movable', 'adapters', ...BLOCKER_CLASSES]
  const rows = sortedDirs(ledger).map(([dir, row]) => [
    dir,
    String(row.total),
    String(row.movable),
    String(row.adapters),
    ...BLOCKER_CLASSES.map((cls) => String(row.byClass[cls] ?? 0)),
  ])
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]?.length ?? 0)))
  const fmt = (cells: string[]): string => cells.map((c, i) => c.padEnd(widths[i] ?? 0)).join('  ')
  console.log(fmt(header))
  console.log(fmt(widths.map((w) => '-'.repeat(w))))
  for (const row of rows) {
    console.log(fmt(row))
  }

  console.log(`\ntotals: ${BLOCKER_CLASSES.map((cls) => `${cls} ${ledger.byClass[cls]}`).join(' · ')}\n`)
}

/** Markdown summary for the CI step summary (census --summary pattern). */
export function renderSummary(ledger: Ledger): string {
  const lines: string[] = []
  lines.push('# swap-ui movability ledger')
  lines.push('')
  lines.push(
    `\`${ledger.scanRoot}\` · generated ${ledger.generatedAt.slice(0, 10)} · schema v${ledger.schemaVersion} · heuristic v${ledger.heuristicVersion}`,
  )
  lines.push('')
  lines.push(
    `**${ledger.total - ledger.stubs} view files** (+ ${ledger.stubs} platform stubs) · **${ledger.movable} movable today** · **${ledger.adapters} adapters** (already split, import \`${ADAPTER_SOURCE}\`)`,
  )
  lines.push('')
  lines.push('## Blockers by class')
  lines.push('')
  lines.push('| class | files | meaning |')
  lines.push('|---|---:|---|')
  for (const cls of BLOCKER_CLASSES) {
    lines.push(`| \`${cls}\` | ${ledger.byClass[cls]} | ${BLOCKER_DEFS[cls].short} |`)
  }
  lines.push('')
  lines.push('## By directory')
  lines.push('')
  lines.push('| directory | files | movable | stubs | adapters |')
  lines.push('|---|---:|---:|---:|---:|')
  for (const [dir, row] of sortedDirs(ledger)) {
    lines.push(`| ${dir} | ${row.total} | ${row.movable} | ${row.stubs} | ${row.adapters} |`)
  }
  lines.push('')
  lines.push(
    'A file is MOVABLE when it receives all data via props, emits actions via callbacks, and imports nothing from business logic or analytics code. A file is an ADAPTER when it imports `@universe/swap-ui`: the uniswap side of a finished split, not counted as a view. Policies: `scripts/swap-ui/POLICIES.md`.',
  )
  lines.push('')
  return lines.join('\n')
}

/** Status column of --files: ADAPTER, MOVABLE, or each blocker class with its import count. */
export function fileStatus(f: FileEntry): string {
  if (f.adapter) {
    return 'ADAPTER'
  }
  if (f.movable) {
    return 'MOVABLE'
  }
  return Object.entries(f.blockers)
    .map(([cls, details]) => `${cls}(${details?.length})`)
    .join(' ')
}

function printFiles(ledger: Ledger): void {
  for (const f of ledger.files) {
    console.log(`${f.path.padEnd(90)} ${fileStatus(f)}`)
  }
}

const BATCH_SIZE = 5
/** Flattering-first (review tree, shared rows) per the extraction plan. */
const WAVE_ORDER = ['review', 'components', 'form', 'SwapFlow', '(root)']

export interface Batch {
  dir: string
  files: string[]
}

/** Suggested work batches: blocked views grouped by directory, at most BATCH_SIZE each. Movable files and adapters are done. */
export function buildBatches(ledger: Ledger): Batch[] {
  const groups = new Map<string, string[]>()
  for (const f of ledger.files) {
    if (f.movable || f.adapter) {
      continue
    }
    const dir = topDir(f.path)
    ;(groups.get(dir) ?? groups.set(dir, []).get(dir))?.push(f.path)
  }
  const batches: Batch[] = []
  for (const dir of [...WAVE_ORDER, ...[...groups.keys()].filter((d) => !WAVE_ORDER.includes(d))]) {
    const files = groups.get(dir)
    if (!files) {
      continue
    }
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push({ dir, files: files.slice(i, i + BATCH_SIZE) })
    }
  }
  return batches
}

function printBatches(ledger: Ledger): void {
  const batches = buildBatches(ledger)
  batches.forEach((batch, i) => {
    console.log(`batch ${String(i + 1).padStart(2, '0')} [${batch.dir}], ${batch.files.length} files`)
    for (const f of batch.files) {
      console.log(`  ${f}`)
    }
  })
  console.log(`\n${batches.length} batches of ≤${BATCH_SIZE} files`)
}

export function renderHtml(ledger: Ledger): string {
  const dirs = sortedDirs(ledger)
  const realViews = ledger.total - ledger.stubs
  const maxClass = Math.max(...Object.values(ledger.byClass))
  const date = ledger.generatedAt.slice(0, 10)

  const classBars = BLOCKER_CLASSES.map((cls) => {
    const n = ledger.byClass[cls]
    const pct = maxClass === 0 ? 0 : Math.round((n / maxClass) * 100)
    return `<div class="bar-row" data-cls="${cls}">
      <span class="bar-label">${cls}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
      <span class="bar-n">${n}</span>
      <span class="bar-why">${BLOCKER_DEFS[cls].short}</span>
    </div>`
  }).join('\n')

  const dirRows = dirs
    .map(
      ([dir, r]) =>
        `<tr><td>${dir}</td><td class="num">${r.total}</td><td class="num">${r.movable}</td><td class="num">${r.stubs}</td><td class="num">${r.adapters}</td></tr>`,
    )
    .join('\n')

  return `<title>swap-ui Movability</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
:root { --bg:#FDFBFD; --raise:#F7F1F7; --ink:#241B27; --ink2:#5D5061; --ink3:#8B7D90;
  --line:#EADFEA; --accent:#C4067D; --wash:rgba(245,13,180,.08); --good:#1B7A53; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg:#171119; --raise:#201925; --ink:#F3EDF4; --ink2:#B5A8B9; --ink3:#877B8B;
  --line:#352C3A; --accent:#FC72FF; --wash:rgba(252,114,255,.12); --good:#52D89B; } }
:root[data-theme="dark"] { --bg:#171119; --raise:#201925; --ink:#F3EDF4; --ink2:#B5A8B9;
  --ink3:#877B8B; --line:#352C3A; --accent:#FC72FF; --wash:rgba(252,114,255,.12); --good:#52D89B; }
* { box-sizing:border-box }
body { background:var(--bg); color:var(--ink); margin:0; padding:32px 24px 96px;
  font:15px/1.6 "IBM Plex Sans",sans-serif }
main { max-width:1000px; margin:0 auto }
h1 { font-size:1.7rem; margin:0; letter-spacing:-.01em }
h2 { font-size:1.05rem; margin:48px 0 12px }
.sub { color:var(--ink3); font:12px "IBM Plex Mono",monospace; margin-top:6px }
.stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:1px;
  background:var(--line); border:1px solid var(--line); border-radius:8px; overflow:hidden; margin:28px 0 }
.stat { background:var(--raise); padding:12px 14px }
.stat b { display:block; font:600 1.4rem "IBM Plex Mono",monospace; font-variant-numeric:tabular-nums }
.stat.hero b { color:var(--accent) }
.stat span { font-size:.72rem; color:var(--ink2) }
.bar-row { display:grid; grid-template-columns:130px minmax(80px,220px) 3.5ch 1fr; gap:12px;
  align-items:center; padding:7px 0; border-bottom:1px solid var(--line); font-size:.82rem }
.bar-label { font:500 .75rem "IBM Plex Mono",monospace }
.bar-track { height:8px; background:var(--raise); border-radius:4px; overflow:hidden }
.bar-fill { display:block; height:100%; background:var(--accent); border-radius:4px }
.bar-n { font:600 .8rem "IBM Plex Mono",monospace; text-align:right; font-variant-numeric:tabular-nums }
.bar-why { color:var(--ink2); font-size:.78rem }
@media (max-width:720px){ .bar-row{grid-template-columns:110px 1fr 3.5ch} .bar-why{display:none} }
table { border-collapse:collapse; width:100%; font-size:.84rem }
th { text-align:left; font:600 .68rem "IBM Plex Mono",monospace; text-transform:uppercase;
  letter-spacing:.08em; color:var(--ink3); padding:6px 12px; border-bottom:1px solid var(--line) }
td { padding:7px 12px; border-bottom:1px solid var(--line) }
.num { font:.8rem "IBM Plex Mono",monospace; text-align:right; font-variant-numeric:tabular-nums }
.tablewrap { overflow-x:auto }
.filters { display:flex; flex-wrap:wrap; gap:8px; margin:12px 0 16px }
.filters button { font:500 .75rem "IBM Plex Mono",monospace; color:var(--ink2);
  background:var(--raise); border:1px solid var(--line); border-radius:16px; padding:4px 12px; cursor:pointer }
.filters button[aria-pressed="true"] { color:var(--accent); border-color:var(--accent); background:var(--wash) }
.chip { display:inline-block; font:500 .68rem "IBM Plex Mono",monospace; background:var(--raise);
  border:1px solid var(--line); border-radius:10px; padding:1px 8px; margin:1px 2px }
.movable-chip { color:var(--good); font-weight:600 }
.stub-chip { color:var(--ink3) }
.adapter-chip { color:var(--accent); font-weight:600 }
.path { font:.78rem "IBM Plex Mono",monospace; word-break:break-all }
footer { margin-top:64px; color:var(--ink3); font:11px "IBM Plex Mono",monospace;
  border-top:1px solid var(--line); padding-top:16px }
.defs { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px }
.def { background:var(--raise); border:1px solid var(--line); border-radius:8px; padding:12px 16px }
.def p { margin:8px 0 0; font-size:.8rem; color:var(--ink2); line-height:1.5 }
.def-head { display:flex; align-items:center; gap:10px }
.def-short { font-size:.8rem; font-weight:600 }
.def-drains b { color:var(--accent); font-weight:600 }
</style>
<main>
<h1>swap-ui movability</h1>
<div class="sub">${ledger.scanRoot} · generated ${date} · schema v${ledger.schemaVersion} · heuristic v${ledger.heuristicVersion} · regenerate: <b>bun scripts/swap-ui/ledger.ts --html</b></div>
<div class="stats">
  <div class="stat"><b>${realViews}</b><span>view files (+ ${ledger.stubs} platform stubs)</span></div>
  <div class="stat hero"><b>${ledger.movable}</b><span>movable today</span></div>
  <div class="stat"><b>${ledger.adapters}</b><span>adapters (already split)</span></div>
  <div class="stat"><b>${ledger.byClass['store-read']}</b><span>need view/adapter split</span></div>
  <div class="stat"><b>${ledger.byClass['ui-src']}</b><span>waiting on mycelium conversion</span></div>
  <div class="stat"><b>${ledger.byClass['uniswap-runtime']}</b><span>uniswap imports to sever</span></div>
</div>
<h2>Blockers by class</h2>
${classBars}
<h2>What each blocker class means</h2>
<div class="defs">
${BLOCKER_CLASSES.map(
  (cls) => `<div class="def">
  <div class="def-head"><span class="chip">${cls}</span><span class="def-short">${BLOCKER_DEFS[cls].short}</span></div>
  <p>${BLOCKER_DEFS[cls].definition}</p>
  <p class="def-drains"><b>Drains via:</b> ${BLOCKER_DEFS[cls].drains}</p>
</div>`,
).join('\n')}
</div>
<h2>By directory</h2>
<div class="tablewrap"><table>
<thead><tr><th>directory</th><th style="text-align:right">files</th><th style="text-align:right">movable</th><th style="text-align:right">stubs</th><th style="text-align:right">adapters</th></tr></thead>
<tbody>${dirRows}</tbody>
</table></div>
<h2>Every file</h2>
<div class="filters" id="filters" role="group" aria-label="Filter by blocker class">
  <button aria-pressed="true" data-f="all">all</button>
  <button aria-pressed="false" data-f="movable">movable</button>
  <button aria-pressed="false" data-f="adapter">adapter</button>
  ${BLOCKER_CLASSES.map((c) => `<button aria-pressed="false" data-f="${c}">${c}</button>`).join('\n  ')}
</div>
<div class="tablewrap"><table>
<thead><tr><th>file</th><th>status</th></tr></thead>
<tbody id="files"></tbody>
</table></div>
<footer>generated by scripts/swap-ui/ledger.ts. A file is MOVABLE when it receives all data via props, emits actions via callbacks, and imports nothing from business logic or analytics code. A file is an ADAPTER when it imports ${ADAPTER_SOURCE}: the uniswap side of a finished split, listed but not counted as a view.</footer>
</main>
<script>
const DATA = ${JSON.stringify(ledger.files.map((f) => ({ p: f.path, b: Object.keys(f.blockers), m: f.movable, s: f.stub, a: f.adapter })))};
const tbody = document.getElementById('files');
function render(filter) {
  const rows = DATA.filter((f) =>
    filter === 'all' ? true : filter === 'movable' ? f.m : filter === 'adapter' ? f.a : f.b.includes(filter));
  tbody.innerHTML = rows.map((f) => '<tr><td class="path">' + f.p + '</td><td>' +
    (f.a ? '<span class="chip adapter-chip">ADAPTER</span>' :
     f.s ? '<span class="chip stub-chip">stub</span>' :
     f.m ? '<span class="chip movable-chip">MOVABLE</span>' :
     f.b.map((c) => '<span class="chip">' + c + '</span>').join('')) + '</td></tr>').join('');
}
document.getElementById('filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  for (const b of document.querySelectorAll('#filters button')) b.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-pressed', 'true');
  render(btn.dataset.f);
});
render('all');
</script>
`
}

function writeOutput(outPath: string, content: string): void {
  const resolved = outPath.startsWith('/') ? outPath : join(REPO_ROOT, outPath)
  mkdirSync(dirname(resolved), { recursive: true })
  writeFileSync(resolved, content)
  console.log(`wrote ${outPath}`)
}

function main(): void {
  const args = process.argv.slice(2)
  const ledger = scan()

  // Output flags combine (one scan, many outputs), e.g. --json ... --html ... --summary ...
  const pathAfter = (flag: string, fallback: string): string => {
    const next = args[args.indexOf(flag) + 1]
    return next !== undefined && !next.startsWith('--') ? next : fallback
  }
  let handled = false
  if (args.includes('--json')) {
    writeOutput(pathAfter('--json', 'out/swap-ui/ledger.json'), `${JSON.stringify(ledger, undefined, 2)}\n`)
    handled = true
  }
  if (args.includes('--html')) {
    writeOutput(pathAfter('--html', 'out/swap-ui/report.html'), renderHtml(ledger))
    handled = true
  }
  if (args.includes('--summary')) {
    writeOutput(pathAfter('--summary', 'out/swap-ui/summary.md'), renderSummary(ledger))
    handled = true
  }
  if (args.includes('--files')) {
    printFiles(ledger)
    handled = true
  }
  if (args.includes('--batches')) {
    printBatches(ledger)
    handled = true
  }
  if (!handled) {
    printSummary(ledger)
  }
}

if (import.meta.main) {
  main()
}
