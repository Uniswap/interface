/**
 * Run with `bun test scripts/required-checks.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { globToRegExp, loadConfig, matchBranch } from './required-checks'

/**
 * Synthetic config, deliberately not a copy of `.github/ci-checks.json`: the
 * resolver's behaviour is what's under test, so editing the repo's real check
 * lists must not require editing this file. Covers every shape the resolver
 * distinguishes — a default target, nested globs whose literal prefixes decide
 * the tiebreak, an exact key shadowing a glob, and an entry that legitimately
 * requires nothing.
 */
const FIXTURE = {
  trunk: { requiredChecks: ['build', 'unit'] },
  'releases/**': { requiredChecks: ['build'] },
  'releases/mobile/**': { requiredChecks: ['build', 'device'] },
  'releases/mobile/dev': { requiredChecks: ['device'] },
  'mirror/readonly': { requiredChecks: [] },
}

const DEFAULT_TARGET = 'trunk'

const CI_YML = readFileSync(join(import.meta.dir, '..', '.github', 'workflows', 'ci.yml'), 'utf8')

/** The `ci-passed` job's `needs` list, read from the real workflow. */
function parseCiPassedNeeds(ci: string): string[] {
  const job = ci.slice(ci.indexOf('\n  ci-passed:'))
  const needs = /^ {4}needs: \[([^\]]+)\]/m.exec(job)
  if (!needs) {
    // Rewritten as a block sequence, renamed, or reordered — fail loudly rather
    // than silently testing an empty list.
    throw new Error("could not parse ci-passed's `needs` list from ci.yml")
  }
  return needs[1].split(',').map((id) => id.trim())
}

/**
 * The body of one top-level `jobs:` entry, bounded by the next line at exactly
 * two-space indent (the following job, or its leading comment) rather than by a
 * named sibling — reordering jobs must not make an assertion about this job fail
 * for a reason that points somewhere else.
 */
function sliceTopLevelJob(ci: string, jobId: string): string {
  const header = `  ${jobId}:`
  const start = ci.indexOf(`\n${header}`)
  if (start === -1) {
    throw new Error(`could not find top-level job '${jobId}' in ci.yml`)
  }
  // Step past the header line before looking for the next two-space-indented
  // line; everything inside a job body is indented deeper than that.
  const afterHeader = start + 1 + header.length
  const end = ci.slice(afterHeader).search(/\n {2}\S/)
  return end === -1 ? ci.slice(start) : ci.slice(start, afterHeader + end)
}

describe('globToRegExp', () => {
  test('** spans path segments', () => {
    expect(globToRegExp('releases/mobile/**').test('releases/mobile/1.50')).toBe(true)
    expect(globToRegExp('releases/mobile/**').test('releases/mobile/hotfix/1.50')).toBe(true)
    expect(globToRegExp('releases/mobile/**').test('releases/extension/1.50')).toBe(false)
  })

  test('* stays within one path segment', () => {
    expect(globToRegExp('releases/*').test('releases/mobile')).toBe(true)
    expect(globToRegExp('releases/*').test('releases/mobile/1.50')).toBe(false)
  })

  test('literal patterns match only themselves (dots are not wildcards)', () => {
    expect(globToRegExp('main').test('main')).toBe(true)
    expect(globToRegExp('main').test('domain')).toBe(false)
    expect(globToRegExp('v1.2').test('v1x2')).toBe(false)
  })
})

describe('matchBranch', () => {
  test('exact key match wins over a glob that also matches', () => {
    expect(matchBranch('releases/mobile/dev', FIXTURE)).toEqual({
      matched: 'releases/mobile/dev',
      requiredChecks: FIXTURE['releases/mobile/dev'].requiredChecks,
      usedDefault: false,
    })
  })

  test('exact match on a literal key', () => {
    expect(matchBranch('trunk', FIXTURE)).toEqual({
      matched: 'trunk',
      requiredChecks: FIXTURE.trunk.requiredChecks,
      usedDefault: false,
    })
  })

  test('glob match when no exact key exists', () => {
    expect(matchBranch('releases/mobile/1.50', FIXTURE)).toEqual({
      matched: 'releases/mobile/**',
      requiredChecks: FIXTURE['releases/mobile/**'].requiredChecks,
      usedDefault: false,
    })
  })

  test('most specific glob (longest literal prefix) wins among overlapping globs', () => {
    expect(matchBranch('releases/mobile/1.50', FIXTURE).matched).toBe('releases/mobile/**')
    expect(matchBranch('releases/extension/1.50', FIXTURE).matched).toBe('releases/**')
  })

  test('an entry with an empty requiredChecks is a real match, not a miss', () => {
    const result = matchBranch('mirror/readonly', FIXTURE, DEFAULT_TARGET)
    expect(result.matched).toBe('mirror/readonly')
    expect(result.requiredChecks).toEqual([])
    // The distinguishing signal from the no-match case below is `matched`, not
    // the empty list — a caller that only reads requiredChecks cannot tell them
    // apart, and ci.yml branches on `matched` for exactly this reason.
    expect(result.usedDefault).toBe(false)
  })

  test('without a defaultTarget, no match returns null (callers fall back to requiring everything)', () => {
    expect(matchBranch('ci/orchestrator-00-base', FIXTURE)).toEqual({
      matched: null,
      requiredChecks: [],
      usedDefault: false,
    })
    expect(matchBranch('feature/my-change', FIXTURE)).toEqual({ matched: null, requiredChecks: [], usedDefault: false })
  })

  test('with a defaultTarget, no match resolves to the same rule as that entry and flags usedDefault', () => {
    const unmatched = matchBranch('feature/my-change', FIXTURE, DEFAULT_TARGET)
    const target = matchBranch(DEFAULT_TARGET, FIXTURE, DEFAULT_TARGET)
    expect(unmatched.matched).toBe(DEFAULT_TARGET)
    expect(unmatched.requiredChecks).toEqual(target.requiredChecks)
    expect(unmatched.usedDefault).toBe(true)
    // The target itself is matched directly, so it is never flagged.
    expect(target.usedDefault).toBe(false)
  })

  test('a defaultTarget never overrides a real match', () => {
    for (const branch of ['trunk', 'releases/mobile/dev', 'releases/mobile/1.50', 'mirror/readonly']) {
      const withDefault = matchBranch(branch, FIXTURE, DEFAULT_TARGET)
      expect(withDefault.usedDefault).toBe(false)
      // Identical to resolving with no default configured at all.
      expect(withDefault).toEqual(matchBranch(branch, FIXTURE))
    }
  })

  test('a defaultTarget naming a missing entry throws instead of silently requiring nothing', () => {
    expect(() => matchBranch('feature/my-change', FIXTURE, 'no-such-entry')).toThrow(
      /defaultTarget 'no-such-entry' is not a key of 'branches'/,
    )
    // Thrown even on the matching path, so a typo surfaces on the first PR.
    expect(() => matchBranch('trunk', FIXTURE, 'no-such-entry')).toThrow(/defaultTarget 'no-such-entry'/)
  })
})

// Behavioural coverage lives against FIXTURE above. These tests only assert the
// things that genuinely depend on the real file, and do so without restating
// its check lists — so changing a branch's required jobs needs no edit here.
describe('repo ci-checks.json', () => {
  const { branches, defaultTarget } = loadConfig()
  const resolve = (branch: string): ReturnType<typeof matchBranch> => matchBranch(branch, branches, defaultTarget)

  test('parses, and every requiredChecks entry looks like a ci.yml job id', () => {
    expect(Object.keys(branches).length).toBeGreaterThan(0)
    for (const rule of Object.values(branches)) {
      expect(Array.isArray(rule.requiredChecks)).toBe(true)
      for (const check of rule.requiredChecks) {
        // Job ids are lowercase kebab-case; legacy contexts had spaces/uppercase.
        expect(check).toMatch(/^[a-z0-9-]+$/)
      }
    }
  })

  // `defaultTarget` is optional on purpose: ci-checks.json's `_readme` documents
  // deleting the key as the one-line rollback to fail-closed gating, so its
  // absence must not red CI. Only a key pointing at nothing may. The
  // present-and-valid behaviour is covered exhaustively against FIXTURE above.
  test('a configured defaultTarget names an existing entry', () => {
    if (defaultTarget !== undefined) {
      expect(Object.keys(branches)).toContain(defaultTarget)
    }
  })

  const needs = parseCiPassedNeeds(CI_YML)
  const unmatchedBases = [
    '07-14-fix_web_add_sorting_to_liquidity_positions_table', // stacked-PR parent
    'some-ad-hoc-feature-branch',
  ]

  test('unmatched bases are gated exactly as a PR against main, not more harshly', () => {
    const main = resolve('main')
    expect(main.usedDefault).toBe(false)
    for (const base of unmatchedBases) {
      const result = resolve(base)
      if (defaultTarget === undefined) {
        // Post-rollback shape: nothing matched and no default, so ci.yml falls
        // back to requiring every orchestrated job.
        expect(result).toEqual({ matched: null, requiredChecks: [], usedDefault: false })
        continue
      }
      expect(result.requiredChecks).toEqual(main.requiredChecks)
      expect(result.matched).toBe(main.matched)
      expect(result.usedDefault).toBe(true)
    }
  })

  test('every requiredChecks entry is a job ci-passed actually needs', () => {
    // Nothing else catches a typo here: ci-passed's jq reports
    // "<job>: missing from needs" and reds every PR against that base.
    const missing = Object.entries(branches).flatMap(([pattern, rule]) =>
      rule.requiredChecks.filter((check) => !needs.includes(check)).map((check) => `${pattern} → ${check}`),
    )
    expect(missing).toEqual([])
  })

  test('the only ci-passed needs outside main’s requiredChecks are the known ungated ones', () => {
    // `affected` is the gate job — not gated here because ci-passed asserts it
    // directly, independently of the base ref. The other three are deliberately
    // advisory (per repo owner): they are in `needs` but gate no base, and
    // before `defaultTarget` they incidentally gated unmatched bases and
    // nothing else. Anything new in `needs` must be gated or added here, so a
    // job cannot slip in without someone making that call.
    expect(needs.filter((job) => !resolve('main').requiredChecks.includes(job)).sort()).toEqual(
      ['affected', 'dev-portal', 'dev-portal-e2e', 'sessions'].sort(),
    )
  })

  test('the fallback requires no job that main does not also require', () => {
    const ungatedByMain = needs.filter((job) => !resolve('main').requiredChecks.includes(job))
    const leaked = unmatchedBases.flatMap((base) =>
      resolve(base)
        .requiredChecks.filter((job) => ungatedByMain.includes(job))
        .map((job) => `${base} → ${job}`),
    )
    expect(leaked).toEqual([])
  })
})

describe('ci.yml ci-passed gate assertion', () => {
  const ci = CI_YML

  // The `affected` failure mode presents as a green check, so a refactor that
  // drops this assertion would be invisible in review and in CI. Guard it.
  test('ci-passed asserts the affected gate outside the required-checks list', () => {
    expect(ci).toContain('AFFECTED_RESULT=$(echo "$NEEDS_JSON" | jq --raw-output \'.affected.result')
    expect(ci).toContain('if [ "$AFFECTED_RESULT" != "success" ]; then')
  })

  test('the affected job has no job-level if:, which is what makes the strict success check safe', () => {
    const affectedJob = sliceTopLevelJob(ci, 'affected')
    expect(affectedJob).toContain('name: Changed projects')
    // A job-level `if:` (4-space indent) would make `skipped` a legitimate
    // result and turn the strict equality above into a false failure.
    expect(affectedJob).not.toMatch(/^ {4}if:/m)
    expect(affectedJob).not.toMatch(/^ {4}needs:/m)
  })
})

describe('affected-outputs wiring', () => {
  // compute-affected.sh's PATH_FILTERS rows reach their jobs through three
  // hand-written name pairs: the row name in ci.yml's `affected` outputs, the
  // input ci.yml passes to monorepo_script_tests.yml, and the input that
  // workflow's job gates on. A mismatch anywhere fails silently — the gate
  // expression resolves to an empty string, the job skips, and CI is green
  // having run nothing.
  //
  // Review does not catch it either: every PR that edits this wiring touches
  // .github/**, which forces run-all, so the PATH_FILTERS loop never executes
  // and the PR's own CI runs every job regardless of its rows. Semantic
  // mistakes — a pattern on the wrong row — are still invisible here; those
  // need a probe PR touching only a non-.github path.
  const SCRIPT = readFileSync(join(import.meta.dir, 'compute-affected.sh'), 'utf8')
  const SCRIPT_TESTS = readFileSync(
    join(import.meta.dir, '..', '.github', 'workflows', 'monorepo_script_tests.yml'),
    'utf8',
  )

  const rows = [...SCRIPT.matchAll(/^ {2}"([A-Z_0-9]+)\|/gm)].map((match) => match[1]!)
  const declaredInputs = [...SCRIPT_TESTS.matchAll(/^ {6}([a-z0-9-]+):$/gm)].map((match) => match[1]!)

  test('both files parse, so a shape change fails loudly instead of testing nothing', () => {
    expect(rows.length).toBeGreaterThan(0)
    expect(declaredInputs).toContain('run-all')
  })

  test('every PATH_FILTERS row is exposed as an output of the affected job', () => {
    const affectedJob = sliceTopLevelJob(CI_YML, 'affected')
    expect(rows.filter((row) => !affectedJob.includes(`steps.check.outputs.${row}`))).toEqual([])
  })

  test('every output the affected job reads back is a row the script emits', () => {
    // Catches a rename that leaves ci.yml pointing at a row that no longer
    // exists: the output resolves empty and every consumer silently skips.
    const read = [...CI_YML.matchAll(/steps\.check\.outputs\.([A-Z_0-9]+)/g)]
      .map((match) => match[1]!)
      .filter((name) => name !== 'RUN_ALL' && name !== 'PROJECTS')
    expect([...new Set(read)].filter((name) => !rows.includes(name))).toEqual([])
  })

  test('every input ci.yml passes to the script-tests workflow is declared there', () => {
    const withBlock = /^ {4}with:\n((?: {6}.*\n)+)/m.exec(sliceTopLevelJob(CI_YML, 'script-tests'))
    if (!withBlock) {
      throw new Error("could not parse the script-tests caller's `with:` block from ci.yml")
    }
    const passed = [...withBlock[1]!.matchAll(/^ {6}([a-z0-9-]+):/gm)].map((match) => match[1]!)
    expect(passed.length).toBeGreaterThan(0)
    expect(passed.filter((key) => !declaredInputs.includes(key))).toEqual([])
  })

  test('every input a script-tests job gates on is declared', () => {
    const referenced = [...SCRIPT_TESTS.matchAll(/inputs\.([a-z0-9-]+)/g)].map((match) => match[1]!)
    expect([...new Set(referenced)].filter((name) => !declaredInputs.includes(name))).toEqual([])
  })

  test('every script-tests job gates on run-all', () => {
    // Rows are unset on the run-all short-circuit, so a job that omits it
    // silently skips on merge-queue branches and .github/** changes.
    const gates = [...SCRIPT_TESTS.matchAll(/^ {4}if: >-\n((?: {6}.*\n)+)/gm)].map((match) => match[1]!)
    expect(gates.length).toBeGreaterThan(0)
    for (const gate of gates) {
      expect(gate).toContain('inputs.run-all')
    }
  })
})
