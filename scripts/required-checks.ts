#!/usr/bin/env bun
/**
 * Resolves which ci.yml top-level jobs are required for PRs targeting a
 * branch, per `.github/ci-checks.json`. The `ci-passed` job in
 * `.github/workflows/ci.yml` consumes this to decide which of its `needs`
 * jobs actually gate the PR.
 *
 * Usage:
 *   bun scripts/required-checks.ts <target-branch>
 *
 * Prints one JSON object to stdout:
 *   {"matched": "<branch pattern>" | null, "requiredChecks": ["job-id", ...],
 *    "usedDefault": true | false}
 *
 * Matching semantics (against the keys of `branches` in ci-checks.json):
 *   1. An exact (literal) key match always wins — e.g. `releases/mobile/dev`
 *      beats `releases/mobile/**`.
 *   2. Otherwise glob patterns are tried: `*` matches within one path segment,
 *      `**` matches across segments, `?` matches a single character. The
 *      matching pattern with the longest literal prefix (most specific) wins;
 *      ties break in file order.
 *   3. No match, and the config sets `defaultTarget` → that entry's rule, with
 *      `matched` naming the entry it resolved to and `usedDefault: true`. This
 *      is how stacked-PR parent branches inherit the trunk rule instead of
 *      being gated more harshly than trunk PRs.
 *   4. No match and no `defaultTarget` → `matched: null` (callers fall back to
 *      requiring everything).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const CHECKS_FILE = join(REPO_ROOT, '.github', 'ci-checks.json')

interface BranchRule {
  requiredChecks: string[]
}

export interface CiChecksConfig {
  branches: Record<string, BranchRule>
  /** Entry an unmatched target inherits. Absent → unmatched targets stay fail-closed. */
  defaultTarget?: string
}

export interface MatchResult {
  matched: string | null
  requiredChecks: string[]
  /** True when `matched` came from `defaultTarget` rather than from the target itself. */
  usedDefault: boolean
}

/** Converts a ci-checks.json branch pattern to an anchored RegExp. */
export function globToRegExp(pattern: string): RegExp {
  let regex = ''
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i]
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        regex += '.*'
        i += 1
      } else {
        regex += '[^/]*'
      }
    } else if (char === '?') {
      regex += '[^/]'
    } else {
      regex += char.replace(/[.+^${}()|[\]\\]/g, '\\$&')
    }
  }
  return new RegExp(`^${regex}$`)
}

/** Length of the leading literal (wildcard-free) part of a pattern. */
function literalPrefixLength(pattern: string): number {
  const firstWildcard = pattern.search(/[*?]/)
  return firstWildcard === -1 ? pattern.length : firstWildcard
}

export function matchBranch(branch: string, branches: Record<string, BranchRule>, defaultTarget?: string): MatchResult {
  // Validated on every call, not just the fallback path, so a typo surfaces on
  // the first PR rather than only once some stacked branch happens to miss.
  if (defaultTarget !== undefined && !Object.hasOwn(branches, defaultTarget)) {
    throw new Error(
      `ci-checks.json: defaultTarget '${defaultTarget}' is not a key of 'branches' (have: ${Object.keys(branches).join(', ')})`,
    )
  }
  if (Object.hasOwn(branches, branch)) {
    return { matched: branch, requiredChecks: branches[branch].requiredChecks, usedDefault: false }
  }
  let best: string | null = null
  for (const pattern of Object.keys(branches)) {
    if (!/[*?]/.test(pattern)) {
      continue
    }
    if (!globToRegExp(pattern).test(branch)) {
      continue
    }
    if (best === null || literalPrefixLength(pattern) > literalPrefixLength(best)) {
      best = pattern
    }
  }
  if (best !== null) {
    return { matched: best, requiredChecks: branches[best].requiredChecks, usedDefault: false }
  }
  if (defaultTarget !== undefined) {
    return { matched: defaultTarget, requiredChecks: branches[defaultTarget].requiredChecks, usedDefault: true }
  }
  return { matched: null, requiredChecks: [], usedDefault: false }
}

export function loadConfig(file: string = CHECKS_FILE): CiChecksConfig {
  return JSON.parse(readFileSync(file, 'utf8')) as CiChecksConfig
}

if (import.meta.main) {
  const branch = process.argv[2]
  if (!branch) {
    console.error('Usage: bun scripts/required-checks.ts <target-branch>')
    process.exit(2)
  }
  const config = loadConfig()
  console.log(JSON.stringify(matchBranch(branch, config.branches, config.defaultTarget)))
}
