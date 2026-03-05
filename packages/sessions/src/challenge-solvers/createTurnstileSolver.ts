import {
  TurnstileApiNotAvailableError,
  TurnstileError,
  TurnstileScriptLoadError,
  TurnstileTimeoutError,
  TurnstileTokenExpiredError,
} from '@universe/sessions/src/challenge-solvers/turnstileErrors'
import { ensureTurnstileScript } from '@universe/sessions/src/challenge-solvers/turnstileScriptLoader'
import type {
  ChallengeData,
  ChallengeSolver,
  TurnstileScriptOptions,
} from '@universe/sessions/src/challenge-solvers/types'
import type { PerformanceTracker } from '@universe/sessions/src/performance/types'
import type { Logger } from 'utilities/src/logger/logger'

/**
 * Analytics data for Turnstile solve attempts.
 * Reported via onSolveCompleted callback.
 */
interface TurnstileSolveAnalytics {
  durationMs: number
  success: boolean
  errorType?: 'timeout' | 'script_load' | 'network' | 'validation' | 'unknown'
  errorMessage?: string
}

// Declare Turnstile types inline to avoid import issues
interface TurnstileWidget {
  render: (container: string | HTMLElement, options: TurnstileOptions) => string
  remove: (widgetId: string) => void
  reset: (widgetId: string) => void
  getResponse: (widgetId: string) => string | undefined
  ready: (callback: () => void) => void
}

interface TurnstileOptions {
  sitekey: string
  action?: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact' | 'flexible'
  callback?: (token: string) => void
  'error-callback'?: (error: string) => void
  'expired-callback'?: () => void
}

// Extend the Window interface to include turnstile
declare global {
  interface Window {
    turnstile?: TurnstileWidget
  }
}

interface CreateTurnstileSolverContext {
  /**
   * Required: Performance tracker for timing measurements.
   * Must be injected - no implicit dependency on globalThis.performance.
   */
  performanceTracker: PerformanceTracker
  /**
   * Optional logger for debugging
   */
  getLogger?: () => Logger
  /**
   * Optional script injection options for CSP compliance
   */
  scriptOptions?: TurnstileScriptOptions
  /**
   * Widget rendering timeout in milliseconds
   * @default 30000
   */
  timeoutMs?: number
  /**
   * Callback for analytics when solve completes (success or failure)
   */
  onSolveCompleted?: (data: TurnstileSolveAnalytics) => void
}

/**
 * Classifies error into analytics error type
 */
function classifyError(error: unknown): TurnstileSolveAnalytics['errorType'] {
  if (error instanceof TurnstileTimeoutError || error instanceof TurnstileTokenExpiredError) {
    return 'timeout'
  }
  if (error instanceof TurnstileScriptLoadError || error instanceof TurnstileApiNotAvailableError) {
    return 'script_load'
  }
  if (error instanceof TurnstileError) {
    return 'network'
  }
  if (error instanceof Error && error.message.includes('parse')) {
    return 'validation'
  }
  if (error instanceof Error && error.message.includes('Missing')) {
    return 'validation'
  }
  return 'unknown'
}

/**
 * Creates a Turnstile challenge solver.
 *
 * This integrates with Cloudflare Turnstile using explicit rendering:
 * - Dynamically loads Turnstile script if not present (with state management)
 * - Creates a temporary DOM container
 * - Renders widget with sitekey and action from challengeData.extra
 * - Returns the verification token from Turnstile API
 *
 * Features:
 * - Separation of concerns: Script loading separated from widget rendering
 * - Dependency injection: Logger and script options injected via context
 * - Contract-based design: Implements ChallengeSolver interface
 * - Factory pattern: Returns solver instance, not component
 */
function createTurnstileSolver(ctx: CreateTurnstileSolverContext): ChallengeSolver {
  async function solve(challengeData: ChallengeData): Promise<string> {
    const startTime = ctx.performanceTracker.now()

    ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Solving Turnstile challenge', { challengeData })

    // Extract challenge data — prefer typed challengeData over legacy extra field
    let siteKey: string
    let action: string | undefined

    if (challengeData.challengeData?.case === 'turnstile') {
      siteKey = challengeData.challengeData.value.siteKey
      action = challengeData.challengeData.value.action
    } else {
      // Fallback to legacy extra field
      const challengeDataStr = challengeData.extra?.['challengeData']
      if (!challengeDataStr) {
        const error = new Error('Missing challengeData in challenge extra')
        ctx.onSolveCompleted?.({
          durationMs: ctx.performanceTracker.now() - startTime,
          success: false,
          errorType: 'validation',
          errorMessage: error.message,
        })
        throw error
      }

      let parsedData: { siteKey: string; action: string }
      try {
        parsedData = JSON.parse(challengeDataStr)
      } catch (error) {
        const parseError = new Error('Failed to parse challengeData', { cause: error })
        ctx.onSolveCompleted?.({
          durationMs: ctx.performanceTracker.now() - startTime,
          success: false,
          errorType: 'validation',
          errorMessage: parseError.message,
        })
        throw parseError
      }

      siteKey = parsedData.siteKey
      action = parsedData.action
    }

    if (!siteKey) {
      const error = new Error('Missing siteKey in challengeData')
      ctx.onSolveCompleted?.({
        durationMs: ctx.performanceTracker.now() - startTime,
        success: false,
        errorType: 'validation',
        errorMessage: error.message,
      })
      throw error
    }

    ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Parsed challengeData', { siteKey, action })

    await ensureTurnstileScript(ctx.scriptOptions)

    ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Turnstile script loaded')

    // Verify Turnstile API is available
    if (!window.turnstile) {
      const error = new TurnstileApiNotAvailableError()
      ctx.onSolveCompleted?.({
        durationMs: ctx.performanceTracker.now() - startTime,
        success: false,
        errorType: 'script_load',
        errorMessage: error.message,
      })
      throw error
    }

    // Create temporary container for the widget
    const containerId = `turnstile-${challengeData.challengeId}`
    const container = document.createElement('div')
    container.id = containerId
    container.style.position = 'fixed'
    container.style.top = '-9999px' // Hide off-screen
    container.style.left = '-9999px'
    container.setAttribute('aria-hidden', 'true') // Accessibility
    document.body.appendChild(container)

    const timeoutMs = ctx.timeoutMs ?? 30000
    const cleanupState = {
      timeoutId: null as ReturnType<typeof setTimeout> | null,
      widgetId: null as string | null,
    }

    try {
      // Wait for Turnstile to be ready and render widget
      const token = await new Promise<string>((resolve, reject) => {
        // Set up timeout with proper cleanup
        cleanupState.timeoutId = setTimeout(() => {
          if (cleanupState.widgetId && window.turnstile) {
            try {
              window.turnstile.remove(cleanupState.widgetId)
            } catch {
              // Ignore cleanup errors
            }
          }
          reject(new TurnstileTimeoutError(timeoutMs))
        }, timeoutMs)

        // Helper function to render the widget
        const renderWidget = (): void => {
          if (!window.turnstile) {
            reject(new TurnstileApiNotAvailableError())
            return
          }

          try {
            cleanupState.widgetId = window.turnstile.render(container, {
              sitekey: siteKey,
              action,
              theme: 'light',
              size: 'normal',
              callback: (tokenValue: string) => {
                if (cleanupState.timeoutId) {
                  clearTimeout(cleanupState.timeoutId)
                  cleanupState.timeoutId = null
                }
                ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Turnstile token resolved', {
                  tokenValue,
                })
                resolve(tokenValue)
              },
              'error-callback': (error: string) => {
                if (cleanupState.timeoutId) {
                  clearTimeout(cleanupState.timeoutId)
                  cleanupState.timeoutId = null
                }
                ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Turnstile error', { error })
                reject(new TurnstileError(error))
              },
              'expired-callback': () => {
                if (cleanupState.timeoutId) {
                  clearTimeout(cleanupState.timeoutId)
                  cleanupState.timeoutId = null
                }
                ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Turnstile token expired')
                reject(new TurnstileTokenExpiredError())
              },
            })

            ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'Turnstile widget rendered', {
              widgetId: cleanupState.widgetId,
            })
          } catch (error) {
            if (cleanupState.timeoutId) {
              clearTimeout(cleanupState.timeoutId)
              cleanupState.timeoutId = null
            }
            ctx.getLogger?.().error(error, {
              tags: {
                file: 'createTurnstileSolver.ts',
                function: 'solve',
              },
            })
            reject(
              new TurnstileError(`Failed to render widget: ${error instanceof Error ? error.message : String(error)}`),
            )
          }
        }

        if (!window.turnstile) {
          reject(new TurnstileApiNotAvailableError())
          return
        }

        try {
          window.turnstile.ready(() => {
            renderWidget()
          })
        } catch (error) {
          // Fallback: render directly if ready() throws
          ctx.getLogger?.().debug('createTurnstileSolver', 'solve', 'turnstile.ready() failed, rendering directly', {
            error: error instanceof Error ? error.message : String(error),
          })
          renderWidget()
        }
      })

      // Report success
      ctx.onSolveCompleted?.({
        durationMs: ctx.performanceTracker.now() - startTime,
        success: true,
      })

      return token
    } catch (error) {
      // Report failure
      ctx.onSolveCompleted?.({
        durationMs: ctx.performanceTracker.now() - startTime,
        success: false,
        errorType: classifyError(error),
        errorMessage: error instanceof Error ? error.message : String(error),
      })

      ctx.getLogger?.().error(error, {
        tags: {
          file: 'createTurnstileSolver.ts',
          function: 'solve',
        },
      })
      throw error
    } finally {
      // Clean up timeout
      if (cleanupState.timeoutId) {
        clearTimeout(cleanupState.timeoutId)
      }

      // Clean up widget if it was created
      // widgetId only exists if turnstile was successfully loaded and rendered
      if (cleanupState.widgetId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (window.turnstile) {
            window.turnstile.remove(cleanupState.widgetId)
          }
        } catch {
          // Ignore cleanup errors
        }
      }

      // Clean up container
      if (container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }

  return { solve }
}

export { createTurnstileSolver }
export type { CreateTurnstileSolverContext, TurnstileSolveAnalytics }
