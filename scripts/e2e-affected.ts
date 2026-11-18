#!/usr/bin/env bun
/**
 * Selects the end-to-end tests a change can reach and packs them into CI
 * matrix legs. One selector, one target per app: `TARGETS` says where an
 * app's tests live, which Nx project reaches them and whether they are
 * co-located with the code they cover. Consumed by the `*_affected` workflows.
 *
 * Nx answers "is the app affected?" at project level; this script answers
 * "which of its tests" at file level:
 *   1. a changed spec selects itself;
 *   2. a change inside a co-located area selects every spec under that area
 *      (web: apps/web/src/{pages,components,features}/<Area>/; targets whose
 *      tests live apart from the code have no areas and rely on rules);
 *   3. a rule in the target's rules file maps a path prefix (shared package
 *      code, cross-area app code) to spec prefixes;
 *   4. anything else that can reach the app — the rest of the app, a
 *      transitive Nx dependency of its project, or a path no project owns —
 *      selects the full suite, because nothing can narrow it;
 *   5. a change under a project the app does not depend on, or under a path
 *      the rules file lists as `ignore`, selects nothing.
 * Specs the rules file lists as `unstable` (flaky on the scheduled record) or
 * `broken` (red on main every run, waiting for an owner) are withheld from
 * every step but the first: the scheduled suites keep running them, and this
 * tier runs one only when the change edits it. The two lists are kept apart
 * so a broken test is a visible debt with a name, not a flake nobody owns.
 *
 * Env (all read by main()):
 *   TARGET                 which app's tests to select: a key of TARGETS (default web)
 *   RUN_ALL                'true' → full suite (the orchestrator's run-all)
 *   CHANGED_FILES_PATH     one repo-relative path per line; unreadable → full (fail open)
 *   GRAPH_PATH             `nx graph --file` output, for project roots and the app's dependency closure
 *   SPEC_ROOT              overrides the target's spec directory
 *   MAP_PATH               overrides the target's rules file
 *   FALLBACK               'full' (default) runs the whole suite when nothing can narrow the
 *                          change; 'skip' runs nothing and says why
 *   INCLUDE_ANVIL          'false' drops *.anvil.e2e.test.ts legs (default true; web only)
 *   MAX_SHARDS             upper bound on legs per test type (default 8)
 *   SPECS_PER_SHARD        target spec files per leg before splitting (default 8)
 *   GITHUB_OUTPUT          receives legs, files, mode, spec-count, reason (and tags for a tagged target)
 *
 * Logging goes to stderr; stdout stays empty so callers can pipe outputs.
 */
import { appendFileSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'

export type TestType = 'anvil' | 'non-anvil' | 'default'
export type SelectionMode = 'none' | 'targeted' | 'full'

export interface AffectedTarget {
  name: string
  /** Nx project whose transitive dependencies can reach the tests. */
  project: string
  /** The app the tests exercise: a change inside it that no area or rule claims runs the full suite. */
  appRoot: string
  /** Directory walked for specs. */
  specRoot: string
  /** The rules file. */
  mapPath: string
  /** Leg `files` are written relative to this directory, the way the test runner wants them. */
  filesRelativeTo: string
  /** Test types the legs are split by; one entry means legs are named without it. */
  testTypes: readonly TestType[]
  isSpec(path: string): boolean
  testTypeOf(spec: string): TestType
  /** The co-located area a path belongs to, or null when this target's tests live apart from the code. */
  areaOf(path: string): string | null
  /** The tag a runner selects this spec by, for runners that take tags rather than file lists (Maestro). */
  tagOf?(spec: string): string
  /**
   * The tier's own CI files (its workflow, the actions it runs the tests through). A change to
   * them has to prove the tier like a selector change does, so they are never narrowed or ignored
   * even though `.github/` is on every ignore list.
   */
  ciPaths?: readonly string[]
}

const WEB_ROOT = 'apps/web'
const WEB_SRC = `${WEB_ROOT}/src/`
const WEB_AREA_DIRS = new Set(['pages', 'components', 'features'])

/** `apps/web/src/pages/Swap/Swap/Swap.e2e.test.ts` → `apps/web/src/pages/Swap/`; null outside an area. */
function webAreaOf(path: string): string | null {
  if (!path.startsWith(WEB_SRC)) {
    return null
  }
  const [kind, area] = path.slice(WEB_SRC.length).split('/')
  if (!kind || !area || !WEB_AREA_DIRS.has(kind) || path === `${WEB_SRC}${kind}/${area}`) {
    return null
  }
  return `${WEB_SRC}${kind}/${area}/`
}

export const TARGETS: Record<string, AffectedTarget> = {
  web: {
    name: 'web',
    project: '@universe/web',
    appRoot: WEB_ROOT,
    specRoot: `${WEB_ROOT}/src`,
    mapPath: `${WEB_ROOT}/src/playwright/e2e-affected.json`,
    filesRelativeTo: WEB_ROOT,
    testTypes: ['non-anvil', 'anvil'],
    isSpec: (path) => path.endsWith('.e2e.test.ts'),
    testTypeOf: (spec) => (spec.endsWith('.anvil.e2e.test.ts') ? 'anvil' : 'non-anvil'),
    areaOf: webAreaOf,
    ciPaths: ['.github/workflows/web_e2e_tests_playwright_affected.yml', '.github/actions/playwright_matrix_test/'],
  },
  // Extension specs live under e2e/tests, apart from the code, so there are no
  // areas: the rules file carries every narrowing, and extension code it does
  // not name runs the whole (nine-file) suite.
  extension: {
    name: 'extension',
    project: '@uniswap/extension',
    appRoot: 'apps/extension',
    specRoot: 'apps/extension/e2e/tests',
    mapPath: 'apps/extension/e2e/e2e-affected.json',
    filesRelativeTo: 'apps/extension',
    testTypes: ['default'],
    isSpec: (path) => path.endsWith('.test.ts'),
    testTypeOf: () => 'default',
    areaOf: () => null,
    ciPaths: ['.github/workflows/extension_e2e_tests_playwright.yml'],
  },
  // Maestro flows under .maestro/flows, run on Maestro Cloud by tag: every flow
  // carries `flow-<basename>` (checked by the script tests) and the workflow
  // passes the selected tags as include-tags. No areas; the rules file narrows.
  mobile: {
    name: 'mobile',
    project: '@uniswap/mobile',
    appRoot: 'apps/mobile',
    specRoot: 'apps/mobile/.maestro/flows',
    mapPath: 'apps/mobile/.maestro/e2e-affected.json',
    filesRelativeTo: 'apps/mobile/.maestro',
    testTypes: ['default'],
    isSpec: (path) => path.endsWith('.yaml'),
    testTypeOf: () => 'default',
    areaOf: () => null,
    tagOf: (spec) => `flow-${basename(spec, '.yaml')}`,
    ciPaths: ['.github/workflows/mobile_e2e_tests_affected.yml', '.github/actions/mobile_build/'],
  },
}

export interface AffectedRule {
  /** Repo-relative path prefixes (or exact files) that trigger the rule. */
  paths: string[]
  /** Spec path prefixes (or exact files) relative to the target's spec root that the rule selects. */
  specs: string[]
}

export interface AffectedMap {
  /** Specs never selected here (they have their own job). Relative to the spec root. */
  exclude?: string[]
  /** Repo-relative prefixes no Nx project owns that still cannot reach the app. */
  ignore?: string[]
  /**
   * Specs withheld from this tier while their scheduled-run record is unclean,
   * relative to the spec root. They stay in the scheduled suites and still run
   * here when the change edits them. An entry that matches no spec fails the selector.
   */
  unstable?: string[]
  /**
   * Specs red on main on every scheduled run: withheld like `unstable`, listed
   * separately so the summary names them as debt to fix, with the same stale-entry check.
   */
  broken?: string[]
  /**
   * Entries of `unstable` or `broken` the weekly refresh (release-e2e tier-lists) never removes:
   * withheld for a reason the scheduled record cannot see. Read by the refresh only, never here.
   */
  pinned?: string[]
  rules: AffectedRule[]
}

export interface SelectionInput {
  target: AffectedTarget
  runAll: boolean
  /** null when the diff could not be read — fail open into the full suite. */
  changedFiles: string[] | null
  /** Every spec this tier may select, repo-relative: `map.exclude` and `map.unstable` removed. */
  specs: string[]
  /** The withheld `map.unstable` and `map.broken` specs, repo-relative; one is selected only when it changed. */
  unstableSpecs?: string[]
  /** Repo-relative roots of the target project's transitive Nx dependencies, the project itself excluded. */
  dependencyRoots: string[]
  /** Repo-relative roots of every Nx project, for "does any project own this path". */
  projectRoots: string[]
  map: AffectedMap
}

export interface Selection {
  mode: SelectionMode
  specs: string[]
  reasons: string[]
  /**
   * Set when `full` came from a changed file nothing narrows — not from run-all,
   * a missing diff or a selector change, which always run the whole suite.
   */
  deferrable?: boolean
  /** Under `deferrable`: the specs the other changed files reached directly. */
  targeted?: string[]
}

export interface Leg {
  name: string
  'test-type': TestType
  /** Space-separated spec paths relative to the target's `filesRelativeTo`. */
  files: string
  'shard-index': number
  'shard-total': number
  specs: number
}

function underDir(path: string, dir: string): boolean {
  return path === dir || path.startsWith(dir.endsWith('/') ? dir : `${dir}/`)
}

function matchesPrefix(path: string, prefix: string): boolean {
  return prefix.endsWith('/') ? path.startsWith(prefix) : path === prefix || path.startsWith(`${prefix}/`)
}

/** An `ignore` entry is a prefix, or `**​/name` for that basename at any depth (docs, agent config). */
function matchesIgnore(path: string, entry: string): boolean {
  return entry.startsWith('**/') ? basename(path) === entry.slice(3) : matchesPrefix(path, entry)
}

/** The selector and the target's rules: a change here has to prove the tier, so it is never narrowed or ignored. */
export function selectorPaths(target: AffectedTarget): string[] {
  return ['scripts/e2e-affected.ts', 'scripts/e2e-affected.test.ts', target.mapPath, ...(target.ciPaths ?? [])]
}

export function selectSpecs(input: SelectionInput): Selection {
  const { target, runAll, changedFiles, specs, dependencyRoots, projectRoots, map } = input
  const full = (reason: string): Selection => ({ mode: 'full', specs: [...specs], reasons: [reason] })
  if (runAll) {
    return full('run-all: every check runs')
  }
  if (changedFiles === null) {
    return full('changed files unavailable: failing open')
  }
  // Prefix match: a ciPaths entry may be a directory (an action), and changed files are files.
  const selectorOwned = selectorPaths(target)
  const specSet = new Set(specs)
  const unstableSet = new Set(input.unstableSpecs ?? [])
  const selected = new Set<string>()
  const reasons: string[] = []
  // The first un-narrowable file decides `full`, but the loop keeps collecting what the
  // other files reach, so FALLBACK=skip can still run that targeted set instead of nothing.
  let deferReason: string | null = null
  const defer = (reason: string): void => {
    deferReason ??= reason
  }

  for (const file of changedFiles) {
    if (selectorOwned.some((owned) => matchesPrefix(file, owned))) {
      return full(`${file}: the selector itself changed — the full suite proves the tier`)
    }
    if ((map.ignore ?? []).some((entry) => matchesIgnore(file, entry))) {
      continue
    }
    if (specSet.has(file)) {
      selected.add(file)
      reasons.push(`${file}: changed spec`)
      continue
    }
    // Editing a withheld spec is how it gets fixed, so that is the one change that runs it here.
    if (unstableSet.has(file)) {
      selected.add(file)
      reasons.push(`${file}: changed spec (withheld as unstable or broken, runs because it changed)`)
      continue
    }
    const rules = map.rules.filter((rule) => rule.paths.some((prefix) => matchesPrefix(file, prefix)))
    if (rules.length > 0) {
      let hits = 0
      for (const rule of rules) {
        for (const specPrefix of rule.specs) {
          const absolute = join(target.specRoot, specPrefix)
          for (const spec of specs) {
            if (matchesPrefix(spec, absolute)) {
              selected.add(spec)
              hits += 1
            }
          }
        }
      }
      // Rule prefixes are validated against the full pool at load, so zero hits here means
      // every spec the rule names is currently withheld.
      const rulesFile = basename(target.mapPath)
      reasons.push(
        hits === 0
          ? `${file}: 0 spec(s) via ${rulesFile} — every spec its rule names is withheld`
          : `${file}: ${hits} spec(s) via ${rulesFile}`,
      )
      continue
    }
    // An area counts only when a spec lives under it; a spec-less directory (shared
    // components, features) is app code nothing narrows and falls through to `full`.
    const area = target.areaOf(file)
    const areaSpecs = area ? specs.filter((spec) => spec.startsWith(area)) : []
    if (area && areaSpecs.length > 0) {
      for (const spec of areaSpecs) {
        selected.add(spec)
      }
      reasons.push(`${file}: ${areaSpecs.length} spec(s) under ${area}`)
      continue
    }
    if (underDir(file, target.appRoot)) {
      defer(`${file}: ${target.name} code outside an area — nothing narrows it`)
    } else if (dependencyRoots.some((root) => underDir(file, root))) {
      defer(`${file}: inside a package ${target.project} depends on — nothing narrows it`)
    } else if (!projectRoots.some((root) => underDir(file, root))) {
      defer(`${file}: owned by no Nx project — treated as reaching ${target.name}`)
    }
    // Otherwise: a project the app does not depend on, which cannot reach it.
  }

  if (deferReason !== null) {
    return {
      ...full(deferReason),
      reasons: [...reasons, deferReason],
      deferrable: true,
      targeted: [...selected].sort(),
    }
  }

  if (selected.size === 0) {
    return {
      mode: 'none',
      specs: [],
      reasons: reasons.length > 0 ? reasons : [`no changed file reaches ${target.name}`],
    }
  }
  return { mode: 'targeted', specs: [...selected].sort(), reasons }
}

/** Roots of the projects reachable from `project` in `graph` through project (not npm) edges. */
export function dependencyRoots(
  graph: NxGraphFile,
  project: string,
): { dependencyRoots: string[]; projectRoots: string[] } {
  const { nodes, dependencies } = graph.graph
  const seen = new Set<string>()
  const stack = [project]
  while (stack.length > 0) {
    const name = stack.pop() as string
    for (const edge of dependencies[name] ?? []) {
      if (edge.target.startsWith('npm:') || seen.has(edge.target) || edge.target === project) {
        continue
      }
      seen.add(edge.target)
      stack.push(edge.target)
    }
  }
  const rootOf = (name: string): string | undefined => nodes[name]?.data.root
  const roots = (names: Iterable<string>): string[] =>
    [...names]
      .map(rootOf)
      .filter((root): root is string => root !== undefined && root !== '.' && root !== '')
      .sort()
  return { dependencyRoots: roots(seen), projectRoots: roots(Object.keys(nodes)) }
}

export interface NxGraphFile {
  graph: {
    nodes: Record<string, { data: { root: string } }>
    dependencies: Record<string, { source: string; target: string; type: string }[]>
  }
}

export interface PackOptions {
  target: AffectedTarget
  maxShards: number
  specsPerShard: number
  /** false drops the `anvil` test type (web); other types are unaffected. */
  includeAnvil: boolean
  /** Spec → relative cost. Missing entries count as 1. */
  weights?: Record<string, number>
}

/**
 * Packs specs into legs per test type: enough legs to keep each near
 * `specsPerShard` files, capped at `maxShards`, filled heaviest-first onto
 * the lightest leg so a few long specs do not stretch one runner.
 */
export function packLegs(specs: string[], options: PackOptions): Leg[] {
  const { target } = options
  const legs: Leg[] = []
  const types = target.testTypes.filter((type) => options.includeAnvil || type !== 'anvil')
  for (const type of types) {
    const ofType = specs.filter((spec) => target.testTypeOf(spec) === type)
    if (ofType.length === 0) {
      continue
    }
    const count = Math.max(1, Math.min(options.maxShards, Math.ceil(ofType.length / options.specsPerShard)))
    const buckets = Array.from({ length: count }, () => ({ weight: 0, files: [] as string[] }))
    const weighted = ofType
      .map((spec) => ({ spec, weight: options.weights?.[spec] ?? 1 }))
      .sort((a, b) => b.weight - a.weight || a.spec.localeCompare(b.spec))
    for (const { spec, weight } of weighted) {
      const lightest = buckets.reduce((best, bucket) => (bucket.weight < best.weight ? bucket : best))
      lightest.weight += weight
      lightest.files.push(spec)
    }
    buckets.forEach((bucket, index) => {
      if (bucket.files.length === 0) {
        return
      }
      const shard = `${index + 1}/${count}`
      legs.push({
        name: target.testTypes.length === 1 ? shard : `${type} ${shard}`,
        'test-type': type,
        files: bucket.files
          .sort()
          .map((spec) => relative(target.filesRelativeTo, spec))
          .join(' '),
        'shard-index': index + 1,
        'shard-total': count,
        specs: bucket.files.length,
      })
    })
  }
  return legs
}

const TEST_CALL = /^\s*test(?:\.(?:only|skip|fixme))?\(/gm

/** Test-call count per spec, the cheap stand-in for duration until we read it from Datadog. */
export function specWeights(specs: string[], readSpec: (spec: string) => string): Record<string, number> {
  const weights: Record<string, number> = {}
  for (const spec of specs) {
    const matches = readSpec(spec).match(TEST_CALL)
    weights[spec] = Math.max(1, matches?.length ?? 0)
  }
  return weights
}

export function listSpecs(specRoot: string, exclude: string[] = [], isSpec = TARGETS['web']!.isSpec): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry)
      if (statSync(path).isDirectory()) {
        walk(path)
      } else if (isSpec(path)) {
        out.push(path)
      }
    }
  }
  walk(specRoot)
  return out.filter((spec) => !exclude.some((prefix) => matchesPrefix(spec, join(specRoot, prefix)))).sort()
}

/**
 * Every rule spec prefix must name at least one spec in the tree, so a renamed or deleted
 * spec fails the run loudly instead of letting its rule select nothing. The pool is the
 * tree before `exclude`: a rule may name an excluded spec (its own job runs it today, and
 * the rule starts selecting it the day the exclusion goes), so that is not a stale entry.
 */
export function validateRuleSpecs(map: AffectedMap, allSpecs: readonly string[], specRoot: string): void {
  for (const rule of map.rules) {
    for (const prefix of rule.specs) {
      const absolute = join(specRoot, prefix)
      if (!allSpecs.some((spec) => matchesPrefix(spec, absolute))) {
        throw new Error(`e2e-affected.json rule spec "${prefix}" matches no spec under ${specRoot}`)
      }
    }
  }
}

/**
 * A positive integer from the environment, else `fallback`. A workflow_dispatch run
 * leaves the workflow_call inputs blank, and `Number('')` is 0 — which would pack
 * every spec into one leg.
 */
export function positiveIntFromEnv(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return value !== undefined && value !== '' && Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export function withholdUnstable(
  specs: string[],
  unstable: string[],
  specRoot: string,
  listName = 'unstable',
): { specs: string[]; unstable: string[] } {
  const withheld = new Set<string>()
  for (const entry of unstable) {
    const absolute = join(specRoot, entry)
    const matched = specs.filter((spec) => matchesPrefix(spec, absolute))
    if (matched.length === 0) {
      throw new Error(`e2e-affected.json ${listName} entry matches no spec: ${entry}`)
    }
    for (const spec of matched) {
      withheld.add(spec)
    }
  }
  return { specs: specs.filter((spec) => !withheld.has(spec)), unstable: [...withheld].sort() }
}

/** `unstable` then `broken`, each checked against what is left so one spec cannot sit in both lists unnoticed. */
export function withhold(
  specs: string[],
  map: Pick<AffectedMap, 'unstable' | 'broken'>,
  specRoot: string,
): { specs: string[]; unstable: string[]; broken: string[] } {
  const both = (map.unstable ?? []).filter((entry) => (map.broken ?? []).includes(entry))
  if (both.length > 0) {
    throw new Error(`e2e-affected.json entry is in both unstable and broken: ${both.join(', ')}`)
  }
  const first = withholdUnstable(specs, map.unstable ?? [], specRoot, 'unstable')
  const second = withholdUnstable(first.specs, map.broken ?? [], specRoot, 'broken')
  return { specs: second.specs, unstable: first.unstable, broken: second.unstable }
}

function readLines(path: string | undefined): string[] | null {
  if (!path) {
    return null
  }
  try {
    return readFileSync(path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  } catch {
    return null
  }
}

function writeOutput(name: string, value: string): void {
  const target = process.env['GITHUB_OUTPUT']
  if (target) {
    appendFileSync(target, `${name}=${value}\n`)
  }
}

export function resolveTarget(
  name: string,
  overrides: { specRoot?: string | undefined; mapPath?: string | undefined } = {},
): AffectedTarget {
  const target = TARGETS[name]
  if (!target) {
    throw new Error(`unknown TARGET ${name}; expected one of ${Object.keys(TARGETS).join(', ')}`)
  }
  return { ...target, specRoot: overrides.specRoot ?? target.specRoot, mapPath: overrides.mapPath ?? target.mapPath }
}

function main(): void {
  const target = resolveTarget(process.env['TARGET'] || 'web', {
    specRoot: process.env['SPEC_ROOT'],
    mapPath: process.env['MAP_PATH'],
  })
  const map = JSON.parse(readFileSync(target.mapPath, 'utf8')) as AffectedMap
  const graph = JSON.parse(readFileSync(process.env['GRAPH_PATH'] ?? '', 'utf8')) as NxGraphFile
  const roots = dependencyRoots(graph, target.project)
  validateRuleSpecs(map, listSpecs(target.specRoot, [], target.isSpec), target.specRoot)
  const allSpecs = listSpecs(target.specRoot, map.exclude ?? [], target.isSpec)
  const { specs, unstable, broken } = withhold(allSpecs, map, target.specRoot)
  const changedFiles = readLines(process.env['CHANGED_FILES_PATH'])
  const fallback = process.env['FALLBACK'] === 'skip' ? 'skip' : 'full'

  const selection = selectSpecs({
    target,
    runAll: process.env['RUN_ALL'] === 'true',
    changedFiles,
    specs,
    unstableSpecs: [...unstable, ...broken],
    dependencyRoots: roots.dependencyRoots,
    projectRoots: roots.projectRoots,
    map,
  })
  if (unstable.length > 0) {
    selection.reasons.push(
      `${unstable.length} unstable spec(s) withheld from this tier (flaky on the scheduled record, which still runs them)`,
    )
  }
  if (broken.length > 0) {
    selection.reasons.push(
      `${broken.length} broken spec(s) withheld: red on main every scheduled run, need an owner (${broken.map((spec) => basename(spec)).join(', ')})`,
    )
  }

  let legs: Leg[] = []
  let mode: SelectionMode = selection.mode
  let specsToRun = selection.specs
  // Only a `full` that came from an un-narrowable file is deferred to the scheduled suite;
  // what the other changed files reached directly still runs. run-all, a missing diff and a
  // selector change keep the whole suite regardless of the fallback.
  if (selection.mode === 'full' && fallback === 'skip' && selection.deferrable) {
    const targeted = selection.targeted ?? []
    if (targeted.length > 0) {
      mode = 'targeted'
      specsToRun = targeted
      selection.reasons.push(
        `FALLBACK=skip: the full suite is left to the scheduled run; running the ${targeted.length} spec(s) the change reaches directly`,
      )
    } else {
      mode = 'none'
      selection.reasons.push('FALLBACK=skip: the scheduled suite covers this change')
    }
  }
  if (mode !== 'none') {
    legs = packLegs(specsToRun, {
      target,
      maxShards: positiveIntFromEnv(process.env['MAX_SHARDS'], 8),
      specsPerShard: positiveIntFromEnv(process.env['SPECS_PER_SHARD'], 8),
      includeAnvil: process.env['INCLUDE_ANVIL'] !== 'false',
      weights: specWeights(specsToRun, (spec) => readFileSync(spec, 'utf8')),
    })
  }
  const specCount = legs.reduce((sum, leg) => sum + leg.specs, 0)

  console.error(`target=${target.name} mode=${mode} specs=${specCount} legs=${legs.length}`)
  for (const reason of selection.reasons) {
    console.error(`  ${reason}`)
  }
  for (const leg of legs) {
    console.error(`  leg ${leg.name}: ${leg.files}`)
  }
  writeOutput('legs', JSON.stringify(legs))
  // Every selected file in one list, for a runner that takes no matrix (one leg).
  writeOutput('files', legs.map((leg) => leg.files).join(' '))
  if (target.tagOf) {
    writeOutput('tags', mode === 'none' ? '' : specsToRun.map(target.tagOf).join(','))
  }
  writeOutput('mode', mode)
  writeOutput('spec-count', String(specCount))
  writeOutput('reason', selection.reasons.join('; '))
}

if (import.meta.main) {
  main()
}
