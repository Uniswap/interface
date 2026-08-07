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
 *   {"matched": "<branch pattern>" | null, "requiredChecks": ["job-id", ...]}
 *
 * Matching semantics (against the keys of `branches` in ci-checks.json):
 *   1. An exact (literal) key match always wins — e.g. `releases/mobile/dev`
 *      beats `releases/mobile/**`.
 *   2. Otherwise glob patterns are tried: `*` matches within one path segment,
 *      `**` matches across segments, `?` matches a single character. The
 *      matching pattern with the longest literal prefix (most specific) wins;
 *      ties break in file order.
 *   3. No match → `matched: null` (callers fall back to requiring everything).
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')
const CHECKS_FILE = join(REPO_ROOT, '.github', 'ci-checks.json')

interface BranchRule {
  requiredChecks: string[]
}

export interface MatchResult {
  matched: string | null
  requiredChecks: string[]
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

export function matchBranch(branch: string, branches: Record<string, BranchRule>): MatchResult {
  if (Object.hasOwn(branches, branch)) {
    return { matched: branch, requiredChecks: branches[branch].requiredChecks }
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
  if (best === null) {
    return { matched: null, requiredChecks: [] }
  }
  return { matched: best, requiredChecks: branches[best].requiredChecks }
}

export function loadBranches(file: string = CHECKS_FILE): Record<string, BranchRule> {
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as { branches: Record<string, BranchRule> }
  return parsed.branches
}

if (import.meta.main) {
  const branch = process.argv[2]
  if (!branch) {
    console.error('Usage: bun scripts/required-checks.ts <target-branch>')
    process.exit(2)
  }
  console.log(JSON.stringify(matchBranch(branch, loadBranches())))
}
