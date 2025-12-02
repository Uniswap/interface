import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Utility for writing analysis artifacts to disk for debugging and audit
 */
export class AnalysisWriter {
  private runId: string
  private basePath: string
  private runPath: string

  constructor(basePath: string = '.analysis') {
    this.basePath = basePath
    this.runId = this.generateRunId()
    this.runPath = join(this.basePath, this.runId)
  }

  /**
   * Generate a unique run ID based on timestamp
   */
  private generateRunId(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')

    return `analysis-${year}${month}${day}-${hours}${minutes}${seconds}`
  }

  /**
   * Get the run ID for this analysis
   */
  getRunId(): string {
    return this.runId
  }

  /**
   * Get the full path to the run directory
   */
  getRunPath(): string {
    return this.runPath
  }

  /**
   * Initialize the run directory
   */
  async initialize(): Promise<void> {
    await mkdir(this.runPath, { recursive: true })
  }

  /**
   * Save JSON data to a file
   */
  async saveJson(filename: string, data: unknown): Promise<void> {
    const filepath = join(this.runPath, filename)
    await Bun.write(filepath, JSON.stringify(data, null, 2))
  }

  /**
   * Save text content to a file
   */
  async saveText(filename: string, content: string): Promise<void> {
    const filepath = join(this.runPath, filename)
    await Bun.write(filepath, content)
  }

  /**
   * Save the configuration used for this run
   */
  async saveConfig(config: unknown): Promise<void> {
    await this.saveJson('config.json', config)
  }

  /**
   * Save commit data
   */
  async saveCommits(commits: unknown[], metadata?: unknown): Promise<void> {
    await this.saveJson('commits.json', {
      count: commits.length,
      metadata,
      commits,
    })
  }

  /**
   * Save pull request data
   */
  async savePullRequests(prs: unknown[]): Promise<void> {
    await this.saveJson('pull-requests.json', {
      count: prs.length,
      pullRequests: prs,
    })
  }

  /**
   * Save repository statistics
   */
  async saveStats(stats: unknown): Promise<void> {
    await this.saveJson('stats.json', stats)
  }

  /**
   * Save the context sent to Claude
   */
  async saveContext(context: string): Promise<void> {
    await this.saveText('context.json', context)
  }

  /**
   * Save the prompt used
   */
  async savePrompt(prompt: string): Promise<void> {
    await this.saveText('prompt.md', prompt)
  }

  /**
   * Save the complete input to Claude
   */
  async saveClaudeInput(input: string): Promise<void> {
    await this.saveText('claude-input.md', input)
  }

  /**
   * Save Claude's response
   */
  async saveClaudeOutput(output: unknown): Promise<void> {
    if (typeof output === 'string') {
      await this.saveText('claude-output.md', output)
    } else {
      await this.saveJson('claude-output.json', output)
    }
  }

  /**
   * Save the final report
   */
  async saveReport(report: string): Promise<void> {
    await this.saveText('report.md', report)
  }

  /**
   * Save a debug summary
   */
  async saveSummary(data: {
    config: unknown
    dataCollection: {
      totalCommits: number
      trivialCommitsFiltered: number
      commitsAnalyzed: number
      prsExtracted: number
      tokensEstimated?: number
    }
    filesFiltered?: {
      snapshots: number
      lockfiles: number
      generated: number
      other: number
    }
    timing?: {
      dataCollection: number
      claudeAnalysis: number
      total: number
    }
  }): Promise<void> {
    const { config, dataCollection, filesFiltered, timing } = data

    // Type assertion for config structure
    const typedConfig = config as {
      analysis?: {
        mode?: string
        releaseOptions?: {
          platform?: string
          version?: string
          compareWith?: string
        }
      }
      collect?: {
        since?: string
      }
    }

    const summary = `# Analysis Run: ${this.runId}

## Configuration
- Mode: ${typedConfig.analysis?.mode || 'unknown'}
${
  typedConfig.analysis?.releaseOptions
    ? `- Platform: ${typedConfig.analysis.releaseOptions.platform}
- Version: ${typedConfig.analysis.releaseOptions.version}
- Comparing with: ${typedConfig.analysis.releaseOptions.compareWith || 'previous'}`
    : ''
}
- Since: ${typedConfig.collect?.since || 'unknown'}

## Data Collection
- Total commits found: ${dataCollection.totalCommits}
- Trivial commits filtered: ${dataCollection.trivialCommitsFiltered}
- Commits analyzed: ${dataCollection.commitsAnalyzed}
- PRs extracted: ${dataCollection.prsExtracted}
${dataCollection.tokensEstimated ? `- Tokens estimated: ~${dataCollection.tokensEstimated.toLocaleString()}` : ''}

${
  filesFiltered
    ? `## Files Filtered
- Snapshots: ${filesFiltered.snapshots} files
- Lockfiles: ${filesFiltered.lockfiles} files
- Generated: ${filesFiltered.generated} files
- Other: ${filesFiltered.other} files`
    : ''
}

${
  timing
    ? `## Timing
- Data collection: ${(timing.dataCollection / 1000).toFixed(1)}s
- Claude analysis: ${(timing.claudeAnalysis / 1000).toFixed(1)}s
- Total: ${(timing.total / 1000).toFixed(1)}s`
    : ''
}

## Output Location
- Run ID: ${this.runId}
- Path: ${this.runPath}/
`

    await this.saveText('summary.md', summary)
  }

  /**
   * Save list of filtered files
   */
  async saveFilteredFiles(files: { path: string; reason: string }[]): Promise<void> {
    await this.saveJson('filtered-files.json', {
      count: files.length,
      files,
    })
  }
}
