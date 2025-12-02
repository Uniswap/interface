import { createHash } from 'node:crypto'
import { type CollectOptions } from '@universe/cli/src/core/data-collector'

/**
 * Generate deterministic cache keys from CollectOptions
 * Excludes non-deterministic fields like commitDataConfig that affect output format
 */

/**
 * Create a hash from a string
 */
function hash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16)
}

/**
 * Generate cache key components from CollectOptions (excluding output formatting options)
 */
function getCacheKeyComponents(options: CollectOptions): string {
  const parts: string[] = []

  // Repository identifier
  if (options.repository?.owner && options.repository.name) {
    parts.push(`repo:${options.repository.owner}/${options.repository.name}`)
  } else if (options.repoPath) {
    parts.push(`repopath:${options.repoPath}`)
  }

  // Time-based query
  parts.push(`since:${options.since}`)

  // Branch filter
  if (options.branch) {
    parts.push(`branch:${options.branch}`)
  }

  // Author filter
  if (options.author) {
    parts.push(`author:${options.author}`)
  }

  // Team filters
  if (options.teamFilter?.length) {
    const sortedEmails = [...options.teamFilter].sort().join(',')
    parts.push(`team:${sortedEmails}`)
  }

  if (options.teamUsernames?.length) {
    const sortedUsernames = [...options.teamUsernames].sort().join(',')
    parts.push(`usernames:${sortedUsernames}`)
  }

  // Include open PRs flag
  if (options.includeOpenPrs) {
    parts.push('includeOpenPrs:true')
  }

  // Release comparison (deterministic by version range)
  if (options.releaseComparison) {
    parts.push(`release:${options.releaseComparison.from.version}-${options.releaseComparison.to.version}`)
    parts.push(`platform:${options.releaseComparison.to.platform}`)
    parts.push(`range:${options.releaseComparison.commitRange}`)
  }

  // Exclude trivial commits flag
  if (options.excludeTrivialCommits) {
    parts.push('excludeTrivial:true')
  }

  return parts.join('|')
}

/**
 * Generate cache key for commits
 */
export function getCommitsCacheKey(options: CollectOptions): string {
  const components = getCacheKeyComponents(options)
  return `commits:${hash(components)}`
}

/**
 * Generate cache key for pull requests
 */
export function getPullRequestsCacheKey(options: CollectOptions): string {
  const components = getCacheKeyComponents(options)
  return `prs:${hash(components)}`
}

/**
 * Generate cache key for stats
 */
export function getStatsCacheKey(options: CollectOptions): string {
  const components = getCacheKeyComponents(options)
  return `stats:${hash(components)}`
}

/**
 * Generate pattern to invalidate all cache entries for a repository
 */
export function getRepositoryCachePattern(repository?: { owner?: string; name?: string }): string {
  if (repository?.owner && repository.name) {
    const repoHash = hash(`repo:${repository.owner}/${repository.name}`)
    return `%:${repoHash}%`
  }
  return '%'
}
