/**
 * Logger interface for dependency injection
 * Allows different logging strategies for interactive vs non-interactive modes
 */
export interface Logger {
  info(message: string): void
  warn(message: string): void
  error(message: string): void
  debug(message: string): void
  /**
   * Emit a streaming excerpt from agent thinking/output (optional, for UI progress updates)
   */
  emitStreamingExcerpt?(excerpt: string, isReasoning?: boolean): void
}

/**
 * Progress stage type for UI progress events
 */
export type ProgressStage = 'idle' | 'collecting' | 'analyzing' | 'delivering' | 'complete' | 'error'

/**
 * Progress event type for categorizing messages
 */
export type ProgressEventType = 'reasoning' | 'output' | 'info'

/**
 * Progress event interface for UI updates
 */
export interface ProgressEvent {
  stage: ProgressStage
  message?: string
  progress?: number // 0-100
  cacheInfo?: {
    type: 'commits' | 'prs' | 'stats'
    count: number
  }
  /**
   * Whether this is reasoning (thinking) content from AI
   */
  isReasoning?: boolean
  /**
   * Type of event for visual distinction in UI
   */
  eventType?: ProgressEventType
}

/**
 * ConsoleLogger - Direct console output for non-interactive CLI mode
 */
export class ConsoleLogger implements Logger {
  constructor(private readonly verbose: boolean = false) {}

  info(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`)
  }

  warn(message: string): void {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`)
  }

  error(message: string): void {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`)
  }

  debug(message: string): void {
    if (this.verbose) {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${message}`)
    }
  }
}

/**
 * ProgressLogger - Emits progress events for interactive Ink UI mode
 * Suppresses stdout to avoid interfering with Ink rendering
 */
export class ProgressLogger implements Logger {
  constructor(
    private readonly onProgress: (event: ProgressEvent) => void,
    private readonly verbose: boolean = false,
  ) {}

  info(message: string): void {
    // Suppress redundant messages that are already handled by stage transitions
    if (this.shouldSuppress(message)) {
      return
    }

    // Parse message to determine stage and emit appropriate progress event
    const stage = this.determineStage(message)
    const cleanMessage = message.replace(/^\[INFO\]\s*/, '').trim()

    // Detect cache hit messages and extract cache info
    const cacheInfo = this.parseCacheInfo(message)

    if (cleanMessage) {
      this.onProgress({
        stage,
        message: cleanMessage,
        eventType: 'info',
        ...(cacheInfo && { cacheInfo }),
      })
    }
  }

  warn(message: string): void {
    const cleanMessage = message.replace(/^\[WARN\]\s*/, '').trim()
    // Warnings don't change stage, but emit as progress updates
    if (cleanMessage) {
      this.onProgress({ stage: 'collecting', message: cleanMessage, eventType: 'info' })
    }
  }

  error(message: string): void {
    const cleanMessage = message.replace(/^\[ERROR\]\s*/, '').trim()
    this.onProgress({ stage: 'error', message: cleanMessage, eventType: 'info' })
  }

  debug(message: string): void {
    if (this.verbose) {
      const cleanMessage = message.replace(/^\[DEBUG\]\s*/, '').trim()
      // Debug messages are emitted as progress updates during current stage
      if (cleanMessage) {
        this.onProgress({ stage: 'collecting', message: cleanMessage, eventType: 'info' })
      }
    }
  }

  emitStreamingExcerpt(excerpt: string, isReasoning = false): void {
    // Excerpts are already trimmed to meaningful chunks (complete sentences or size limits)
    // Just ensure they're not too long for display (safety check)
    const maxDisplayLength = 250
    const displayExcerpt = excerpt.length > maxDisplayLength ? `${excerpt.slice(0, maxDisplayLength)}...` : excerpt

    // Emit as progress event during analyzing stage with reasoning flag and event type
    this.onProgress({
      stage: 'analyzing',
      message: displayExcerpt,
      isReasoning,
      eventType: isReasoning ? 'reasoning' : 'output',
    })
  }

  /**
   * Check if a message should be suppressed (not emitted as progress event)
   */
  private shouldSuppress(message: string): boolean {
    return message.includes('Scanning for') || message.includes('Starting repository analysis')
  }

  /**
   * Determine the progress stage based on message content
   */
  private determineStage(message: string): ProgressEvent['stage'] {
    // Stage transitions - check these first
    if (message.includes('Collecting repository data')) {
      return 'collecting'
    }
    if (message.includes('Running analysis') || message.includes('Analyzing with Claude')) {
      return 'analyzing'
    }
    if (message.includes('Delivering to') || message.includes('Delivering results')) {
      return 'delivering'
    }
    if (message.includes('Analysis complete')) {
      return 'complete'
    }

    // Batch progress updates
    if (
      (message.includes('Fetched') && message.includes('PRs') && message.includes('batch')) ||
      message.includes('Successfully fetched') ||
      (message.includes('Found') && (message.includes('commits') || message.includes('pull requests'))) ||
      message.includes('Extracting PR information') ||
      message.includes('Getting commits for release')
    ) {
      return 'collecting'
    }

    // Default to collecting stage for other INFO messages
    return 'collecting'
  }

  /**
   * Parse cache hit information from log messages
   */
  private parseCacheInfo(message: string): ProgressEvent['cacheInfo'] | undefined {
    // Pattern: "Cache hit: Found X commits in cache"
    // Pattern: "Cache hit: Found X PRs in cache"
    const cacheHitMatch = message.match(/Cache hit: Found (\d+) (commits|PRs|pull requests) in cache/i)
    if (cacheHitMatch) {
      const count = parseInt(cacheHitMatch[1] || '0', 10)
      const typeStr = cacheHitMatch[2]?.toLowerCase() || ''

      let type: 'commits' | 'prs' | 'stats'
      if (typeStr.includes('commit')) {
        type = 'commits'
      } else if (typeStr.includes('pr') || typeStr.includes('pull request')) {
        type = 'prs'
      } else {
        return undefined
      }

      return { type, count }
    }

    // Pattern: "Cache hit: Found X stats in cache" (if stats caching exists)
    const statsCacheMatch = message.match(/Cache hit: Found (\d+) stats? in cache/i)
    if (statsCacheMatch) {
      return {
        type: 'stats',
        count: parseInt(statsCacheMatch[1] || '0', 10),
      }
    }

    return undefined
  }
}
