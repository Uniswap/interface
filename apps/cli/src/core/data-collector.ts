/* eslint-disable max-lines */
/* eslint-disable max-depth */
/* eslint-disable complexity */
/* eslint-disable max-params */

/** biome-ignore-all lint/suspicious/noConsole: CLI tool requires console output */

import { getCommitsCacheKey, getPullRequestsCacheKey, getStatsCacheKey } from '@universe/cli/src/lib/cache-keys'
import { type CacheProvider } from '@universe/cli/src/lib/cache-provider'
import type { Logger } from '@universe/cli/src/lib/logger'
import { cleanPRBody } from '@universe/cli/src/lib/pr-body-cleaner'
import { type ReleaseComparison } from '@universe/cli/src/lib/release-scanner'
import { isTrivialFile } from '@universe/cli/src/lib/trivial-files'
import { $ } from 'bun'

// ============================================================================
// Data Collection Types
// ============================================================================

export interface CommitDataConfig {
  includeFilePaths?: boolean // Include file paths in commit data (default: true)
  includeDiffs?: boolean // Include actual diff content (default: false)
  maxDiffSize?: number // Max lines changed per file to include diff (default: 100)
  maxDiffFiles?: number // Max number of files to include diffs for (default: 20)
  diffFilePattern?: string // Regex pattern for files to include diffs (default: \.(ts|tsx|js|jsx)$)
  excludeTestFiles?: boolean // Exclude test files from diffs (default: true)
  tokenBudget?: number // Approximate token budget for all commit data (default: 50000)
  prBodyLimit?: number // Max characters for PR body (default: 2000)
  cleanPRBodies?: boolean // Enable PR body cleaning (default: true)
}

export interface CollectOptions {
  since: string
  branch?: string
  author?: string
  repoPath?: string
  includeOpenPrs?: boolean
  teamFilter?: string[]
  teamUsernames?: string[]
  repository?: { owner?: string; name?: string }
  releaseComparison?: ReleaseComparison
  excludeTrivialCommits?: boolean // Filter out commits with only lockfile/snapshot changes
  commitDataConfig?: CommitDataConfig // Configuration for commit data collection
}

export interface RepositoryData {
  commits: Commit[]
  pullRequests: PullRequest[]
  stats: StatsOutput
  metadata: {
    repository: string
    period: string
    collectedAt: Date
    commitCount: number
    prCount: number
    releaseInfo?: {
      from: string
      to: string
      platform: 'mobile' | 'extension'
    }
    filtering?: {
      totalCommitsFound: number
      trivialCommitsFiltered: number
      filesProcessed: number
      trivialFilesSkipped: number
    }
  }
}

export interface Commit {
  sha: string
  author: { name: string; email: string }
  timestamp: Date
  message: string
  stats: { filesChanged: number; insertions: number; deletions: number }
  files?: {
    path: string
    status: 'added' | 'modified' | 'deleted' | 'renamed'
    additions: number
    deletions: number
    diff?: string // Optional: actual diff content
    diffTruncated?: boolean // Optional: indicates if diff was truncated
  }[]
}

export interface PullRequest {
  number: number
  title: string
  body: string
  author: string
  state: 'open' | 'closed'
  mergedAt: string
  mergeCommitSha?: string
}

export interface StatsOutput {
  totalCommits: number
  totalAuthors: number
  filesChanged: number
  linesAdded: number
  linesDeleted: number
}

// ============================================================================
// Helper Functions for Git Output Parsing
// ============================================================================

/**
 * Validates and parses a git log line in the format: sha|email|name|timestamp|message
 * Returns undefined if the line is malformed
 */
function parseGitLogLine(
  line: string,
): { sha: string; email: string; name: string; timestamp: string; message: string } | undefined {
  const parts = line.split('|')
  if (parts.length < 5) {
    return undefined
  }

  const sha = parts[0]?.trim()
  const email = parts[1]?.trim()
  const name = parts[2]?.trim()
  const timestamp = parts[3]?.trim()
  const messageParts = parts.slice(4)
  const message = messageParts.join('|')

  if (!sha || !email || !name || !timestamp) {
    return undefined
  }

  return { sha, email, name, timestamp, message }
}

/**
 * Validates and parses a git numstat line in the format: additions\tdeletions\tfilepath
 * Returns undefined if the line is malformed
 */
function parseNumstatLine(line: string): { additions: string; deletions: string; filepath: string } | undefined {
  const parts = line.split('\t')
  if (parts.length < 3) {
    return undefined
  }

  const additions = parts[0]?.trim()
  const deletions = parts[1]?.trim()
  const filepath = parts.slice(2).join('\t') // Handle filepaths with tabs

  if (additions === undefined || deletions === undefined || !filepath) {
    return undefined
  }

  return { additions, deletions, filepath }
}

// ============================================================================
// Data Collector
// ============================================================================

export class DataCollector {
  private filteringStats = {
    totalCommitsFound: 0,
    trivialCommitsFiltered: 0,
    filesProcessed: 0,
    trivialFilesSkipped: 0,
  }
  private tokenUsage = 0
  private diffsCollected = 0

  constructor(
    private repoPath: string = process.cwd(),
    private cacheProvider?: CacheProvider,
    private bypassCache: boolean = false,
    private logger?: Logger,
  ) {}

  /**
   * Estimate tokens for a given text (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Check if a file should have its diff included based on config
   */
  private shouldIncludeDiff(filePath: string, additions: number, deletions: number, config: CommitDataConfig): boolean {
    // Check if diffs are enabled
    if (!config.includeDiffs) {
      return false
    }

    // Check if we've hit the diff file limit
    if (this.diffsCollected >= (config.maxDiffFiles || 20)) {
      return false
    }

    // Check if we're within token budget
    const budget = config.tokenBudget || 50000 // Can be higher with compact format
    if (this.tokenUsage >= budget) {
      this.logger?.info(`Token budget reached (${this.tokenUsage}/${budget}), skipping remaining diffs`)
      return false
    }

    // Check file size limit
    const totalChanges = additions + deletions
    if (totalChanges > (config.maxDiffSize || 100)) {
      return false
    }

    // Check if it's a test file and we're excluding them
    if (config.excludeTestFiles !== false) {
      const testPatterns = [
        /\.test\.(ts|tsx|js|jsx)$/,
        /\.spec\.(ts|tsx|js|jsx)$/,
        /__tests__\//,
        /test\//i,
        /tests\//i,
        /e2e\//,
      ]
      if (testPatterns.some((p) => p.test(filePath))) {
        return false
      }
    }

    // Check file pattern if provided
    if (config.diffFilePattern) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- User-provided pattern from config, used for file filtering
      const pattern = new RegExp(config.diffFilePattern)
      if (!pattern.test(filePath)) {
        return false
      }
    } else {
      // Default pattern: TypeScript and JavaScript files
      const defaultPattern = /\.(ts|tsx|js|jsx)$/
      if (!defaultPattern.test(filePath)) {
        return false
      }
    }

    return true
  }

  /**
   * Collect diff for a specific file in a commit
   */
  private async collectFileDiff(sha: string, filePath: string, config: CommitDataConfig): Promise<string | undefined> {
    try {
      // Get just the unified diff for this file (more compact than full git show)
      const diff = await $`git -C ${this.repoPath} diff ${sha}^..${sha} -- ${filePath}`.text()

      if (!diff || diff.trim().length === 0) {
        // File might be new, try different approach
        const showDiff = await $`git -C ${this.repoPath} show ${sha} --format= -- ${filePath}`.text()
        if (!showDiff) {
          return undefined
        }

        // For new files, just get the content preview
        const lines = showDiff.split('\n')
        const maxSize = Math.min(config.maxDiffSize || 100, 30) // Smaller preview for new files
        if (lines.length > maxSize) {
          return lines.slice(0, maxSize).join('\n') + `\n... [+${lines.length - maxSize} more lines]`
        }
        return showDiff
      }

      // Extract just the hunks (skip file headers for compactness)
      const lines = diff.split('\n')
      const hunkLines = lines.filter(
        (line: string) => line.startsWith('@@') || line.startsWith('+') || line.startsWith('-') || line.startsWith(' '),
      )

      // Check size and truncate if needed
      const maxSize = config.maxDiffSize || 100
      if (hunkLines.length > maxSize) {
        const truncated = hunkLines.slice(0, maxSize)
        truncated.push(`... [${hunkLines.length - maxSize} more lines]`)
        return truncated.join('\n')
      }

      return hunkLines.join('\n')
    } catch (_error) {
      // Might fail for new files or first commit, that's ok
      return undefined
    }
  }

  /**
   * Restore Date objects from cached JSON (JSON.parse converts dates to strings)
   */
  private restoreDatesFromCache<T extends { timestamp?: Date }>(items: T[]): T[] {
    return items.map((item) => {
      if (item.timestamp && typeof item.timestamp === 'string') {
        return { ...item, timestamp: new Date(item.timestamp) }
      }
      return item
    })
  }

  async collect(options: CollectOptions): Promise<RepositoryData> {
    this.logger?.info('Collecting repository data...')

    // Reset filtering stats
    this.filteringStats = {
      totalCommitsFound: 0,
      trivialCommitsFiltered: 0,
      filesProcessed: 0,
      trivialFilesSkipped: 0,
    }
    this.tokenUsage = 0
    this.diffsCollected = 0

    // Try to get commits from cache
    let allCommits: Commit[] | null = null
    if (!this.bypassCache && this.cacheProvider) {
      const cacheKey = getCommitsCacheKey(options)
      const cached = await this.cacheProvider.get<Commit[]>(cacheKey)
      if (cached) {
        allCommits = this.restoreDatesFromCache(cached)
        this.logger?.info(`Cache hit: Found ${allCommits.length} commits in cache`)
      }
    }

    // Fetch commits if not cached
    if (!allCommits) {
      if (options.releaseComparison) {
        this.logger?.info(`Fetching commits for release: ${options.releaseComparison.commitRange}`)
        allCommits = await this.getReleaseCommits(options.releaseComparison, options)
      } else {
        this.logger?.info('Fetching commits from git log...')
        allCommits = await this.getCommits(options)
      }

      // Store in cache (release comparisons are deterministic, cache indefinitely)
      if (this.cacheProvider) {
        const cacheKey = getCommitsCacheKey(options)
        const ttl = options.releaseComparison ? undefined : 3600 // 1 hour for time-based queries
        await this.cacheProvider.set(cacheKey, allCommits, ttl)
        this.logger?.info(`Cached ${allCommits.length} commits`)
      }
    }

    // Filter by team if specified
    const commits = options.teamFilter?.length ? this.filterCommitsByTeam(allCommits, options.teamFilter) : allCommits

    this.logger?.info(`Found ${commits.length} commits (${allCommits.length} total)`)

    // Try to get PRs from cache
    let pullRequests: PullRequest[] | null = null
    if (!this.bypassCache && this.cacheProvider) {
      const cacheKey = getPullRequestsCacheKey(options)
      const cached = await this.cacheProvider.get<PullRequest[]>(cacheKey)
      if (cached) {
        pullRequests = cached
        this.logger?.info(`Cache hit: Found ${pullRequests.length} PRs in cache`)
      }
    }

    // Fetch PRs if not cached
    if (!pullRequests) {
      this.logger?.info('Fetching pull requests from GitHub...')
      pullRequests = await this.getPullRequests(options)

      // Store in cache
      if (this.cacheProvider) {
        const cacheKey = getPullRequestsCacheKey(options)
        const ttl = options.releaseComparison ? undefined : 3600 // 1 hour for time-based queries
        await this.cacheProvider.set(cacheKey, pullRequests, ttl)
        this.logger?.info(`Cached ${pullRequests.length} PRs`)
      }
    }

    this.logger?.info(`Found ${pullRequests.length} pull requests`)

    // Try to get stats from cache
    let stats: StatsOutput | null = null
    if (!this.bypassCache && this.cacheProvider) {
      const cacheKey = getStatsCacheKey(options)
      const cached = await this.cacheProvider.get<StatsOutput>(cacheKey)
      if (cached) {
        stats = cached
        this.logger?.info('Cache hit: Found stats in cache')
      }
    }

    // Calculate stats if not cached
    if (!stats) {
      stats = await this.getStats(options)

      // Store in cache
      if (this.cacheProvider) {
        const cacheKey = getStatsCacheKey(options)
        const ttl = options.releaseComparison ? undefined : 3600 // 1 hour for time-based queries
        await this.cacheProvider.set(cacheKey, stats, ttl)
        this.logger?.info('Cached stats')
      }
    }

    // Build metadata
    const repoName =
      options.repository?.owner && options.repository.name
        ? `${options.repository.owner}/${options.repository.name}`
        : this.repoPath

    const metadata: RepositoryData['metadata'] = {
      repository: repoName,
      period: options.since,
      collectedAt: new Date(),
      commitCount: commits.length,
      prCount: pullRequests.length,
    }

    // Add release info if available
    if (options.releaseComparison) {
      metadata.releaseInfo = {
        from: options.releaseComparison.from.version,
        to: options.releaseComparison.to.version,
        platform: options.releaseComparison.to.platform,
      }
    }

    // Add filtering stats if we have them
    if (this.filteringStats.totalCommitsFound > 0) {
      metadata.filtering = {
        totalCommitsFound: this.filteringStats.totalCommitsFound,
        trivialCommitsFiltered: this.filteringStats.trivialCommitsFiltered,
        filesProcessed: this.filteringStats.filesProcessed,
        trivialFilesSkipped: this.filteringStats.trivialFilesSkipped,
      }
    }

    return {
      commits,
      pullRequests,
      stats,
      metadata,
    }
  }

  private async getCommits(options: CollectOptions): Promise<Commit[]> {
    const format = '%H|%ae|%an|%at|%s'
    const result = await $`git -C ${this.repoPath} log --since="${options.since}" --format="${format}" --numstat`.text()

    const commits: Commit[] = []
    const lines = result.split('\n')
    let skippedTrivialCommits = 0
    let totalCommitsProcessed = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line || !line.includes('|')) {
        continue
      }

      // Parse the commit line
      const parsed = parseGitLogLine(line)
      if (!parsed) {
        this.logger?.warn(`Skipping malformed git log line: ${line}`)
        continue
      }

      totalCommitsProcessed++
      const { sha, email, name, timestamp, message } = parsed
      const stats = { filesChanged: 0, insertions: 0, deletions: 0 }
      const fileChanges: Commit['files'] = []

      // Parse numstat
      i++
      while (i < lines.length) {
        const currentLine = lines[i]
        if (!currentLine || currentLine.includes('|')) {
          break
        }
        const statLine = currentLine.trim()
        if (statLine) {
          const numstat = parseNumstatLine(statLine)
          if (numstat) {
            const { additions, deletions, filepath } = numstat

            // Skip trivial files when in release mode
            if (options.releaseComparison && isTrivialFile(filepath)) {
              i++
              continue
            }

            const adds = additions === '-' ? 0 : parseInt(additions, 10) || 0
            const dels = deletions === '-' ? 0 : parseInt(deletions, 10) || 0

            // Determine file status
            let status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified'
            if (adds > 0 && dels === 0) {
              status = 'added'
            } else if (adds === 0 && dels > 0) {
              status = 'deleted'
            } else if (additions === '-' || deletions === '-') {
              status = 'modified'
            }

            fileChanges.push({
              path: filepath,
              status,
              additions: adds,
              deletions: dels,
            })

            stats.insertions += adds
            stats.deletions += dels
            stats.filesChanged++
          }
        }
        i++
      }
      i-- // Back up one since the outer loop will increment

      // Skip commits that only touch trivial files (only in release mode)
      if (options.releaseComparison && stats.filesChanged === 0) {
        skippedTrivialCommits++
        continue
      }

      const commit = {
        sha,
        author: { name, email },
        timestamp: new Date(parseInt(timestamp, 10) * 1000),
        message,
        stats,
        files: fileChanges,
      }

      // Collect diffs if configured
      if (options.commitDataConfig?.includeDiffs && fileChanges.length > 0) {
        for (const file of fileChanges) {
          if (this.shouldIncludeDiff(file.path, file.additions, file.deletions, options.commitDataConfig)) {
            const diff = await this.collectFileDiff(sha, file.path, options.commitDataConfig)
            if (diff) {
              file.diff = diff
              file.diffTruncated = diff.includes('[diff truncated')
              this.diffsCollected++
              this.tokenUsage += this.estimateTokens(diff)

              // Log progress
              if (this.diffsCollected % 5 === 0) {
                this.logger?.info(`Collected ${this.diffsCollected} diffs (${this.tokenUsage} tokens used)`)
              }
            }
          }
        }
      }

      commits.push(commit)
    }

    // Store stats for reporting (if in release mode)
    if (totalCommitsProcessed > 0) {
      this.filteringStats.totalCommitsFound += totalCommitsProcessed
      this.filteringStats.trivialCommitsFiltered += skippedTrivialCommits
    }

    if (skippedTrivialCommits > 0) {
      this.logger?.info(`Filtered out ${skippedTrivialCommits} commits with only trivial file changes`)
    }

    return commits
  }

  private filterCommitsByTeam(commits: Commit[], teamFilter: string[]): Commit[] {
    return commits.filter((c) => {
      const matches = teamFilter.includes(c.author.email)
      if (!matches) {
        this.logger?.debug(`Filtering out commit ${c.sha.slice(0, 7)} by ${c.author.email}`)
      }
      return matches
    })
  }

  private async getPullRequests(options: CollectOptions): Promise<PullRequest[]> {
    if (!options.repository?.owner || !options.repository.name) {
      this.logger?.debug('No repository configured, skipping PR fetch')
      return []
    }

    const repository = `${options.repository.owner}/${options.repository.name}`

    try {
      // For release comparisons, get PR numbers from the commit range
      if (options.releaseComparison) {
        return await this.getReleasePullRequests(options, repository)
      }

      // Parse the 'since' date for time-based analysis
      const sinceDate = this.parseSinceDate(options.since)
      const sinceISO = sinceDate.toISOString().split('T')[0] ?? sinceDate.toISOString()

      // Build search query
      const authorFilter = options.teamUsernames?.length
        ? options.teamUsernames.map((author) => `author:${author}`).join(' ')
        : ''

      const query = options.includeOpenPrs
        ? `repo:${repository} is:pr created:>=${sinceISO} ${authorFilter}`
        : `repo:${repository} is:pr is:closed closed:>=${sinceISO} ${authorFilter}`

      this.logger?.debug(`GitHub Search Query: ${query}`)

      // Get PR numbers from main branch commits for filtering
      const prNumbersInMain = await this.getPRNumbersFromMainBranch(sinceISO)

      // Fetch PRs from GitHub
      const allPRs: PullRequest[] = []
      let page = 1
      const perPage = 100
      const maxPages = 10

      while (page <= maxPages) {
        const apiPath = `/search/issues?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`
        const searchResult = await $`gh api ${apiPath}`.text()
        const searchData = JSON.parse(searchResult)

        if (!searchData.items || searchData.items.length === 0) {
          break
        }

        for (const pr of searchData.items) {
          // Filter to only include PRs whose commits are in main (unless open)
          if (pr.state === 'open' || prNumbersInMain.has(pr.number)) {
            const limit = options.commitDataConfig?.prBodyLimit || 2000
            const shouldClean = options.commitDataConfig?.cleanPRBodies !== false // Default to true
            let body = pr.body ? pr.body : ''

            // Clean PR body if enabled (default: true)
            if (body && shouldClean) {
              body = cleanPRBody(body)
            }

            // Apply character limit after cleaning
            body = body.slice(0, limit)

            allPRs.push({
              number: pr.number,
              title: pr.title,
              body,
              author: pr.user?.login || 'unknown',
              state: pr.state as 'open' | 'closed',
              mergedAt: pr.closed_at,
              mergeCommitSha: pr.pull_request?.merge_commit_sha,
            })
          }
        }

        if (searchData.items.length < perPage) {
          break
        }
        page++
      }

      return allPRs
    } catch (error) {
      this.logger?.error(`GitHub PR fetch failed: ${error}`)
      return []
    }
  }

  private parseSinceDate(since: string): Date {
    const sinceDate = new Date()
    const sinceMatch = since.match(/(\d+)\s+(day|week|month|year)s?\s+ago/)

    if (sinceMatch?.[1] && sinceMatch[2]) {
      const amount = sinceMatch[1]
      const unit = sinceMatch[2]
      const num = parseInt(amount, 10)

      switch (unit) {
        case 'day':
          sinceDate.setDate(sinceDate.getDate() - num)
          break
        case 'week':
          sinceDate.setDate(sinceDate.getDate() - num * 7)
          break
        case 'month':
          sinceDate.setMonth(sinceDate.getMonth() - num)
          break
        case 'year':
          sinceDate.setFullYear(sinceDate.getFullYear() - num)
          break
      }
    }

    return sinceDate
  }

  private async getPRNumbersFromMainBranch(sinceISO: string): Promise<Set<number>> {
    const allCommitMessages = await $`git log main --since="${sinceISO}" --format="%s"`.text()
    const prNumbersInMain = new Set<number>()
    const prRegex = /#(\d+)/g

    for (const match of allCommitMessages.matchAll(prRegex)) {
      if (match[1]) {
        const prNum = parseInt(match[1], 10)
        if (prNum) {
          prNumbersInMain.add(prNum)
        }
      }
    }

    this.logger?.debug(`Found ${prNumbersInMain.size} unique PR numbers in main branch commits`)
    return prNumbersInMain
  }

  private async getReleasePullRequests(options: CollectOptions, repository: string): Promise<PullRequest[]> {
    if (!options.releaseComparison) {
      return []
    }

    const range = options.releaseComparison.commitRange
    this.logger?.info('Extracting PR information from commits...')

    // Extract PR numbers and titles from commit messages
    const commits = await $`git -C ${this.repoPath} log ${range} --format="%H|%s|%ae|%an"`.text()
    const pullRequests: PullRequest[] = []
    const seenPRs = new Set<number>()

    for (const line of commits.split('\n')) {
      if (!line) {
        continue
      }
      const parts = line.split('|')
      const sha = parts[0]
      const message = parts[1]
      const author = parts[3]

      if (!sha || !message || !author) {
        continue
      }

      // Look for PR number in commit message (e.g., "(#1234)" or "PR #1234")
      const prMatch = message.match(/#(\d+)/)
      if (prMatch?.[1]) {
        const prNumber = parseInt(prMatch[1], 10)

        // Skip if we've already seen this PR
        if (seenPRs.has(prNumber)) {
          continue
        }
        seenPRs.add(prNumber)

        // Extract PR title from commit message (usually after the PR number)
        let title = message
        // Remove PR number patterns
        title = title
          .replace(/\(#\d+\)/, '')
          .replace(/#\d+/, '')
          .trim()

        // Create a minimal PR object from commit data
        pullRequests.push({
          number: prNumber,
          title: title || `PR #${prNumber}`,
          body: '', // We don't have the body without API call
          author: author || 'unknown',
          state: 'closed', // Assume closed if in release
          mergedAt: '', // We don't have exact merge time
          mergeCommitSha: sha,
        })
      }
    }

    this.logger?.info(`Found ${pullRequests.length} PRs from commit messages`)

    // Fetch detailed PR info for all PRs using gh api with parallel batching
    if (pullRequests.length > 0) {
      this.logger?.info(`Fetching detailed info for ${pullRequests.length} PRs...`)

      const limit = options.commitDataConfig?.prBodyLimit || 2000
      const CONCURRENCY_LIMIT = 15 // Fetch 15 PRs in parallel at a time
      let fetchedCount = 0

      // Helper function to fetch a single PR
      const fetchPR = async (pr: PullRequest): Promise<void> => {
        try {
          // Use jq to output a JSON object to properly handle multi-line PR bodies
          const prResultJson =
            await $`gh api repos/${repository}/pulls/${pr.number} --jq '{title: .title, body: .body, author: .user.login, mergedAt: .merged_at}'`.text()
          const prData = JSON.parse(prResultJson)

          // Update with real data
          if (prData.title) {
            pr.title = prData.title
          }
          if (prData.body && prData.body !== 'null') {
            const shouldClean = options.commitDataConfig?.cleanPRBodies !== false // Default to true
            let body = prData.body

            // Clean PR body if enabled (default: true)
            if (shouldClean) {
              body = cleanPRBody(body)
            }

            // Apply character limit after cleaning
            pr.body = body.slice(0, limit)
          }
          if (prData.author) {
            pr.author = prData.author
          }
          if (prData.mergedAt && prData.mergedAt !== 'null') {
            pr.mergedAt = prData.mergedAt
          }
        } catch (_error) {
          // Keep the minimal data we already have
          this.logger?.warn(`Failed to fetch PR #${pr.number}, continuing with minimal data`)
        }
      }

      // Process PRs in batches for parallel fetching
      for (let i = 0; i < pullRequests.length; i += CONCURRENCY_LIMIT) {
        const batch = pullRequests.slice(i, i + CONCURRENCY_LIMIT)
        const batchNumber = Math.floor(i / CONCURRENCY_LIMIT) + 1
        const totalBatches = Math.ceil(pullRequests.length / CONCURRENCY_LIMIT)

        // Fetch all PRs in this batch in parallel
        await Promise.all(batch.map((pr) => fetchPR(pr)))

        fetchedCount += batch.length

        // Log progress after each batch
        this.logger?.info(
          `Fetched ${fetchedCount}/${pullRequests.length} PRs (batch ${batchNumber}/${totalBatches})...`,
        )

        // Add small delay between batches to respect rate limits (except for last batch)
        if (i + CONCURRENCY_LIMIT < pullRequests.length) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }

      this.logger?.info(`Successfully fetched detailed info for ${fetchedCount}/${pullRequests.length} PRs`)
    }

    return pullRequests
  }

  private async getReleaseCommits(comparison: ReleaseComparison, options: CollectOptions): Promise<Commit[]> {
    const format = '%H|%ae|%an|%at|%s'
    const range = comparison.commitRange

    this.logger?.info(`Getting commits for release: ${range}`)

    const result = await $`git -C ${this.repoPath} log ${range} --format="${format}" --numstat`.text()

    const commits: Commit[] = []
    const lines = result.split('\n')
    let skippedTrivialCommits = 0
    let totalCommitsProcessed = 0
    let totalFilesProcessed = 0
    let trivialFilesSkipped = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line || !line.includes('|')) {
        continue
      }

      // Parse the commit line
      const parsed = parseGitLogLine(line)
      if (!parsed) {
        this.logger?.warn(`Skipping malformed git log line: ${line}`)
        continue
      }

      totalCommitsProcessed++
      const { sha, email, name, timestamp, message } = parsed
      const stats = { filesChanged: 0, insertions: 0, deletions: 0 }
      const fileChanges: Commit['files'] = []
      const trivialFiles: string[] = []

      // Parse numstat
      i++
      // Skip empty line after commit header
      if (i < lines.length && lines[i] === '') {
        i++
      }

      while (i < lines.length) {
        const statLine = lines[i]

        // Stop if this is the start of a new commit (contains |) or we hit another empty line followed by a commit
        if (!statLine || statLine.includes('|')) {
          if (!statLine) {
            // Check if next line is a commit
            const nextLine = lines[i + 1]
            if (nextLine?.includes('|')) {
              break
            }
            // Otherwise it's just an empty line in the numstat, skip it
            i++
            continue
          } else {
            // New commit line, back up for outer loop
            i--
            break
          }
        }

        if (statLine.trim()) {
          // Git numstat format is: additions\tdeletions\tfilepath
          const tabIndex1 = statLine.indexOf('\t')
          const tabIndex2 = statLine.indexOf('\t', tabIndex1 + 1)

          if (tabIndex1 > -1 && tabIndex2 > -1) {
            const additions = statLine.substring(0, tabIndex1)
            const deletions = statLine.substring(tabIndex1 + 1, tabIndex2)
            const filepath = statLine.substring(tabIndex2 + 1)

            // Skip empty filepaths
            if (!filepath) {
              i++
              continue
            }

            totalFilesProcessed++

            // Skip trivial files
            if (!isTrivialFile(filepath)) {
              const adds = additions === '-' ? 0 : parseInt(additions, 10) || 0
              const dels = deletions === '-' ? 0 : parseInt(deletions, 10) || 0

              // Determine file status based on additions/deletions
              let status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified'
              if (adds > 0 && dels === 0) {
                status = 'added'
              } else if (adds === 0 && dels > 0) {
                status = 'deleted'
              } else if (additions === '-' || deletions === '-') {
                // Binary files or renames show '-' for stats
                status = 'modified'
              }

              fileChanges.push({
                path: filepath,
                status,
                additions: adds,
                deletions: dels,
              })

              stats.insertions += adds
              stats.deletions += dels
              stats.filesChanged++
            } else {
              trivialFiles.push(filepath)
              trivialFilesSkipped++
            }
          }
        }
        i++
      }
      i-- // Back up one since the outer loop will increment

      // Skip commits that only touch trivial files
      if (stats.filesChanged === 0 && trivialFiles.length > 0) {
        skippedTrivialCommits++
        continue
      } else if (stats.filesChanged === 0 && trivialFiles.length === 0) {
        // Empty commit or merge commit, skip
        continue
      }

      const commit = {
        sha,
        author: { name, email },
        timestamp: new Date(parseInt(timestamp, 10) * 1000),
        message,
        stats,
        files: fileChanges,
      }

      // Collect diffs if configured
      if (options.commitDataConfig?.includeDiffs && fileChanges.length > 0) {
        for (const file of fileChanges) {
          if (this.shouldIncludeDiff(file.path, file.additions, file.deletions, options.commitDataConfig)) {
            const diff = await this.collectFileDiff(sha, file.path, options.commitDataConfig)
            if (diff) {
              file.diff = diff
              file.diffTruncated = diff.includes('[diff truncated')
              this.diffsCollected++
              this.tokenUsage += this.estimateTokens(diff)

              // Log progress
              if (this.diffsCollected % 5 === 0) {
                this.logger?.info(`Collected ${this.diffsCollected} diffs (${this.tokenUsage} tokens used)`)
              }
            }
          }
        }
      }

      commits.push(commit)
    }

    // Store stats for reporting (if in release mode)
    if (totalCommitsProcessed > 0) {
      this.filteringStats.totalCommitsFound = totalCommitsProcessed
      this.filteringStats.trivialCommitsFiltered = skippedTrivialCommits
      this.filteringStats.filesProcessed = totalFilesProcessed
      this.filteringStats.trivialFilesSkipped = trivialFilesSkipped
    }

    if (skippedTrivialCommits > 0) {
      this.logger?.info(`Filtered out ${skippedTrivialCommits} commits with only trivial file changes`)
    }

    this.logger?.info(`Analyzed ${commits.length} meaningful commits from ${totalCommitsProcessed} total`)

    if (options.commitDataConfig?.includeDiffs && this.diffsCollected > 0) {
      this.logger?.info(`Collected ${this.diffsCollected} diffs using ~${this.tokenUsage.toLocaleString()} tokens`)
    }

    return commits
  }

  private async getStats(options: CollectOptions): Promise<StatsOutput> {
    // For release comparisons, use the commit range
    if (options.releaseComparison) {
      const range = options.releaseComparison.commitRange
      const shortstat = await $`git -C ${this.repoPath} log ${range} --shortstat --format=""`.text()
      const authors = await $`git -C ${this.repoPath} log ${range} --format="%ae" | sort -u | wc -l`.text()

      let filesChanged = 0,
        linesAdded = 0,
        linesDeleted = 0,
        totalCommits = 0

      for (const line of shortstat.split('\n')) {
        if (line.includes('changed')) {
          totalCommits++
          const fileMatch = line.match(/(\d+) file/)
          const insertMatch = line.match(/(\d+) insertion/)
          const deleteMatch = line.match(/(\d+) deletion/)

          if (fileMatch?.[1]) {
            filesChanged += parseInt(fileMatch[1], 10)
          }
          if (insertMatch?.[1]) {
            linesAdded += parseInt(insertMatch[1], 10)
          }
          if (deleteMatch?.[1]) {
            linesDeleted += parseInt(deleteMatch[1], 10)
          }
        }
      }

      return {
        totalCommits,
        totalAuthors: parseInt(authors.trim(), 10),
        filesChanged,
        linesAdded,
        linesDeleted,
      }
    }

    // Original implementation for time-based analysis
    const shortstat = await $`git -C ${this.repoPath} log --since="${options.since}" --shortstat --format=""`.text()
    const authors =
      await $`git -C ${this.repoPath} log --since="${options.since}" --format="%ae" | sort -u | wc -l`.text()

    let filesChanged = 0,
      linesAdded = 0,
      linesDeleted = 0,
      totalCommits = 0

    for (const line of shortstat.split('\n')) {
      if (line.includes('changed')) {
        totalCommits++
        const fileMatch = line.match(/(\d+) file/)
        const insertMatch = line.match(/(\d+) insertion/)
        const deleteMatch = line.match(/(\d+) deletion/)

        if (fileMatch?.[1]) {
          filesChanged += parseInt(fileMatch[1], 10)
        }
        if (insertMatch?.[1]) {
          linesAdded += parseInt(insertMatch[1], 10)
        }
        if (deleteMatch?.[1]) {
          linesDeleted += parseInt(deleteMatch[1], 10)
        }
      }
    }

    return {
      totalCommits,
      totalAuthors: parseInt(authors.trim(), 10),
      filesChanged,
      linesAdded,
      linesDeleted,
    }
  }
}
