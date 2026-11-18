#!/usr/bin/env bun
/**
 * Writes the change report for a PR: what changed, how bug-prone that code
 * has been, what the regression catalog says covers it, and which cases need
 * a human. Report only — nothing here changes what CI runs.
 *
 * Risk is read from git: for every area a changed file falls in, the share of
 * the distinct commits on the base branch over HISTORY_SINCE that touched it
 * and were a fix, revert or hotfix (FIX_SUBJECT), tiered by THRESHOLDS once
 * the area has MIN_COMMITS; file touches are shown as context, never scored.
 * A fix share measures where bugs were found, not where they are, which is
 * still the best cheap signal we have; areas whose churn is a migration rather
 * than bugs are listed in CHURN_AREAS and shown without a tier.
 *
 * Coverage is read from packages/casebook through the Casebook engine
 * (apps/cli/src/casebook): a case covers the change when one of its code_paths
 * matches a changed file. Cases with an automation reference are automated;
 * the rest are the manual list; `automatable: true` with no reference is the gap.
 *
 * Env (all read by main()):
 *   CHANGED_FILES_PATH   one repo-relative path per line (required)
 *   SELECTIONS_PATH      optional JSON array of per-app e2e selections (target, mode, specCount, files, reason)
 *   BASE_REF             ref whose history is scored (default origin/main)
 *   HISTORY_SINCE        git --since value (default '180 days ago')
 *   REPORT_PATH          where the markdown goes (default stdout)
 */
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import {
  createBunCatalogFs,
  createCatalogService,
  fileMatchesCodePath,
  hasAutomationRefs,
  loadAreaRegistry,
  resolveTestingDir,
} from '@universe/cli/src/casebook'

export type Tier = 'high' | 'medium' | 'low' | 'unscored' | 'churn'

export interface AreaStats {
  /** Distinct commits that touched the area. */
  commits: number
  fixCommits: number
  /** File touches, for context: a wide commit counts once per file here. */
  touches: number
  fixTouches: number
}

export interface AreaRisk extends AreaStats {
  area: string
  tier: Tier
  changedFiles: string[]
}

export interface CaseRef {
  id: string
  title: string
  /** The catalog directory under packages/casebook, which is how the catalog names its areas. */
  area: string
  priority?: string | undefined
  automatable: boolean
  automated: boolean
}

export type CatalogCase = CaseRef & { codePaths: string[] }

/** One app's e2e selection for this diff, as scripts/e2e-affected.ts wrote it to GITHUB_OUTPUT. */
export interface E2eSelection {
  target: string
  /** `error` when the selector itself failed for that app; the reason then holds its message. */
  mode: 'none' | 'targeted' | 'full' | 'error' | string
  specCount: number
  /** Space-separated test files relative to the app, empty for none. */
  files: string
  /** The selector's reasons, `; `-joined. */
  reason: string
}

export interface Coverage {
  automated: CaseRef[]
  manual: CaseRef[]
}

/** Scored over the window; below this many commits the share is noise. */
export const MIN_COMMITS = 20
/** Tiers are a share of commits only: a volume threshold would make every large area "medium" by size. */
export const THRESHOLDS = { high: 0.3, medium: 0.2 }
/** Churn from migrations or generation, not from bugs: reported, never tiered. Each is an area as areaOf() names it. */
export const CHURN_AREAS = [
  'packages/mycelium/src/compat',
  'packages/tailwind/src/parity',
  'packages/uniswap/src/i18n',
  'packages/ui/src/components/icons',
]

/** Manual cases shown before the list folds; the long tail stays one click away. */
const MANUAL_INLINE = 8
/** Files outside any area listed before the list folds into a count. */
export const OUTSIDE_INLINE = 50
/** GitHub rejects issue comment bodies above this many characters. */
export const MAX_COMMENT_LENGTH = 65_536
const TRUNCATION_FOOTER = '\n\n_Report truncated to fit a GitHub comment._'
const FIX_SUBJECT = /^(fix|revert|hotfix)\b/i
const AREA_PATTERNS = [
  // The extension keeps its features one level down (src/app/features/<X>).
  /^apps\/[^/]+\/src\/app\/features\/[^/]+/,
  /^apps\/[^/]+\/src\/(?:pages|components|features|screens|app)\/[^/]+/,
  /^packages\/[^/]+\/src\/(?:features|components)\/[^/]+/,
  /^(?:apps|packages)\/[^/]+\/src\/[^/]+/,
]

/** The area a path is scored under: the first directory level that reads as a product area; null outside src trees. */
export function areaOf(path: string): string | null {
  for (const pattern of AREA_PATTERNS) {
    const match = pattern.exec(path)
    if (match) {
      return match[0]
    }
  }
  return null
}

/**
 * Parses `git log --format=%x01%H %s --name-only` output into distinct commits and file
 * touches per area. Commits are what the tier reads: one wide fix must not count fifty times.
 */
export function scoreHistory(log: string): Map<string, AreaStats> {
  const stats = new Map<string, AreaStats>()
  const seen = new Set<string>()
  let sha = ''
  let isFix = false
  for (const line of log.split('\n')) {
    if (line.startsWith('\u0001')) {
      const space = line.indexOf(' ')
      sha = space < 0 ? line.slice(1) : line.slice(1, space)
      isFix = FIX_SUBJECT.test(space < 0 ? '' : line.slice(space + 1))
      continue
    }
    if (line.trim() === '') {
      continue
    }
    const area = areaOf(line.trim())
    if (!area) {
      continue
    }
    const entry = stats.get(area) ?? { commits: 0, fixCommits: 0, touches: 0, fixTouches: 0 }
    entry.touches += 1
    if (isFix) {
      entry.fixTouches += 1
    }
    const key = `${area}\u0000${sha}`
    if (!seen.has(key)) {
      seen.add(key)
      entry.commits += 1
      if (isFix) {
        entry.fixCommits += 1
      }
    }
    stats.set(area, entry)
  }
  return stats
}

export function tierOf(area: string, stats: AreaStats | undefined): Tier {
  if (CHURN_AREAS.includes(area)) {
    return 'churn'
  }
  if (!stats || stats.commits < MIN_COMMITS) {
    return 'unscored'
  }
  const share = stats.fixCommits / stats.commits
  if (share >= THRESHOLDS.high) {
    return 'high'
  }
  if (share >= THRESHOLDS.medium) {
    return 'medium'
  }
  return 'low'
}

const share = (stats: AreaStats): number => (stats.commits > 0 ? stats.fixCommits / stats.commits : 0)

export function riskOf(changedFiles: string[], history: Map<string, AreaStats>): AreaRisk[] {
  const byArea = new Map<string, string[]>()
  for (const file of changedFiles) {
    const area = areaOf(file)
    if (area) {
      byArea.set(area, [...(byArea.get(area) ?? []), file])
    }
  }
  const order: Tier[] = ['high', 'medium', 'low', 'unscored', 'churn']
  return [...byArea.entries()]
    .map(([area, files]) => ({
      area,
      ...(history.get(area) ?? { commits: 0, fixCommits: 0, touches: 0, fixTouches: 0 }),
      tier: tierOf(area, history.get(area)),
      changedFiles: files,
    }))
    .sort((a, b) => order.indexOf(a.tier) - order.indexOf(b.tier) || share(b) - share(a))
}

/**
 * Every schema-valid case in the catalog under `repoRoot`, read through the Casebook
 * engine so the report and the gate agree on what a case is and what it covers.
 */
export async function readCases(repoRoot: string): Promise<CatalogCase[]> {
  const fs = createBunCatalogFs({ repoRoot })
  const catalog = createCatalogService({ fs, registry: await loadAreaRegistry({ fs }) })
  return (await catalog.discoverScenarios()).map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    area: basename(resolveTestingDir(scenario.sourcePath)),
    priority: scenario.priority,
    automatable: scenario.automatable,
    automated: hasAutomationRefs(scenario),
    codePaths: scenario.code_paths,
  }))
}

export function coverageOf(changedFiles: string[], cases: CatalogCase[]): Coverage {
  const covering = cases.filter((item) =>
    item.codePaths.some((codePath) => changedFiles.some((file) => fileMatchesCodePath(file, codePath))),
  )
  return {
    automated: covering.filter((item) => item.automated),
    manual: covering.filter((item) => !item.automated),
  }
}

const TIER_LABEL: Record<Tier, string> = {
  high: '🔴 high',
  medium: '🟠 medium',
  low: '🟢 low',
  unscored: '⚪ unscored (too little history)',
  churn: '⚪ churn (migration, not scored)',
}

/**
 * Whether a first comment is worth posting: the report names an area (scored, unscored or churn,
 * each says something about the change), a covering case, or an e2e test a tier selected. The
 * workflow keeps an existing comment current either way, so this only decides the first post.
 */
export function shouldPost(input: {
  risk: AreaRisk[]
  coverage: Coverage
  selections?: E2eSelection[] | undefined
}): boolean {
  const { risk, coverage, selections = [] } = input
  return (
    risk.length > 0 ||
    coverage.automated.length + coverage.manual.length > 0 ||
    selections.some((sel) => sel.mode !== 'none')
  )
}

/** Keeps a comment body under GitHub's limit, cutting at a line break so the markdown stays readable. */
export function capCommentLength(body: string, max = MAX_COMMENT_LENGTH): string {
  if (body.length <= max) {
    return body
  }
  const room = max - TRUNCATION_FOOTER.length
  const cut = body.lastIndexOf('\n', room)
  return body.slice(0, cut > 0 ? cut : room) + TRUNCATION_FOOTER
}

export function renderReport(input: {
  changedFiles: string[]
  risk: AreaRisk[]
  coverage: Coverage
  since: string
  /** Branch whose history was scored, as shown to the reader. */
  base: string
  /** Per-app e2e selection for this diff; absent when the selector did not run. */
  selections?: E2eSelection[] | undefined
}): string {
  const { changedFiles, risk, coverage, since, base, selections } = input
  const outside = changedFiles.filter((file) => !areaOf(file))
  const lines: string[] = ['<!-- change-risk-report -->', '## Change report', '']
  const top = risk.find((area) => area.tier === 'high' || area.tier === 'medium' || area.tier === 'low')
  lines.push(
    `**${changedFiles.length} file(s)** in **${risk.length} area(s)**; highest risk tier: **${top ? TIER_LABEL[top.tier] : 'none scored'}**.`,
    '',
  )
  lines.push(
    '### How risky',
    '',
    `Share of commits on \`${base}\` over the last ${since.replace(/ ago$/, '')} that were a fix, hotfix or revert, per area; file touches shown for context.`,
    '',
  )
  if (risk.length === 0) {
    lines.push('No changed file is under a scored area.', '')
  } else {
    lines.push(
      '| area | changed | commits | fix commits | fix share | file touches | tier |',
      '|---|---:|---:|---:|---:|---:|---|',
    )
    for (const area of risk) {
      lines.push(
        `| \`${area.area}\` | ${area.changedFiles.length} | ${area.commits} | ${area.fixCommits} | ${Math.round(share(area) * 100)}% | ${area.touches} | ${TIER_LABEL[area.tier]} |`,
      )
    }
    lines.push('')
  }
  if (outside.length > 0) {
    const hidden = outside.length - OUTSIDE_INLINE
    lines.push(
      `<details><summary>${outside.length} file(s) outside any area</summary>`,
      '',
      ...outside.slice(0, OUTSIDE_INLINE).map((file) => `- \`${file}\``),
      ...(hidden > 0 ? [`- … and ${hidden} more`] : []),
      '',
      '</details>',
      '',
    )
  }
  if (selections && selections.length > 0) {
    lines.push(
      '### What CI runs',
      '',
      'End-to-end tests the PR tiers select for this diff, same selector and inputs as the jobs:',
      '',
    )
    for (const sel of selections) {
      const files = sel.files
        .split(' ')
        .filter((file) => file.length > 0)
        .map((file) => `\`${file.split('/').pop() ?? file}\``)
      const what =
        sel.mode === 'none'
          ? 'nothing'
          : sel.mode === 'error'
            ? `selector failed, see the Change report job log${sel.reason ? `: ${sel.reason}` : ''}`
            : `${sel.mode}, ${sel.specCount} test${sel.specCount === 1 ? '' : 's'}${files.length > 0 && files.length <= 8 ? `: ${files.join(', ')}` : ''}`
      lines.push(`- **${sel.target}**: ${what}`)
      const reasons = sel.reason
        .split(';')
        .map((r) => r.trim())
        .filter((r) => r.length > 0)
      if (reasons.length > 0 && sel.mode !== 'error') {
        lines.push(`  <details><summary>why</summary>`, '', ...reasons.map((r) => `  - ${r}`), '', '  </details>')
      }
    }
    lines.push('')
  }
  lines.push('### What covers it', '')
  const total = coverage.automated.length + coverage.manual.length
  const gaps = coverage.manual.filter((item) => item.automatable).length
  if (total === 0) {
    lines.push(
      'No Casebook case lists a changed path under `code_paths`. Either the change is not user-facing, or the catalog has a gap here.',
      '',
    )
  } else {
    lines.push(
      `${total} case(s) cover the changed paths: **${coverage.automated.length} automated**, **${coverage.manual.length} manual**, of which **${gaps}** are marked automatable with no automation.`,
      '',
    )
  }
  if (coverage.manual.length > 0) {
    lines.push(
      '### What needs a human',
      '',
      'Manual cases on the changed paths, for the PR author or QA to run or consciously skip:',
      '',
    )
    const line = (item: CaseRef): string =>
      `- \`${item.id}\` ${item.title} — ${item.area}${item.priority ? `, ${item.priority}` : ''}${item.automatable ? ' _(automatable, not automated)_' : ''}`
    const shown = coverage.manual.slice(0, MANUAL_INLINE)
    const rest = coverage.manual.slice(MANUAL_INLINE)
    lines.push(...shown.map(line), '')
    if (rest.length > 0) {
      lines.push(
        `<details><summary>${rest.length} more manual case(s)</summary>`,
        '',
        ...rest.map(line),
        '',
        '</details>',
        '',
      )
    }
  }
  if (coverage.automated.length > 0) {
    lines.push(
      `<details><summary>${coverage.automated.length} automated case(s)</summary>`,
      '',
      ...coverage.automated.map((item) => `- \`${item.id}\` ${item.title} — ${item.area}`),
      '',
      '</details>',
      '',
    )
  }
  return capCommentLength(lines.join('\n'))
}

function readLines(path: string): string[] {
  return readFileSync(path, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

async function main(): Promise<void> {
  const changedPath = process.env['CHANGED_FILES_PATH']
  if (!changedPath) {
    throw new Error('CHANGED_FILES_PATH is required')
  }
  const changedFiles = readLines(changedPath)
  const since = process.env['HISTORY_SINCE'] ?? '180 days ago'
  const baseRef = process.env['BASE_REF'] ?? 'origin/main'
  // --no-renames: rename detection reads blob contents, which a blobless CI checkout
  // would lazily fetch (and cannot, with credentials not persisted); file lists only need trees.
  // log.showRoot=false: after a --shallow-since fetch the boundary commits are grafted roots, and
  // a root commit otherwise lists its whole tree, crediting every area with a commit and a touch.
  const log = execFileSync(
    'git',
    [
      '-c',
      'log.showRoot=false',
      'log',
      baseRef,
      `--since=${since}`,
      '--no-merges',
      '--no-renames',
      '--format=%x01%H %s',
      '--name-only',
    ],
    {
      encoding: 'utf8',
      maxBuffer: 1 << 30,
    },
  )
  const risk = riskOf(changedFiles, scoreHistory(log))
  const coverage = coverageOf(changedFiles, await readCases(process.cwd()))
  const selectionsPath = process.env['SELECTIONS_PATH']
  const selections =
    selectionsPath && existsSync(selectionsPath)
      ? (JSON.parse(readFileSync(selectionsPath, 'utf8')) as E2eSelection[])
      : undefined
  const report = renderReport({
    changedFiles,
    risk,
    coverage,
    since,
    base: baseRef.replace(/^origin\//, ''),
    selections,
  })
  const reportPath = process.env['REPORT_PATH']
  if (reportPath) {
    writeFileSync(reportPath, report)
  } else {
    console.log(report)
  }
  const scored = risk.find((area) => area.tier === 'high' || area.tier === 'medium' || area.tier === 'low')
  const post = shouldPost({ risk, coverage, selections })
  const output = process.env['GITHUB_OUTPUT']
  if (output) {
    appendFileSync(output, `post=${post}\n`)
  }
  console.error(
    `areas=${risk.length} tier=${scored?.tier ?? 'none'} automated=${coverage.automated.length} manual=${coverage.manual.length}`,
  )
}

if (import.meta.main) {
  await main()
}
