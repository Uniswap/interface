import type { OrchestratorConfig } from '@universe/cli/src/core/orchestrator'
import { Orchestrator } from '@universe/cli/src/core/orchestrator'
import { createVercelAIProvider } from '@universe/cli/src/lib/ai-provider-vercel'
import { SqliteCacheProvider } from '@universe/cli/src/lib/cache-provider-sqlite'
import { type ProgressEvent, ProgressLogger, type ProgressStage } from '@universe/cli/src/lib/logger'

export type { ProgressStage, ProgressEvent }

export type ProgressCallback = (event: ProgressEvent) => void

export class OrchestratorService {
  private orchestrator: Orchestrator | null = null
  private progressCallback: ProgressCallback | null = null

  async execute(config: OrchestratorConfig, onProgress?: ProgressCallback): Promise<Record<string, unknown>> {
    this.progressCallback = onProgress || null

    // Create cache provider (unless bypassing cache)
    const bypassCache = config.bypassCache || false
    const cacheProvider = bypassCache ? undefined : new SqliteCacheProvider()

    // Create AI provider
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    const aiProvider = createVercelAIProvider(apiKey)

    // Ensure repoPath is set in collect options
    const configWithRepoPath: OrchestratorConfig = {
      ...config,
      collect: {
        ...config.collect,
        repoPath: config.collect.repoPath || process.cwd(),
      },
    }

    // Create progress logger that emits events for interactive UI mode
    const logger = new ProgressLogger((event: ProgressEvent) => {
      this.emitProgress(event)
    }, config.verbose || false)

    // Create orchestrator with progress logger
    this.orchestrator = new Orchestrator({
      config: configWithRepoPath,
      aiProvider,
      cacheProvider,
      logger,
    })

    try {
      // Execute and capture the analysis results
      const results = await this.orchestrator.execute()
      return results
    } finally {
      // Close cache connection if used
      if (cacheProvider) {
        cacheProvider.close()
      }
    }
  }

  private emitProgress(event: ProgressEvent): void {
    if (this.progressCallback) {
      this.progressCallback(event)
    }
  }
}
