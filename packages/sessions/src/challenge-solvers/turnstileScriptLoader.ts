import { TurnstileScriptLoadError } from '@universe/sessions/src/challenge-solvers/turnstileErrors'
import type { TurnstileScriptOptions } from '@universe/sessions/src/challenge-solvers/types'

type TurnstileState = 'unloaded' | 'loading' | 'ready'

interface TurnstileLoadPromise {
  resolve: (value?: void | PromiseLike<void>) => void
  reject: (reason?: unknown) => void
}

/**
 * Global state machine for Turnstile script loading
 * Singleton pattern ensures shared state across solver instances
 */
class TurnstileScriptState {
  private state: TurnstileState = 'unloaded'
  private loadPromise: Promise<void>
  private loadResolvers: TurnstileLoadPromise | null = null

  constructor() {
    this.loadPromise = new Promise((resolve, reject) => {
      this.loadResolvers = { resolve, reject }
      // If already ready, resolve immediately
      if (this.state === 'ready' && window.turnstile) {
        resolve(undefined)
      }
    })
  }

  getState(): TurnstileState {
    return this.state
  }

  setState(newState: TurnstileState): void {
    this.state = newState
  }

  getLoadPromise(): Promise<void> {
    return this.loadPromise
  }

  resolveLoad(): void {
    if (this.loadResolvers) {
      this.loadResolvers.resolve(undefined)
      this.loadResolvers = null
    }
  }

  rejectLoad(reason: unknown): void {
    if (this.loadResolvers) {
      this.loadResolvers.reject(reason)
      this.loadResolvers = null
    }
  }

  /**
   * Reset state for testing purposes
   */
  reset(): void {
    this.state = 'unloaded'
    this.loadPromise = new Promise((resolve, reject) => {
      this.loadResolvers = { resolve, reject }
    })
  }
}

// Singleton instance
const turnstileState = new TurnstileScriptState()

const DEFAULT_SCRIPT_ID = 'cf-turnstile-script'
const DEFAULT_ONLOAD_NAME = 'onloadTurnstileCallback'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

/**
 * Observes script loading using MutationObserver
 * More reliable than polling for detecting when script is loaded
 */
function observeScriptLoad(scriptId: string, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already exists and is loaded
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null
    if (existingScript && window.turnstile) {
      resolve(undefined)
      return
    }

    // If script exists but not loaded yet, set up load listener
    if (existingScript && !window.turnstile) {
      // Track intervals so we can clean them up from any code path
      let loadCheckIntervalId: ReturnType<typeof setInterval> | null = null
      let raceCheckIntervalId: ReturnType<typeof setInterval> | null = null

      const cleanup = (): void => {
        if (loadCheckIntervalId) {
          clearInterval(loadCheckIntervalId)
        }
        if (raceCheckIntervalId) {
          clearInterval(raceCheckIntervalId)
        }
        existingScript.removeEventListener('load', onScriptLoad)
        existingScript.removeEventListener('error', onScriptError)
      }

      const onScriptLoad = (): void => {
        // Wait a bit for turnstile to initialize
        loadCheckIntervalId = setInterval(() => {
          if (window.turnstile) {
            cleanup()
            resolve(undefined)
          }
        }, 50)

        // Timeout if turnstile doesn't initialize
        setTimeout(() => {
          cleanup()
          if (!window.turnstile) {
            reject(new TurnstileScriptLoadError('Turnstile did not initialize after script load'))
          } else {
            resolve(undefined)
          }
        }, timeoutMs)
      }

      const onScriptError = (): void => {
        cleanup()
        reject(new TurnstileScriptLoadError('Failed to load Turnstile script'))
      }

      // Script exists but not loaded yet, listen for load event
      // For scripts with defer/async, the load event will fire when ready
      existingScript.addEventListener('load', onScriptLoad)
      existingScript.addEventListener('error', onScriptError)

      // Also check periodically in case the script loaded before we attached listeners
      // (race condition with defer/async scripts)
      raceCheckIntervalId = setInterval(() => {
        if (window.turnstile) {
          cleanup()
          resolve(undefined)
        }
      }, 50)

      // Timeout fallback
      setTimeout(() => {
        cleanup()
        if (!window.turnstile) {
          reject(new TurnstileScriptLoadError('Turnstile script loaded but API not available'))
        } else {
          resolve(undefined)
        }
      }, timeoutMs)
      return
    }

    let resolved = false
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true
        reject(new TurnstileScriptLoadError(`Script observation timeout after ${timeoutMs}ms`))
      }
    }, timeoutMs)

    const observer = new MutationObserver(() => {
      const script = document.getElementById(scriptId) as HTMLScriptElement | null
      if (script && window.turnstile) {
        if (!resolved) {
          resolved = true
          clearTimeout(timeoutId)
          observer.disconnect()
          resolve(undefined)
        }
      }
    })

    // Start observing
    observer.observe(document.head, {
      childList: true,
      subtree: true,
    })

    // Also check immediately in case script was added synchronously
    const scriptCheck = document.getElementById(scriptId) as HTMLScriptElement | null
    if (scriptCheck && window.turnstile) {
      resolved = true
      clearTimeout(timeoutId)
      observer.disconnect()
      resolve(undefined)
      return
    }
  })
}

/**
 * Injects Turnstile script with CSP-compliant options
 */
function injectTurnstileScript(options: TurnstileScriptOptions = {}): void {
  const scriptId = options.id || DEFAULT_SCRIPT_ID
  const onLoadCallbackName = options.onLoadCallbackName || DEFAULT_ONLOAD_NAME

  // Check if script already exists
  if (document.getElementById(scriptId)) {
    return
  }

  // Set up global onload callback
  // Use unknown first to avoid type errors
  const windowWithCallback = window as unknown as Record<string, unknown>
  windowWithCallback[onLoadCallbackName] = (): void => {
    turnstileState.setState('ready')
    turnstileState.resolveLoad()
    // Clean up callback
    delete windowWithCallback[onLoadCallbackName]
  }

  // Create script element
  const script = document.createElement('script')
  script.id = scriptId
  script.src = TURNSTILE_SCRIPT_URL

  // Apply CSP-compliant options
  if (options.nonce) {
    script.nonce = options.nonce
  }
  if (options.defer !== undefined) {
    script.defer = options.defer
  }
  if (options.async !== undefined) {
    script.async = options.async
  }
  if (options.crossOrigin) {
    script.crossOrigin = options.crossOrigin
  }

  // Track interval so it can be cleaned up from timeout
  let checkIntervalId: ReturnType<typeof setInterval> | null = null

  // Set onload callback via script attribute for CSP compliance
  script.onload = (): void => {
    // Wait for turnstile to actually be available
    // The global callback will handle state transition
    checkIntervalId = setInterval(() => {
      if (window.turnstile) {
        if (checkIntervalId) {
          clearInterval(checkIntervalId)
        }
        // If global callback hasn't fired, resolve manually
        if (turnstileState.getState() !== 'ready') {
          turnstileState.setState('ready')
          turnstileState.resolveLoad()
        }
      }
    }, 50)

    // Fallback timeout
    setTimeout(() => {
      if (checkIntervalId) {
        clearInterval(checkIntervalId)
      }
      // Only reject if BOTH conditions are true: state isn't ready AND turnstile doesn't exist.
      // If turnstile exists but state isn't ready, the interval will handle it.
      // If state is ready, the global callback already resolved.
      if (turnstileState.getState() !== 'ready' && !window.turnstile) {
        turnstileState.rejectLoad(new TurnstileScriptLoadError('Turnstile did not initialize after script load'))
      }
    }, 5000)
  }

  script.onerror = (): void => {
    turnstileState.setState('unloaded')
    turnstileState.rejectLoad(new TurnstileScriptLoadError('Failed to load Turnstile script'))
  }

  // Inject script
  document.head.appendChild(script)
  turnstileState.setState('loading')
}

/**
 * Ensures Turnstile script is loaded, using state machine for coordination
 */
async function ensureTurnstileScript(scriptOptions: TurnstileScriptOptions = {}): Promise<void> {
  // If already ready, return immediately
  if (turnstileState.getState() === 'ready' && window.turnstile) {
    return Promise.resolve()
  }

  // Check if script exists in DOM (including preloaded scripts)
  const scriptId = scriptOptions.id || DEFAULT_SCRIPT_ID
  const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null

  if (existingScript) {
    // Script exists in DOM - check if it's already loaded
    if (window.turnstile) {
      turnstileState.setState('ready')
      turnstileState.resolveLoad()
      return Promise.resolve()
    }

    // Script exists but not loaded yet - observe for loading
    // This handles preloaded scripts with defer/async
    turnstileState.setState('loading')
    return observeScriptLoad(scriptId).then(() => {
      turnstileState.setState('ready')
      turnstileState.resolveLoad()
    })
  }

  // If already loading (from a previous call), wait for existing promise
  if (turnstileState.getState() === 'loading') {
    return turnstileState.getLoadPromise()
  }

  // Script doesn't exist - inject it
  injectTurnstileScript(scriptOptions)
  return turnstileState.getLoadPromise()
}

/**
 * Reset turnstile state for testing purposes
 */
function resetTurnstileState(): void {
  turnstileState.reset()
}

export { ensureTurnstileScript, observeScriptLoad, turnstileState, resetTurnstileState }
