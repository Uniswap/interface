/* eslint-disable max-depth */
/* eslint-disable security/detect-non-literal-regexp */
/* eslint-disable complexity */
/* eslint-disable max-lines */
/* eslint-disable no-console */
import { join } from 'node:path'
import {
  type CollectOptions,
  DataCollector,
  type PullRequest,
  type RepositoryData,
} from '@universe/cli/src/core/data-collector'
import type { AIProvider } from '@universe/cli/src/lib/ai-provider'
import { AnalysisWriter } from '@universe/cli/src/lib/analysis-writer'
import type { CacheProvider } from '@universe/cli/src/lib/cache-provider'
import type { Logger } from '@universe/cli/src/lib/logger'
import { ReleaseScanner } from '@universe/cli/src/lib/release-scanner'

// ============================================================================
// Types
// ============================================================================

export interface AnalysisConfig {
  mode?: string // Predefined mode (team-digest, changelog, release-changelog, etc.)
  prompt?: string // Custom prompt (file path or inline text)
  promptFile?: string // Explicit prompt file path
  variables?: Record<string, string> // Variable substitution for prompts
  releaseOptions?: {
    // Release-specific options
    platform: 'mobile' | 'extension'
    version: string
    compareWith?: string
  }
}

export interface OutputConfig {
  type: string // Output type (slack, markdown, file, etc.)
  target?: string // Target destination (file path, channel, etc.)
  options?: Record<string, unknown> // Type-specific options
}

export interface OrchestratorConfig {
  analysis: AnalysisConfig
  outputs: OutputConfig[]
  collect: CollectOptions
  verbose?: boolean
  dryRun?: boolean
  saveArtifacts?: boolean
  model?: string // AI model to use (defaults to claude-opus-4-1-20250805)
  bypassCache?: boolean // Bypass cache for this run
}

// ============================================================================
// Prompt Management
// ============================================================================

class PromptResolver {
  private builtInPromptsPath = join((import.meta.dir as string | undefined) ?? process.cwd(), 'src', 'prompts')
  private projectPromptsPath = '.claude/prompts'

  async resolve(promptRef: string): Promise<string> {
    // If it's a multiline string or looks like instructions, use as-is
    if (promptRef.includes('\n') || promptRef.length > 100) {
      return promptRef
    }

    // If it ends with .md, treat as file path
    if (promptRef.endsWith('.md')) {
      return await this.loadFromFile(promptRef)
    }

    // Check for built-in prompts
    const builtInPath = join(this.builtInPromptsPath, `${promptRef}.md`)
    if (await this.fileExists(builtInPath)) {
      return await this.loadFromFile(builtInPath)
    }

    // Check for project prompts
    const projectPath = join(this.projectPromptsPath, `${promptRef}.md`)
    if (await this.fileExists(projectPath)) {
      return await this.loadFromFile(projectPath)
    }

    // Treat as inline prompt if not found as file
    return promptRef
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await Bun.file(path).text()
      return true
    } catch {
      return false
    }
  }

  private async loadFromFile(path: string): Promise<string> {
    try {
      return await Bun.file(path).text()
    } catch (error) {
      throw new Error(`Failed to load prompt from ${path}: ${error}`)
    }
  }

  substituteVariables(prompt: string, variables: Record<string, string>): string {
    let result = prompt
    for (const [key, value] of Object.entries(variables)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Use string replace with regex pattern - escapedKey is safe as it's escaped
      const dollarPattern = new RegExp(`\\$${escapedKey}`, 'g')
      const bracePattern = new RegExp(`{{${escapedKey}}}`, 'g')
      result = result.replace(dollarPattern, value)
      result = result.replace(bracePattern, value)
    }
    return result
  }
}

// ============================================================================
// Analysis Orchestrator
// ============================================================================

export interface OrchestratorDependencies {
  config: OrchestratorConfig
  aiProvider: AIProvider
  cacheProvider?: CacheProvider
  logger: Logger
}

export class Orchestrator {
  private promptResolver = new PromptResolver()
  private dataCollector: DataCollector
  private analysisWriter: AnalysisWriter
  private startTime: number = 0
  private timings: { dataCollection: number; claudeAnalysis: number } = { dataCollection: 0, claudeAnalysis: 0 }
  private config: OrchestratorConfig
  private aiProvider: AIProvider
  private logger: Logger

  constructor(deps: OrchestratorDependencies) {
    this.config = deps.config
    this.aiProvider = deps.aiProvider
    this.logger = deps.logger
    this.dataCollector = new DataCollector(
      deps.config.collect.repoPath,
      deps.cacheProvider,
      deps.config.bypassCache || false,
      deps.logger,
    )
    this.analysisWriter = new AnalysisWriter()
  }

  async execute(): Promise<Record<string, unknown>> {
    this.startTime = Date.now()
    const runId = this.analysisWriter.getRunId()
    this.logger.info(`Starting repository analysis${this.config.saveArtifacts ? ` (run: ${runId})` : ''}`)

    // Initialize analysis directory if saving artifacts
    if (this.config.saveArtifacts) {
      await this.analysisWriter.initialize()
      // Save configuration
      await this.analysisWriter.saveConfig(this.config)
    }

    // Step 1: Collect repository data
    const dataStartTime = Date.now()
    const data = await this.collectData()
    this.timings.dataCollection = Date.now() - dataStartTime

    // Step 2: Run analysis with universal analyzer
    const analysisStartTime = Date.now()
    const insights = await this.analyze(data)
    this.timings.claudeAnalysis = Date.now() - analysisStartTime

    // Step 3: Deliver to outputs
    await this.deliver(insights, data)

    // Generate summary
    await this.generateSummary(data)

    const totalTime = Date.now() - this.startTime
    this.logger.info(`Analysis complete! (${(totalTime / 1000).toFixed(1)}s)`)
    this.logger.info(`View artifacts: ${this.analysisWriter.getRunPath()}/`)

    // Return the analysis results for UI consumption
    return insights
  }

  private async collectData(): Promise<RepositoryData> {
    this.logger.info('Collecting repository data...')

    let data: RepositoryData

    // If in release mode (release-changelog or bug-bisect), augment collect options with release comparison
    if (
      (this.config.analysis.mode === 'release-changelog' || this.config.analysis.mode === 'bug-bisect') &&
      this.config.analysis.releaseOptions
    ) {
      const scanner = new ReleaseScanner(this.config.collect.repoPath, this.logger)
      const { platform, version, compareWith } = this.config.analysis.releaseOptions

      const comparison = await scanner.getReleaseComparison({
        platform,
        version,
        compareWith,
      })
      if (!comparison) {
        throw new Error(`Could not find release comparison for ${platform}/${version}`)
      }

      this.logger.info(`Analyzing release: ${platform}/${version} (comparing with ${comparison.from.version})`)

      // Add release comparison to collect options
      const collectOptions: CollectOptions = {
        ...this.config.collect,
        releaseComparison: comparison,
      }

      data = await this.dataCollector.collect(collectOptions)
    } else {
      data = await this.dataCollector.collect(this.config.collect)
    }

    // Save collected data if saving artifacts
    if (this.config.saveArtifacts) {
      await this.analysisWriter.saveCommits(data.commits, data.metadata)
      await this.analysisWriter.savePullRequests(data.pullRequests)
      await this.analysisWriter.saveStats(data.stats)
    }

    return data
  }

  private async analyze(data: RepositoryData): Promise<Record<string, unknown>> {
    this.logger.info('Running analysis...')

    // Build the analysis prompt
    const prompt = await this.buildPrompt(data)
    if (this.config.saveArtifacts) {
      await this.analysisWriter.savePrompt(prompt)
    }

    // Prepare data context
    const context = this.prepareContext(data)
    if (this.config.saveArtifacts) {
      await this.analysisWriter.saveContext(context)
    }

    // Smart injection: replace if template has placeholder, otherwise append
    let analysisPrompt: string
    if (prompt.includes('{{COMMIT_DATA}}')) {
      // New style: Replace the variable
      analysisPrompt = prompt.replace(/{{COMMIT_DATA}}/g, context)
    } else {
      // Legacy style: Append to end
      analysisPrompt = `${prompt}\n\n## Repository Data\n\n${context}`
    }

    // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
    let estimatedTokens = Math.round(analysisPrompt.length / 4)
    this.logger.info(`Prepared Claude context (estimated ~${estimatedTokens.toLocaleString()} tokens)...`)

    // Check if we're over Claude's limit (roughly 200k tokens for Claude 3)
    const MAX_TOKENS = 150000 // Conservative limit to leave room for response

    if (estimatedTokens > MAX_TOKENS) {
      this.logger.warn(`Context too large (${estimatedTokens} tokens), reducing data...`)

      // Step 1: Try again without diffs (prefer PR bodies over diffs)
      const reducedContext = this.prepareContext(data, true) // skipDiffs flag
      if (prompt.includes('{{COMMIT_DATA}}')) {
        analysisPrompt = prompt.replace(/{{COMMIT_DATA}}/g, reducedContext)
      } else {
        analysisPrompt = `${prompt}\n\n## Repository Data\n\n${reducedContext}`
      }
      estimatedTokens = Math.round(analysisPrompt.length / 4)
      this.logger.info(`Reduced context to ~${estimatedTokens.toLocaleString()} tokens (removed diffs)`)

      // Step 2: If still too large, truncate PR bodies proportionally
      if (estimatedTokens > MAX_TOKENS) {
        this.logger.warn('Still too large, truncating PR bodies...')
        const dataWithTruncatedPRs = this.truncatePRBodies(data, 0.5) // Reduce to 50% of original length
        const contextWithTruncatedPRs = this.prepareContext(dataWithTruncatedPRs, true)
        if (prompt.includes('{{COMMIT_DATA}}')) {
          analysisPrompt = prompt.replace(/{{COMMIT_DATA}}/g, contextWithTruncatedPRs)
        } else {
          analysisPrompt = `${prompt}\n\n## Repository Data\n\n${contextWithTruncatedPRs}`
        }
        estimatedTokens = Math.round(analysisPrompt.length / 4)
        this.logger.info(`Reduced context to ~${estimatedTokens.toLocaleString()} tokens (truncated PR bodies to 50%)`)

        // Step 3: If still too large, truncate commits
        if (estimatedTokens > MAX_TOKENS) {
          this.logger.warn('Still too large, truncating commit list...')
          const truncatedData = { ...dataWithTruncatedPRs, commits: dataWithTruncatedPRs.commits.slice(0, 100) }
          const minimalContext = this.prepareContext(truncatedData, true)
          if (prompt.includes('{{COMMIT_DATA}}')) {
            analysisPrompt = prompt.replace(/{{COMMIT_DATA}}/g, minimalContext)
          } else {
            analysisPrompt = `${prompt}\n\n## Repository Data\n\n${minimalContext}`
          }
          estimatedTokens = Math.round(analysisPrompt.length / 4)
          this.logger.info(`Final context: ~${estimatedTokens.toLocaleString()} tokens (kept first 100 commits)`)
        }
      }
    }

    if (this.config.saveArtifacts) {
      await this.analysisWriter.saveClaudeInput(analysisPrompt)
    }

    if (this.config.verbose) {
      this.logger.debug(`Analysis prompt: ${analysisPrompt.slice(0, 500)}...`)
    }

    // For now, directly use Claude API since Task is not available in this context
    // In production, this would use the Task API
    const result = await this.analyzeWithClaude(analysisPrompt)

    // Save Claude's output
    if (this.config.saveArtifacts) {
      await this.analysisWriter.saveClaudeOutput(result)
    }

    return result
  }

  private async buildPrompt(data: RepositoryData): Promise<string> {
    let promptText = ''

    // Load base prompt
    if (this.config.analysis.mode) {
      promptText = await this.promptResolver.resolve(this.config.analysis.mode)
    } else if (this.config.analysis.promptFile) {
      promptText = await this.promptResolver.resolve(this.config.analysis.promptFile)
    } else if (this.config.analysis.prompt) {
      promptText = await this.promptResolver.resolve(this.config.analysis.prompt)
    } else {
      // Default to team-digest
      promptText = await this.promptResolver.resolve('team-digest')
    }

    // Build variables for substitution
    const variables: Record<string, string> = {
      ...this.config.analysis.variables,
    }

    // Add release context variables for bug-bisect mode
    if (
      this.config.analysis.mode === 'bug-bisect' &&
      this.config.analysis.releaseOptions &&
      data.metadata.releaseInfo
    ) {
      variables.PLATFORM = data.metadata.releaseInfo.platform
      variables.RELEASE_TO = data.metadata.releaseInfo.to
      variables.RELEASE_FROM = data.metadata.releaseInfo.from
    }

    // Substitute variables if provided
    if (Object.keys(variables).length > 0) {
      promptText = this.promptResolver.substituteVariables(promptText, variables)
    }

    return promptText
  }

  /**
   * Truncate PR bodies proportionally to reduce context size
   * @param data Original repository data
   * @param ratio Ratio to keep (0.5 = keep 50% of each PR body)
   */
  private truncatePRBodies(data: RepositoryData, ratio: number): RepositoryData {
    const truncatedPRs = data.pullRequests.map((pr: PullRequest) => {
      if (pr.body && pr.body.length > 0) {
        const targetLength = Math.max(100, Math.floor(pr.body.length * ratio)) // Keep at least 100 chars
        const truncatedBody = pr.body.slice(0, targetLength) + (pr.body.length > targetLength ? '... [truncated]' : '')
        return {
          number: pr.number,
          title: pr.title,
          body: truncatedBody,
          author: pr.author,
          state: pr.state,
          mergedAt: pr.mergedAt,
          mergeCommitSha: pr.mergeCommitSha,
        } satisfies PullRequest
      }
      return {
        number: pr.number,
        title: pr.title,
        body: pr.body,
        author: pr.author,
        state: pr.state,
        mergedAt: pr.mergedAt,
        mergeCommitSha: pr.mergeCommitSha,
      } satisfies PullRequest
    }) as PullRequest[]

    return {
      ...data,
      pullRequests: truncatedPRs,
    }
  }

  private prepareContext(data: RepositoryData, skipDiffs: boolean = false): string {
    const lines: string[] = []
    let prBodyTokens = 0

    // Metadata section (compact format)
    lines.push('=== REPOSITORY METADATA ===')
    lines.push(`Repository: ${data.metadata.repository}`)
    lines.push(`Period: ${data.metadata.period}`)

    if (data.metadata.releaseInfo) {
      lines.push(
        `Release: ${data.metadata.releaseInfo.platform} ${data.metadata.releaseInfo.from} → ${data.metadata.releaseInfo.to}`,
      )
    }

    lines.push(`Total commits: ${data.metadata.commitCount}`)
    lines.push(`Pull requests: ${data.metadata.prCount}`)

    if (data.metadata.filtering) {
      lines.push(`Filtered: ${data.metadata.filtering.trivialCommitsFiltered} trivial commits removed`)
    }
    lines.push('')

    // Stats section (compact)
    lines.push('=== STATISTICS ===')
    lines.push(`Authors: ${data.stats.totalAuthors}`)
    lines.push(`Files changed: ${data.stats.filesChanged}`)
    lines.push(`Lines: +${data.stats.linesAdded} -${data.stats.linesDeleted}`)
    lines.push('')

    // Pull requests section with full bodies (up to prBodyLimit)
    if (data.pullRequests.length > 0) {
      lines.push('=== PULL REQUESTS ===')
      for (const pr of data.pullRequests) {
        lines.push(`PR #${pr.number}: ${pr.title} [${pr.state}] @${pr.author}`)
        if (pr.body) {
          // Include full PR body (already truncated to prBodyLimit during collection)
          // Preserve markdown formatting with proper newlines
          const bodyLines = pr.body.split('\n')
          for (const line of bodyLines) {
            lines.push(`  ${line}`)
          }
          // Track token usage for PR bodies (rough approximation: 1 token ≈ 4 characters)
          prBodyTokens += Math.ceil(pr.body.length / 4)
        }
      }
      lines.push('')
    }

    // Log PR body token contribution if significant
    if (prBodyTokens > 0) {
      this.logger.info(`PR bodies contribute ~${prBodyTokens.toLocaleString()} tokens to context`)
    }

    // Commits section (ultra-compact format)
    lines.push('=== COMMITS ===')
    for (const commit of data.commits) {
      // Format: sha | author | message | stats
      const date = new Date(commit.timestamp).toISOString().split('T')[0]
      lines.push(`${commit.sha.slice(0, 7)} | ${date} | ${commit.author.email.split('@')[0]} | ${commit.message}`)

      // If we have file information, show it compactly
      if (commit.files && commit.files.length > 0) {
        // Group files by directory for even more compact display
        const fileGroups = new Map<string, string[]>()

        for (const file of commit.files) {
          const parts = file.path.split('/')
          const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.'
          const filename = parts[parts.length - 1]

          if (!fileGroups.has(dir)) {
            fileGroups.set(dir, [])
          }

          // Status indicators: M=modified, A=added, D=deleted, R=renamed
          const statusChar = file.status[0]?.toUpperCase() ?? 'M'
          const changes = `${statusChar}:+${file.additions}-${file.deletions}`
          const files = fileGroups.get(dir)
          if (files) {
            files.push(`${filename}(${changes})`)
          }
        }

        // Output grouped files
        for (const [dir, files] of fileGroups) {
          if (files.length <= 3) {
            lines.push(`  ${dir}/: ${files.join(' ')}`)
          } else {
            // If many files in same dir, summarize
            lines.push(`  ${dir}/: ${files.slice(0, 2).join(' ')} +${files.length - 2} more`)
          }
        }

        // Include diffs if available (already in compact diff format)
        if (!skipDiffs) {
          for (const file of commit.files) {
            if (file.diff) {
              lines.push(`  --- ${file.path} ---`)
              // Add indent to diff lines for readability
              const diffLines = file.diff.split('\n').map((line: string) => `  ${line}`)
              lines.push(...diffLines.slice(0, 10)) // Limit diff preview
              if (diffLines.length > 10) {
                lines.push(`  ... (${diffLines.length - 10} more lines)`)
              }
            }
          }
        }
      }
    }

    return lines.join('\n')
  }

  private async analyzeWithClaude(prompt: string): Promise<Record<string, unknown>> {
    this.logger.info('Analyzing with Claude...')

    const model = this.config.model || 'claude-sonnet-4-5-20250929'
    const stream = this.aiProvider.streamText({
      prompt,
      model,
      maxTokens: 64000,
      temperature: 1,
    })

    // Stream and accumulate full response, emitting excerpts for UI
    let fullText = ''

    // Buffers for accumulating deltas into meaningful chunks
    let textBuffer = ''
    let reasoningBuffer = ''
    const MIN_EXCERPT_LENGTH = 150 // Minimum chars before emitting (higher threshold to reduce frequency)
    const MAX_EXCERPT_LENGTH = 160 // Maximum chars per excerpt (very compact)
    const MAX_BUFFER_LENGTH = 220 // Force emit if buffer gets too large
    let lastEmittedTime = 0
    const MIN_EMIT_INTERVAL_MS = 2000 // Only emit excerpts every 2 seconds max

    for await (const chunk of stream) {
      // Accumulate text
      if (chunk.text) {
        fullText += chunk.text
        textBuffer += chunk.text

        // Check if we should emit a text excerpt
        if (this.logger.emitStreamingExcerpt) {
          const now = Date.now()
          // Throttle excerpt emissions
          if (now - lastEmittedTime >= MIN_EMIT_INTERVAL_MS) {
            // Find sentence boundaries (including newlines for changelog-style content)
            const lastSentenceEnd = Math.max(
              textBuffer.lastIndexOf('.\n'),
              textBuffer.lastIndexOf('.\n\n'),
              textBuffer.lastIndexOf('. '),
              textBuffer.lastIndexOf('!\n'),
              textBuffer.lastIndexOf('?\n'),
              textBuffer.lastIndexOf('\n\n'), // Double newline (paragraph break)
            )

            // Only emit if we have a good boundary and enough content
            if (
              (lastSentenceEnd >= MIN_EXCERPT_LENGTH && lastSentenceEnd <= MAX_EXCERPT_LENGTH) ||
              (textBuffer.length >= MAX_BUFFER_LENGTH && lastSentenceEnd > MIN_EXCERPT_LENGTH)
            ) {
              const excerpt = textBuffer.slice(0, lastSentenceEnd > 0 ? lastSentenceEnd + 1 : MAX_EXCERPT_LENGTH).trim()
              // Filter out markdown headers and very short content
              if (excerpt.length >= MIN_EXCERPT_LENGTH && !excerpt.startsWith('##')) {
                this.logger.emitStreamingExcerpt(excerpt, false)
                textBuffer = textBuffer.slice(lastSentenceEnd > 0 ? lastSentenceEnd + 1 : MAX_EXCERPT_LENGTH)
                lastEmittedTime = now
              }
            }
          }
        } else {
          // CLI mode: write directly to console
          process.stdout.write(chunk.text)
        }
      }

      // Accumulate reasoning
      if (chunk.reasoning) {
        reasoningBuffer += chunk.reasoning

        // Check if we should emit a reasoning excerpt (prefer reasoning over text)
        if (this.logger.emitStreamingExcerpt) {
          const now = Date.now()
          // Throttle excerpt emissions
          if (now - lastEmittedTime >= MIN_EMIT_INTERVAL_MS) {
            // Find sentence boundaries for reasoning
            const lastSentenceEnd = Math.max(
              reasoningBuffer.lastIndexOf('.\n'),
              reasoningBuffer.lastIndexOf('.\n\n'),
              reasoningBuffer.lastIndexOf('. '),
              reasoningBuffer.lastIndexOf('!\n'),
              reasoningBuffer.lastIndexOf('?\n'),
              reasoningBuffer.lastIndexOf('\n\n'),
            )

            // Only emit if we have a good boundary and enough content
            if (
              (lastSentenceEnd >= MIN_EXCERPT_LENGTH && lastSentenceEnd <= MAX_EXCERPT_LENGTH) ||
              (reasoningBuffer.length >= MAX_BUFFER_LENGTH && lastSentenceEnd > MIN_EXCERPT_LENGTH)
            ) {
              const excerpt = reasoningBuffer
                .slice(0, lastSentenceEnd > 0 ? lastSentenceEnd + 1 : MAX_EXCERPT_LENGTH)
                .trim()
              // Filter out markdown headers and very short content
              if (excerpt.length >= MIN_EXCERPT_LENGTH && !excerpt.startsWith('##')) {
                this.logger.emitStreamingExcerpt(excerpt, true)
                reasoningBuffer = reasoningBuffer.slice(lastSentenceEnd > 0 ? lastSentenceEnd + 1 : MAX_EXCERPT_LENGTH)
                lastEmittedTime = now
              }
            }
          }
        }
      }

      if (chunk.isComplete) {
        // Emit any remaining buffered content
        if (this.logger.emitStreamingExcerpt) {
          if (textBuffer.trim().length > 0) {
            this.logger.emitStreamingExcerpt(textBuffer.trim(), false)
          }
          if (reasoningBuffer.trim().length > 0) {
            this.logger.emitStreamingExcerpt(reasoningBuffer.trim(), true)
          }
        } else {
        }
        break
      }
    }

    // Try to parse as JSON if possible (especially for bug-bisect mode)
    if (this.config.analysis.mode === 'bug-bisect') {
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = fullText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || fullText.match(/(\{[\s\S]*\})/)
        const jsonText = jsonMatch && jsonMatch[1] ? jsonMatch[1] : fullText
        const parsed = JSON.parse(jsonText) as Record<string, unknown>
        // Ensure it has the expected structure
        if (parsed.suspiciousCommits && Array.isArray(parsed.suspiciousCommits)) {
          return parsed
        }
        // If structure is wrong, wrap it
        return { analysis: fullText, parsed }
      } catch (error) {
        this.logger.warn(`Failed to parse JSON response: ${error}`)
        // Return as analysis text but try to extract any JSON-like content
        return { analysis: fullText, error: 'Failed to parse JSON response' }
      }
    }

    // For other modes, try to parse as JSON but fallback to text
    try {
      return JSON.parse(fullText) as Record<string, unknown>
    } catch {
      return { analysis: fullText }
    }
  }

  private async deliver(insights: Record<string, unknown>, data: RepositoryData): Promise<void> {
    this.logger.info('Delivering results...')

    for (const output of this.config.outputs) {
      await this.deliverToOutput({ insights, data, output })
    }
  }

  private async deliverToOutput(args: {
    insights: Record<string, unknown>
    data: RepositoryData
    output: OutputConfig
  }): Promise<void> {
    const { insights, data, output } = args
    this.logger.info(`Delivering to ${output.type}...`)

    switch (output.type) {
      case 'stdout': {
        console.log('\n=== Analysis Results ===\n')
        console.log(JSON.stringify(insights, null, 2))
        break
      }

      case 'file':
      case 'markdown': {
        const path = output.target || 'analysis-output.md'
        if (this.config.dryRun) {
          this.logger.info(`[DRY RUN] Would save to file: ${path}`)
          this.logger.info('[DRY RUN] Preview of content:')
          console.log(this.formatAsMarkdown(insights, data).slice(0, 500) + '...')
        } else {
          // In production, this would use markdown-formatter subagent
          await this.saveToFile({ insights, data, path })
          this.logger.info(`Saved to ${path}`)
        }
        break
      }

      case 'slack': {
        if (this.config.dryRun) {
          this.logger.info(`[DRY RUN] Would publish to Slack channel: ${output.target}`)
          this.logger.info(`[DRY RUN] Message preview: ${JSON.stringify(insights).slice(0, 200)}...`)
        } else {
          // In production, this would use slack-publisher subagent
          this.logger.info(`Would publish to Slack channel: ${output.target}`)
          this.logger.info('Note: Slack integration requires subagent implementation')
        }
        break
      }

      default:
        this.logger.warn(`Unknown output type: ${output.type}`)
    }
  }

  private async saveToFile(args: {
    insights: Record<string, unknown>
    data: RepositoryData
    path: string
  }): Promise<void> {
    const { insights, data, path } = args
    const content = this.formatAsMarkdown(insights, data)
    await Bun.write(path, content)

    // Also save to analysis folder
    await this.analysisWriter.saveReport(content)
  }

  private formatAsMarkdown(insights: Record<string, unknown>, data: RepositoryData): string {
    const lines: string[] = []

    lines.push(`# Repository Analysis: ${data.metadata.repository}`)
    lines.push(`*Period: ${data.metadata.period}*`)
    lines.push(`*Generated: ${data.metadata.collectedAt}*`)
    lines.push('')

    if (insights.themes && Array.isArray(insights.themes)) {
      lines.push('## Themes')
      for (const theme of insights.themes) {
        if (theme && typeof theme === 'object' && 'title' in theme && 'description' in theme) {
          lines.push(`### ${String(theme.title)}`)
          lines.push(String(theme.description))
          lines.push('')
        }
      }
    }

    if (insights.highlights && Array.isArray(insights.highlights)) {
      lines.push('## Highlights')
      for (const highlight of insights.highlights) {
        lines.push(`- ${String(highlight)}`)
      }
      lines.push('')
    }

    if (insights.metrics && typeof insights.metrics === 'object') {
      const metrics = insights.metrics as Record<string, unknown>
      lines.push('## Metrics')
      if (typeof metrics.total_commits === 'number') {
        lines.push(`- Commits: ${metrics.total_commits}`)
      }
      if (typeof metrics.total_prs === 'number') {
        lines.push(`- Pull Requests: ${metrics.total_prs}`)
      }
      if (typeof metrics.active_contributors === 'number') {
        lines.push(`- Contributors: ${metrics.active_contributors}`)
      }
      lines.push('')
    }

    if (typeof insights === 'string') {
      lines.push('## Analysis')
      lines.push(insights)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (insights && typeof insights === 'object' && 'analysis' in insights && insights.analysis) {
      lines.push('## Analysis')
      lines.push(String(insights.analysis))
    }

    return lines.join('\n')
  }

  private async generateSummary(data: RepositoryData): Promise<void> {
    if (!this.config.saveArtifacts) {
      return
    }

    // Get stats from data collector if available
    const totalCommits = data.metadata.filtering?.totalCommitsFound ?? data.metadata.commitCount
    const trivialFiltered = data.metadata.filtering?.trivialCommitsFiltered ?? 0

    await this.analysisWriter.saveSummary({
      config: this.config,
      dataCollection: {
        totalCommits,
        trivialCommitsFiltered: trivialFiltered,
        commitsAnalyzed: data.commits.length,
        prsExtracted: data.pullRequests.length,
        tokensEstimated: Math.round((data.commits.length * 100 + data.pullRequests.length * 50) / 4),
      },
      timing: {
        dataCollection: this.timings.dataCollection,
        claudeAnalysis: this.timings.claudeAnalysis,
        total: Date.now() - this.startTime,
      },
    })
  }
}
