#!/usr/bin/env bun
/**
 * Tamagui frontier tool v0: import census + convertibility JSON (INFRA-2351).
 *
 * Scans every source file under `apps/` and `packages/` for imports of
 * `tamagui`, `@tamagui/*`, and the `ui/src` wrapper package, then emits a
 * deterministic, machine-readable inventory used to scope and track the
 * Tamagui -> Tailwind (mycelium) migration.
 *
 * The JSON output is a STABLE INTERFACE consumed by the frontier dashboard,
 * the icon conversion wave, and the batch ticket generator. Any change to its
 * shape requires bumping `schemaVersion`.
 *
 * Usage:
 *   bun scripts/tamagui-migration/tamagui-census.ts                   # markdown summary to stdout
 *   bun scripts/tamagui-migration/tamagui-census.ts --json <path>     # write JSON census
 *   bun scripts/tamagui-migration/tamagui-census.ts --summary <path>  # write markdown summary
 *   bun scripts/tamagui-migration/tamagui-census.ts --no-generated-at # omit generatedAt (clean diffs)
 *
 * Methodology notes:
 * - Files are enumerated via `git ls-files --cached --others --exclude-standard`,
 *   so gitignored artifacts never leak into the census.
 * - Static `import ... from` / `export ... from` are the runtime frontier.
 *   `require()` / dynamic `import()` matches are recorded as mechanism "mock"
 *   (they only occur in test mocks today) and excluded from headline counts.
 * - Matching is textual by design: occurrences inside comments or string
 *   literals count. This keeps the scan fast and consistent with the
 *   line-scan baselines the tool is calibrated against.
 * - When an import clause cannot be parsed (e.g. an apostrophe in a clause
 *   comment breaks the clause regex), the file still counts via the bare-`from`
 *   fallback but its imported names are unknown, so its convertibility tier
 *   drifts conservatively (leaf -> dependent), never easier.
 * - `packages/ui` is the Tamagui wrapper itself and is NOT part of the
 *   migration frontier; it is reported in a separate top-level bucket and is
 *   never summed into to-migrate totals.
 *
 * Versioning: `schemaVersion` gates the JSON shape only. Changes to the
 * classification inputs — name sets (primitives/tokens/animation), category
 * rules, or convertibility tiers — require a `HEURISTIC_VERSION` bump even
 * when the shape is unchanged, so consumers can tell recounts from reclassifications.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const SCHEMA_VERSION = 1
export const HEURISTIC_VERSION = 1

const REPO_ROOT = join(import.meta.dir, '..', '..')

export const SCAN_ROOTS = ['apps', 'packages'] as const
export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'] as const
export const EXCLUDED_DIR_NAMES = ['node_modules', 'dist', 'build', '__generated__', 'generated'] as const
export const EXCLUDED_FILE_SUFFIXES = ['.d.ts'] as const

export type Estate = 'web' | 'extension' | 'mobile' | 'wallet' | 'packages-shared' | 'apps-other' | 'ui'
export const TO_MIGRATE_ESTATES: readonly Estate[] = [
  'web',
  'extension',
  'mobile',
  'wallet',
  'packages-shared',
  'apps-other',
]
const ALL_ESTATES: readonly Estate[] = [...TO_MIGRATE_ESTATES, 'ui']

export type SpecifierKind = 'tamagui' | 'tamagui-scoped' | 'ui-src'
export type Mechanism = 'import' | 'side-effect' | 'mock'
export type Platform = 'web-only' | 'native-only' | 'cross-platform'
export type Category = 'styled' | 'primitive' | 'token-theme' | 'icon' | 'animation' | 'media' | 'component' | 'other'
export type Tier = 'leaf' | 'simple' | 'dependent' | 'coupled' | 'types-only' | 'mock-only' | 'not-classified'
const TIER_ORDER: readonly Tier[] = ['leaf', 'simple', 'dependent', 'coupled', 'types-only', 'mock-only']

export interface ImportedName {
  name: string
  local: string
  typeOnly: boolean
  category: Category
}

export interface ImportRecord {
  module: string
  specifierKind: SpecifierKind
  mechanism: Mechanism
  typeOnly: boolean
  names: ImportedName[]
}

export interface FileCounts {
  bindingReferences: number
  styledCalls: number
  animationProps: number
  mediaShorthandProps: number
  platformThemeProps: number
}

export interface FileRecord {
  path: string
  project: string
  estate: Estate
  platform: Platform
  platformSuffix: 'web' | 'native' | 'ios' | 'android' | null
  platformSiblings: string[]
  imports: ImportRecord[]
  counts: FileCounts
  usages: number
  convertibility: { tier: Tier; reasons: string[] }
}

// ── Specifier + estate classification ───────────────────────────────

export function specifierKindOf(module: string): SpecifierKind | null {
  if (module === 'tamagui' || module.startsWith('tamagui/')) {
    return 'tamagui'
  }
  if (module.startsWith('@tamagui/')) {
    return 'tamagui-scoped'
  }
  if (module === 'ui/src' || module.startsWith('ui/src/')) {
    return 'ui-src'
  }
  return null
}

export function estateOf(path: string): Estate {
  if (path.startsWith('apps/web/')) {
    return 'web'
  }
  if (path.startsWith('apps/extension/')) {
    return 'extension'
  }
  if (path.startsWith('apps/mobile/')) {
    return 'mobile'
  }
  if (path.startsWith('apps/')) {
    return 'apps-other'
  }
  if (path.startsWith('packages/wallet/')) {
    return 'wallet'
  }
  if (path.startsWith('packages/ui/')) {
    return 'ui'
  }
  return 'packages-shared'
}

export function projectOf(path: string): string {
  const parts = path.split('/')
  return `${parts[0]}/${parts[1]}`
}

// ── Imported-name categorization ─────────────────────────────────────

const PRIMITIVE_NAMES = new Set([
  'Anchor',
  'Circle',
  'Flex',
  'FlexProps',
  'Image',
  'ImageProps',
  'Inset',
  'Paragraph',
  'ScrollView',
  'Separator',
  'Spacer',
  'Square',
  'Stack',
  'Text',
  'TextProps',
  'TouchableArea',
  'TouchableAreaProps',
  'View',
  'ViewProps',
  'XStack',
  'YStack',
  'ZStack',
])

const TOKEN_THEME_NAMES = new Set([
  'ColorTokens',
  'DynamicColor',
  'GetThemeValueForKey',
  'SpaceTokens',
  'Theme',
  'ThemeKeys',
  'ThemeName',
  'Tokens',
  'getToken',
  'getTokenValue',
  'useIsDarkMode',
  'useSporeColors',
])

const ANIMATION_NAMES = new Set(['AnimatePresence', 'AnimatedFlex', 'AnimatedText', 'AnimatedTouchableArea'])

const THEME_HOOK_NAMES = new Set(['useIsDarkMode', 'useSporeColors'])

export function categorize(module: string, name: string): Category {
  if (name === 'styled') {
    return 'styled'
  }
  if (module.startsWith('ui/src/components/icons') || module.startsWith('ui/src/components/logos')) {
    return 'icon'
  }
  if (module.startsWith('ui/src/animations')) {
    return 'animation'
  }
  if (
    module.startsWith('ui/src/theme') ||
    module.startsWith('ui/src/styles') ||
    module === 'ui/src/hooks/useSporeColors' ||
    module === 'ui/src/utils/colors'
  ) {
    return 'token-theme'
  }
  if (name === 'useMedia') {
    return 'media'
  }
  if (ANIMATION_NAMES.has(name)) {
    return 'animation'
  }
  if (PRIMITIVE_NAMES.has(name)) {
    return 'primitive'
  }
  if (TOKEN_THEME_NAMES.has(name)) {
    return 'token-theme'
  }
  if (module === 'ui/src' || module === 'tamagui' || module.startsWith('@tamagui/')) {
    return 'component'
  }
  return 'other'
}

// ── Import parsing ────────────────────────────────────────────────────

// Static `import ... from` / `export ... from`. The clause never contains
// quotes, so `[^'"]*?` cannot run across neighboring statements.
const CLAUSE_RE = /\b(import|export)\s+(type\s+)?([^'"]*?)\bfrom\s+['"]([^'"]+)['"]/g
// Bare `from '<spec>'` (calibration-equivalent to the phase-1 ripgrep scan).
const FROM_RE = /\bfrom\s+['"]([^'"]+)['"]/g
// Side-effect `import '<spec>'`.
const SIDE_EFFECT_RE = /\bimport\s+['"]([^'"]+)['"]/g
// `require('<spec>')` / dynamic `import('<spec>')` — test-mock forms today.
const MOCK_RE = /\b(?:require|import)\(\s*['"]([^'"]+)['"]/g

interface RawClause {
  start: number
  end: number
  module: string
  mechanism: Mechanism
  typeOnly: boolean
  clause: string
}

function collectClauses(content: string): RawClause[] {
  const clauses: RawClause[] = []
  const coveredFromEnds = new Set<number>()

  for (const m of content.matchAll(CLAUSE_RE)) {
    clauses.push({
      start: m.index,
      end: m.index + m[0].length,
      module: m[4] ?? '',
      mechanism: 'import',
      typeOnly: m[2] !== undefined,
      clause: m[3] ?? '',
    })
    coveredFromEnds.add(m.index + m[0].length)
  }
  // `from '...'` occurrences not attached to a parsable clause still count as
  // static imports (mirrors the phase-1 line scan); they carry no names.
  for (const m of content.matchAll(FROM_RE)) {
    const end = m.index + m[0].length
    if (!coveredFromEnds.has(end)) {
      clauses.push({ start: m.index, end, module: m[1] ?? '', mechanism: 'import', typeOnly: false, clause: '' })
    }
  }
  for (const m of content.matchAll(SIDE_EFFECT_RE)) {
    clauses.push({
      start: m.index,
      end: m.index + m[0].length,
      module: m[1] ?? '',
      mechanism: 'side-effect',
      typeOnly: false,
      clause: '',
    })
  }
  for (const m of content.matchAll(MOCK_RE)) {
    clauses.push({
      start: m.index,
      end: m.index + m[0].length,
      module: m[1] ?? '',
      mechanism: 'mock',
      typeOnly: false,
      clause: '',
    })
  }
  return clauses
}

function parseNames(module: string, clause: string, statementTypeOnly: boolean): ImportedName[] {
  const names: ImportedName[] = []
  const push = (name: string, local: string, typeOnly: boolean): void => {
    names.push({ name, local, typeOnly: statementTypeOnly || typeOnly, category: categorize(module, name) })
  }

  const braceMatch = clause.match(/\{([^}]*)\}/)
  const outside = clause.replace(/\{[^}]*\}/, '')

  for (const rawToken of outside.split(',')) {
    const token = rawToken.trim()
    if (token === '') {
      continue
    }
    const nsMatch = token.match(/^\*\s+as\s+(\w+)$/)
    if (nsMatch?.[1] !== undefined) {
      push('*', nsMatch[1], false)
    } else if (/^\w+$/.test(token)) {
      push('default', token, false)
    }
  }
  if (braceMatch?.[1] !== undefined) {
    for (const rawToken of braceMatch[1].split(',')) {
      let token = rawToken.trim()
      if (token === '') {
        continue
      }
      let typeOnly = false
      if (token.startsWith('type ')) {
        typeOnly = true
        token = token.slice(5).trim()
      }
      const aliasMatch = token.match(/^([\w$]+)\s+as\s+([\w$]+)$/)
      if (aliasMatch?.[1] !== undefined && aliasMatch[2] !== undefined) {
        push(aliasMatch[1], aliasMatch[2], typeOnly)
      } else if (/^[\w$]+$/.test(token)) {
        push(token, token, typeOnly)
      }
    }
  }
  names.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return names
}

export function parseImports(content: string): { imports: ImportRecord[]; clauseRanges: Array<[number, number]> } {
  const imports: ImportRecord[] = []
  const clauseRanges: Array<[number, number]> = []

  for (const raw of collectClauses(content)) {
    const kind = specifierKindOf(raw.module)
    if (kind === null) {
      continue
    }
    const names = raw.mechanism === 'import' ? parseNames(raw.module, raw.clause, raw.typeOnly) : []
    imports.push({
      module: raw.module,
      specifierKind: kind,
      mechanism: raw.mechanism,
      typeOnly: raw.typeOnly || (names.length > 0 && names.every((n) => n.typeOnly)),
      names,
    })
    clauseRanges.push([raw.start, raw.end])
  }
  imports.sort((a, b) =>
    a.module < b.module ? -1 : a.module > b.module ? 1 : a.mechanism < b.mechanism ? -1 : a.mechanism > b.mechanism ? 1 : 0,
  )
  return { imports, clauseRanges }
}

// ── Usage counting ────────────────────────────────────────────────────

const MEDIA_PROP_RE = /\$(?:xxxl|xxl|xl|lg|md|sm|xs|xxs|short|midHeight|lgHeight)\s*[:=]/g
const PLATFORM_THEME_PROP_RE = /\$(?:platform-[a-zA-Z]+|theme-[a-zA-Z]+)\s*[:=]/g
const ANIMATION_PROP_RE = /\b(?:animation|animateOnly|enterStyle|exitStyle)\s*[:=](?![=>])/g

function countMatches(content: string, re: RegExp): number {
  let count = 0
  for (const _ of content.matchAll(re)) {
    count += 1
  }
  return count
}

export function countUsages(content: string, imports: ImportRecord[], clauseRanges: Array<[number, number]>): FileCounts {
  const clauseText = clauseRanges.map(([start, end]) => content.slice(start, end)).join('\n')
  let bindingReferences = 0
  let importsStyled = false

  for (const imp of imports) {
    for (const name of imp.names) {
      if (name.name === 'styled') {
        importsStyled = true
      }
      const re = new RegExp(`\\b${name.local.replace(/\$/g, '\\$')}\\b`, 'g')
      const total = countMatches(content, re)
      const inClauses = countMatches(clauseText, re)
      bindingReferences += Math.max(0, total - inClauses)
    }
  }

  const hasRuntimeImports = imports.some((imp) => imp.mechanism !== 'mock')
  return {
    bindingReferences,
    styledCalls: importsStyled ? countMatches(content, /\bstyled\(/g) : 0,
    animationProps: hasRuntimeImports ? countMatches(content, ANIMATION_PROP_RE) : 0,
    mediaShorthandProps: hasRuntimeImports ? countMatches(content, MEDIA_PROP_RE) : 0,
    platformThemeProps: hasRuntimeImports ? countMatches(content, PLATFORM_THEME_PROP_RE) : 0,
  }
}

export function usageScore(counts: FileCounts): number {
  return (
    counts.bindingReferences +
    counts.styledCalls +
    counts.animationProps +
    counts.mediaShorthandProps +
    counts.platformThemeProps
  )
}

// ── Platform classification ──────────────────────────────────────────

const PLATFORM_SUFFIX_RE = /\.(web|native|ios|android)\.(?:ts|tsx|js|jsx)$/

export function platformOf(
  path: string,
  estate: Estate,
  allFiles: ReadonlySet<string>,
): Pick<FileRecord, 'platform' | 'platformSuffix' | 'platformSiblings'> {
  const suffixMatch = path.match(PLATFORM_SUFFIX_RE)
  const suffix = (suffixMatch?.[1] ?? null) as FileRecord['platformSuffix']

  const base = suffix === null ? path.replace(/\.(ts|tsx|js|jsx)$/, '') : path.replace(PLATFORM_SUFFIX_RE, '')
  const siblings: string[] = []
  for (const sib of ['web', 'native', 'ios', 'android']) {
    if (sib === suffix) {
      continue
    }
    if (SOURCE_EXTENSIONS.some((ext) => allFiles.has(`${base}.${sib}${ext}`))) {
      siblings.push(sib)
    }
  }

  let platform: Platform
  if (estate === 'web' || estate === 'extension') {
    platform = 'web-only'
  } else if (estate === 'mobile') {
    platform = 'native-only'
  } else if (suffix === 'web') {
    platform = 'web-only'
  } else if (suffix !== null) {
    platform = 'native-only'
  } else {
    const hasWebSibling = siblings.includes('web')
    const hasNativeSibling = siblings.includes('native') || siblings.includes('ios') || siblings.includes('android')
    if (hasWebSibling && !hasNativeSibling) {
      platform = 'native-only' // web resolves to the .web sibling; this file serves native
    } else if (hasNativeSibling && !hasWebSibling) {
      platform = 'web-only' // native resolves to the platform sibling; this file serves web
    } else {
      platform = 'cross-platform'
    }
  }
  return { platform, platformSuffix: suffix, platformSiblings: siblings }
}

// ── Convertibility heuristic (v1) ────────────────────────────────────
//
// Tiers, from easiest to hardest (packages/ui itself is not classified):
//   mock-only  — only require()/import() test-mock references; no runtime frontier.
//   types-only — every tamagui-related import is type-only; erased at runtime.
//   leaf       — imports only primitives (Flex/Text/... with mycelium compat
//                equivalents), icons, and token VALUES; no styled(), no
//                animation props, no media/$platform shorthands, no theme
//                hooks, no composed ui/src components. Easy wins.
//   simple     — leaf + theme hooks (useSporeColors/useIsDarkMode); mechanical
//                once the token/theme story is settled.
//   dependent  — imports composed ui/src components (Button, Sheet, ...);
//                mechanical once those components have mycelium equivalents.
//   coupled    — uses styled(), animation props/AnimatePresence, media
//                shorthands ($sm/$md/...), $platform-/$theme- props, useMedia,
//                or a direct runtime tamagui import. Needs real conversion work.

export function classifyConvertibility(
  estate: Estate,
  imports: ImportRecord[],
  counts: FileCounts,
): { tier: Tier; reasons: string[] } {
  if (estate === 'ui') {
    return { tier: 'not-classified', reasons: ['packages/ui is the Tamagui wrapper; not part of the migration frontier'] }
  }

  const runtime = imports.filter((imp) => imp.mechanism !== 'mock')
  if (runtime.length === 0) {
    return { tier: 'mock-only', reasons: ['only require()/import() test-mock references'] }
  }
  if (runtime.every((imp) => imp.typeOnly)) {
    return { tier: 'types-only', reasons: ['all tamagui-related imports are type-only'] }
  }

  const reasons = new Set<string>()
  const categories = new Set<Category>()
  for (const imp of runtime) {
    for (const name of imp.names) {
      if (!name.typeOnly) {
        categories.add(name.category)
      }
    }
    if (imp.mechanism !== 'mock' && imp.specifierKind !== 'ui-src' && !imp.typeOnly) {
      reasons.add('direct-tamagui-runtime-import')
    }
    if (imp.mechanism === 'import' && imp.names.length === 0 && imp.specifierKind === 'ui-src') {
      // Re-export barrels / unparsed clauses: treat as component-level coupling.
      categories.add('component')
    }
  }

  if (categories.has('styled') || counts.styledCalls > 0) {
    reasons.add('styled-factory')
  }
  if (categories.has('animation') || counts.animationProps > 0) {
    reasons.add('animation-usage')
  }
  if (categories.has('media') || counts.mediaShorthandProps > 0) {
    reasons.add('media-shorthands')
  }
  if (counts.platformThemeProps > 0) {
    reasons.add('platform-theme-props')
  }
  if (categories.has('component') || categories.has('other')) {
    reasons.add('composed-ui-components')
  }
  const hasThemeHooks = runtime.some((imp) => imp.names.some((n) => !n.typeOnly && THEME_HOOK_NAMES.has(n.name)))
  if (hasThemeHooks) {
    reasons.add('theme-hooks')
  }

  const sortedReasons = [...reasons].sort()
  if (
    reasons.has('styled-factory') ||
    reasons.has('animation-usage') ||
    reasons.has('media-shorthands') ||
    reasons.has('platform-theme-props') ||
    reasons.has('direct-tamagui-runtime-import')
  ) {
    return { tier: 'coupled', reasons: sortedReasons }
  }
  if (reasons.has('composed-ui-components')) {
    return { tier: 'dependent', reasons: sortedReasons }
  }
  if (reasons.has('theme-hooks')) {
    return { tier: 'simple', reasons: sortedReasons }
  }
  return { tier: 'leaf', reasons: ['only primitives/icons/token values with mycelium parity paths'] }
}

// ── File enumeration ─────────────────────────────────────────────────

export function isSourceFile(path: string): boolean {
  if (!SOURCE_EXTENSIONS.some((ext) => path.endsWith(ext))) {
    return false
  }
  if (EXCLUDED_FILE_SUFFIXES.some((suffix) => path.endsWith(suffix))) {
    return false
  }
  const segments = path.split('/')
  return !segments.some((segment) => (EXCLUDED_DIR_NAMES as readonly string[]).includes(segment))
}

function listSourceFiles(): string[] {
  const result = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...SCAN_ROOTS], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  if (result.status !== 0) {
    throw new Error(`git ls-files failed: ${result.stderr}`)
  }
  return result.stdout.split('\n').filter((path) => path !== '' && isSourceFile(path)).sort()
}

function gitCommitSha(): string | null {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: REPO_ROOT, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : null
}

// ── Census assembly ──────────────────────────────────────────────────

export interface BucketTotals {
  files: number
  sideEffectOnlyFiles: number
  mockOnlyFiles: number
  allFiles: number
  usages: number
}

function emptyBucket(): BucketTotals {
  return { files: 0, sideEffectOnlyFiles: 0, mockOnlyFiles: 0, allFiles: 0, usages: 0 }
}

function addToBucket(bucket: BucketTotals, file: FileRecord): void {
  if (file.imports.some((imp) => imp.mechanism === 'import')) {
    bucket.files += 1
  } else if (file.imports.some((imp) => imp.mechanism === 'side-effect')) {
    bucket.sideEffectOnlyFiles += 1
  } else {
    bucket.mockOnlyFiles += 1
  }
  bucket.allFiles += 1
  bucket.usages += file.usages
}

export interface ScanMetadata {
  roots: string[]
  extensions: string[]
  excludedDirNames: string[]
  excludedFileSuffixes: string[]
  enumeration: string
  sourceFilesScanned: number
}

export interface CensusMetadata {
  tool: string
  generatedAt?: string
  gitCommit: string | null
  scan: ScanMetadata
  counting: Record<string, string>
  estates: Record<string, string>
}

export interface ToMigrateTotals extends BucketTotals {
  byEstate: Record<string, BucketTotals>
  byPlatform: Record<string, BucketTotals>
}

export interface CensusTotals {
  toMigrate: ToMigrateTotals
  uiPackage: BucketTotals
  repo: BucketTotals
}

export interface ProjectRollup extends BucketTotals {
  estate: Estate
  convertibility: Record<string, number>
}

export interface FileHotspot {
  path: string
  estate: Estate
  usages: number
  tier: Tier
}

export interface DirectoryHotspot {
  path: string
  files: number
  usages: number
}

export interface CensusHotspots {
  files: FileHotspot[]
  directories: DirectoryHotspot[]
}

export interface CensusConvertibility {
  heuristicVersion: number
  tiers: Record<string, string>
  totals: Record<string, number>
  byEstate: Record<string, Record<string, number>>
}

export interface Census {
  schemaVersion: number
  metadata: CensusMetadata
  totals: CensusTotals
  byProject: Record<string, ProjectRollup>
  hotspots: CensusHotspots
  convertibility: CensusConvertibility
  files: FileRecord[]
}

export function buildCensus(options: { includeGeneratedAt: boolean }): Census {
  const allPaths = listSourceFiles()
  const allPathSet = new Set(allPaths)
  const files: FileRecord[] = []

  for (const path of allPaths) {
    const content = readFileSync(join(REPO_ROOT, path), 'utf8')
    // Fast pre-filter before regex work.
    if (!content.includes('tamagui') && !content.includes('ui/src')) {
      continue
    }
    const { imports, clauseRanges } = parseImports(content)
    if (imports.length === 0) {
      continue
    }
    const estate = estateOf(path)
    const counts = countUsages(content, imports, clauseRanges)
    files.push({
      path,
      project: projectOf(path),
      estate,
      ...platformOf(path, estate, allPathSet),
      imports,
      counts,
      usages: usageScore(counts),
      convertibility: classifyConvertibility(estate, imports, counts),
    })
  }

  // Totals.
  const byEstate = new Map<Estate, BucketTotals>(ALL_ESTATES.map((estate) => [estate, emptyBucket()]))
  const toMigrate = emptyBucket()
  const uiPackage = emptyBucket()
  const repo = emptyBucket()
  const byPlatform = new Map<Platform, BucketTotals>([
    ['web-only', emptyBucket()],
    ['native-only', emptyBucket()],
    ['cross-platform', emptyBucket()],
  ])

  for (const file of files) {
    const estateBucket = byEstate.get(file.estate)
    if (estateBucket !== undefined) {
      addToBucket(estateBucket, file)
    }
    addToBucket(repo, file)
    if (file.estate === 'ui') {
      addToBucket(uiPackage, file)
    } else {
      addToBucket(toMigrate, file)
      const platformBucket = byPlatform.get(file.platform)
      if (platformBucket !== undefined) {
        addToBucket(platformBucket, file)
      }
    }
  }

  // Per-project rollup.
  const projects = new Map<string, { estate: Estate; bucket: BucketTotals; tiers: Map<Tier, number> }>()
  for (const file of files) {
    let entry = projects.get(file.project)
    if (entry === undefined) {
      entry = { estate: file.estate, bucket: emptyBucket(), tiers: new Map() }
      projects.set(file.project, entry)
    }
    addToBucket(entry.bucket, file)
    entry.tiers.set(file.convertibility.tier, (entry.tiers.get(file.convertibility.tier) ?? 0) + 1)
  }
  const byProject: Record<string, ProjectRollup> = {}
  for (const project of [...projects.keys()].sort()) {
    const entry = projects.get(project)
    if (entry === undefined) {
      continue
    }
    const tiers: Record<string, number> = {}
    for (const tier of [...TIER_ORDER, 'not-classified' as Tier]) {
      const count = entry.tiers.get(tier)
      if (count !== undefined) {
        tiers[tier] = count
      }
    }
    byProject[project] = { estate: entry.estate, ...entry.bucket, convertibility: tiers }
  }

  // Hotspots (to-migrate estates only; packages/ui is out of scope).
  const migrateFiles = files.filter((file) => file.estate !== 'ui')
  const hotspotFiles = [...migrateFiles]
    .sort((a, b) => b.usages - a.usages || (a.path < b.path ? -1 : 1))
    .slice(0, 25)
    .map((file) => ({ path: file.path, estate: file.estate, usages: file.usages, tier: file.convertibility.tier }))
  const dirTotals = new Map<string, { files: number; usages: number }>()
  for (const file of migrateFiles) {
    const dir = dirname(file.path)
    const entry = dirTotals.get(dir) ?? { files: 0, usages: 0 }
    entry.files += 1
    entry.usages += file.usages
    dirTotals.set(dir, entry)
  }
  const hotspotDirs = [...dirTotals.entries()]
    .sort((a, b) => b[1].usages - a[1].usages || (a[0] < b[0] ? -1 : 1))
    .slice(0, 25)
    .map(([path, totals]) => ({ path, ...totals }))

  // Convertibility rollup (to-migrate estates only).
  const tierTotals: Record<string, number> = {}
  const tierByEstate: Record<string, Record<string, number>> = {}
  for (const tier of TIER_ORDER) {
    tierTotals[tier] = 0
  }
  for (const estate of TO_MIGRATE_ESTATES) {
    tierByEstate[estate] = {}
    for (const tier of TIER_ORDER) {
      tierByEstate[estate][tier] = 0
    }
  }
  for (const file of migrateFiles) {
    const tier = file.convertibility.tier
    tierTotals[tier] = (tierTotals[tier] ?? 0) + 1
    const estateTiers = tierByEstate[file.estate]
    if (estateTiers !== undefined) {
      estateTiers[tier] = (estateTiers[tier] ?? 0) + 1
    }
  }

  const estateTotals: Record<string, BucketTotals> = {}
  for (const estate of TO_MIGRATE_ESTATES) {
    estateTotals[estate] = byEstate.get(estate) ?? emptyBucket()
  }
  const platformTotals: Record<string, BucketTotals> = {}
  for (const [platform, bucket] of byPlatform) {
    platformTotals[platform] = bucket
  }

  const metadata: CensusMetadata = {
    tool: 'scripts/tamagui-migration/tamagui-census.ts',
    ...(options.includeGeneratedAt ? { generatedAt: new Date().toISOString() } : {}),
    gitCommit: gitCommitSha(),
    scan: {
      roots: [...SCAN_ROOTS],
      extensions: [...SOURCE_EXTENSIONS],
      excludedDirNames: [...EXCLUDED_DIR_NAMES],
      excludedFileSuffixes: [...EXCLUDED_FILE_SUFFIXES],
      enumeration: 'git ls-files --cached --others --exclude-standard (gitignored files never scanned)',
      sourceFilesScanned: allPaths.length,
    },
    counting: {
      files: 'distinct files with at least one static `import`/`export ... from` of tamagui, @tamagui/*, or ui/src',
      sideEffectOnlyFiles: "files whose only match is a side-effect import (e.g. `import '@tamagui/core/reset.css'`) — runtime coupling, kept out of `files` to stay comparable with line-scan baselines",
      mockOnlyFiles: 'files whose only matches are require()/dynamic-import() test mocks',
      allFiles: 'files + sideEffectOnlyFiles + mockOnlyFiles',
      usages:
        'per file: references to imported tamagui-related bindings outside import statements + styled() calls + animation props + media shorthand props + $platform-/$theme- props',
    },
    estates: {
      web: 'apps/web',
      extension: 'apps/extension',
      mobile: 'apps/mobile',
      wallet: 'packages/wallet',
      'packages-shared': 'packages/* minus wallet minus ui',
      'apps-other': 'apps/* minus web/extension/mobile',
      ui: 'packages/ui — the Tamagui wrapper itself; reported separately, never summed into to-migrate totals',
    },
  }

  return {
    schemaVersion: SCHEMA_VERSION,
    metadata,
    totals: {
      toMigrate: { ...toMigrate, byEstate: estateTotals, byPlatform: platformTotals },
      uiPackage,
      repo,
    },
    byProject,
    hotspots: { files: hotspotFiles, directories: hotspotDirs },
    convertibility: {
      heuristicVersion: HEURISTIC_VERSION,
      tiers: {
        'mock-only': 'only require()/import() test-mock references; no runtime frontier',
        'types-only': 'every tamagui-related import is type-only; erased at runtime',
        leaf: 'only primitives/icons/token values with mycelium parity paths; easy wins',
        simple: 'leaf plus theme hooks (useSporeColors/useIsDarkMode)',
        dependent: 'imports composed ui/src components; mechanical once those have mycelium equivalents',
        coupled: 'styled()/animations/media shorthands/$platform props/useMedia/direct tamagui runtime imports',
      },
      totals: tierTotals,
      byEstate: tierByEstate,
    },
    files,
  }
}

// ── Markdown summary ─────────────────────────────────────────────────

function pct(part: number, whole: number): string {
  return whole === 0 ? '0%' : `${((part / whole) * 100).toFixed(1)}%`
}

export function renderSummary(census: Census): string {
  const { totals, convertibility, hotspots, metadata } = census

  const lines: string[] = []
  lines.push('# Tamagui census')
  lines.push('')
  const shaText = metadata.gitCommit !== null && metadata.gitCommit !== undefined ? metadata.gitCommit : 'unknown'
  const generatedText = metadata.generatedAt !== undefined ? ` · generated ${metadata.generatedAt}` : ''
  lines.push(`Commit \`${shaText}\`${generatedText} · schema v${census.schemaVersion}`)
  lines.push('')
  lines.push('## Migration frontier (to migrate)')
  lines.push('')
  lines.push('| Estate | Files | All files (+side-effect/mock-only) | Usages |')
  lines.push('|---|---:|---:|---:|')
  for (const estate of TO_MIGRATE_ESTATES) {
    const bucket = totals.toMigrate.byEstate[estate]
    if (bucket === undefined || bucket.allFiles === 0) {
      continue
    }
    lines.push(`| ${estate} | ${bucket.files} | ${bucket.allFiles} | ${bucket.usages} |`)
  }
  lines.push(
    `| **total to migrate** | **${totals.toMigrate.files}** | **${totals.toMigrate.allFiles}** | **${totals.toMigrate.usages}** |`,
  )
  lines.push('')
  lines.push(
    `packages/ui (Tamagui wrapper, reported separately): ${totals.uiPackage.files} files / ${totals.uiPackage.usages} usages. ` +
      `Repo total: ${totals.repo.files} files / ${totals.repo.usages} usages.`,
  )
  lines.push('')
  lines.push('## Platform split (to migrate)')
  lines.push('')
  lines.push('| Platform | Files | All files (+side-effect/mock-only) | Usages |')
  lines.push('|---|---:|---:|---:|')
  for (const [platform, bucket] of Object.entries(totals.toMigrate.byPlatform)) {
    lines.push(`| ${platform} | ${bucket.files} | ${bucket.allFiles} | ${bucket.usages} |`)
  }
  lines.push('')
  lines.push('## Convertibility (to migrate)')
  lines.push('')
  lines.push('| Tier | Files | Share |')
  lines.push('|---|---:|---:|')
  const tierTotal = Object.values(convertibility.totals).reduce((sum, count) => sum + count, 0)
  for (const tier of TIER_ORDER) {
    const count = convertibility.totals[tier] ?? 0
    lines.push(`| ${tier} | ${count} | ${pct(count, tierTotal)} |`)
  }
  lines.push('')
  lines.push('Heuristic v' + String(HEURISTIC_VERSION) + ': see `convertibility.tiers` in the JSON for tier definitions.')
  lines.push('')
  lines.push('## Hotspots (top 10 files)')
  lines.push('')
  lines.push('| File | Estate | Usages | Tier |')
  lines.push('|---|---|---:|---|')
  for (const file of hotspots.files.slice(0, 10)) {
    lines.push(`| ${file.path} | ${file.estate} | ${file.usages} | ${file.tier} |`)
  }
  lines.push('')
  lines.push('## Hotspots (top 10 directories)')
  lines.push('')
  lines.push('| Directory | Files | Usages |')
  lines.push('|---|---:|---:|')
  for (const dir of hotspots.directories.slice(0, 10)) {
    lines.push(`| ${dir.path} | ${dir.files} | ${dir.usages} |`)
  }
  lines.push('')
  return lines.join('\n')
}

// ── CLI ───────────────────────────────────────────────────────────────

function main(argv: string[]): void {
  let jsonPath: string | null = null
  let summaryPath: string | null = null
  let includeGeneratedAt = true

  const requireValue = (flag: string, value: string | undefined): string => {
    if (value === undefined) {
      process.stderr.write(`Missing value for ${flag}\n`)
      process.exit(2)
    }
    return value
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--json') {
      jsonPath = requireValue(arg, argv[i + 1])
      i += 1
    } else if (arg === '--summary') {
      summaryPath = requireValue(arg, argv[i + 1])
      i += 1
    } else if (arg === '--no-generated-at') {
      includeGeneratedAt = false
    } else {
      process.stderr.write(`Unknown argument: ${String(arg)}\n`)
      process.exit(2)
    }
  }

  const census = buildCensus({ includeGeneratedAt })
  const summary = renderSummary(census)

  if (jsonPath !== null) {
    mkdirSync(dirname(jsonPath), { recursive: true })
    writeFileSync(jsonPath, `${JSON.stringify(census, null, 2)}\n`)
    process.stderr.write(`Wrote ${jsonPath}\n`)
  }
  if (summaryPath !== null) {
    mkdirSync(dirname(summaryPath), { recursive: true })
    writeFileSync(summaryPath, summary)
    process.stderr.write(`Wrote ${summaryPath}\n`)
  }
  if (jsonPath === null && summaryPath === null) {
    process.stdout.write(summary)
  }
}

if (import.meta.main) {
  main(process.argv.slice(2))
}
