#!/usr/bin/env bun
/**
 * Vercel preview alias name generator.
 *
 * Turns a git branch name into a deterministic `*.vercel.app` alias for the
 * web preview deployment, e.g. `feat/Foo_Bar` -> `web-feat-foo-bar-uniswap.vercel.app`.
 * The alias always ends in `-uniswap.vercel.app`.
 *
 * This is the single source of truth shared by the deploy workflow (which
 * `vercel alias set`s the name) and the cleanup workflow (which `vercel alias
 * rm`s it on branch deletion). Both must derive the identical name or cleanup
 * would remove the wrong alias.
 *
 * Usage:
 *   bun scripts/vercel-preview-alias.ts <branch>
 *   GITHUB_HEAD_REF=my-branch bun scripts/vercel-preview-alias.ts
 *
 * @see https://vercel.com/docs/cli/alias
 */

import { createHash } from 'node:crypto'

const PREFIX = 'web-'
// Always appended so every preview alias ends in `-uniswap.vercel.app`.
const SUFFIX = '-uniswap'
// Max length of a single DNS label (the part before `.vercel.app`).
const MAX_LABEL = 63
// Short hash appended only when truncating, to avoid collisions between
// long branches that share the same truncated prefix.
const HASH_LEN = 6

function getBranch(): string {
  const branch = process.argv[2] || process.env.GITHUB_HEAD_REF || process.env.VERCEL_GIT_COMMIT_REF
  if (!branch) {
    throw new Error('No branch provided (pass as arg or set GITHUB_HEAD_REF)')
  }
  return branch
}

function aliasForBranch(branch: string): string {
  const sanitized = branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  let label = `${PREFIX}${sanitized}${SUFFIX}`
  if (label.length > MAX_LABEL) {
    const hash = createHash('sha256').update(branch).digest('hex').slice(0, HASH_LEN)
    // Reserve room for the prefix, hash + its joining dash, and the suffix.
    const budget = MAX_LABEL - PREFIX.length - SUFFIX.length - HASH_LEN - 1
    label = `${PREFIX}${sanitized.slice(0, budget).replace(/-+$/, '')}-${hash}${SUFFIX}`
  }

  return `${label}.vercel.app`
}

if (import.meta.main) {
  process.stdout.write(aliasForBranch(getBranch()))
}

export { aliasForBranch, getBranch }
