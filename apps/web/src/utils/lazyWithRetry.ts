/**
 * @fileoverview lazyWithRetry - Enhanced React.lazy with automatic retry for dynamic import failures
 *
 * This utility solves the common "Failed to fetch dynamically imported module" error that occurs
 * when users have an old version of the app loaded and a new deployment has changed chunk hashes.
 *
 * Quick Start:
 * ```tsx
 * import { createLazy } from 'utils/lazyWithRetry'
 *
 * // Replace React.lazy with createLazy
 * const MyComponent = createLazy(() => import('./MyComponent'))
 * ```
 */

import { ComponentType, LazyExoticComponent, lazy } from 'react'
import { logger } from 'utilities/src/logger/logger'

interface RetryOptions {
  maxRetries?: number
  baseDelay?: number
  maxDelay?: number
  refreshOnFinalFailure?: boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  refreshOnFinalFailure: true,
}

const REFRESH_COOLDOWN_KEY = 'lazy-retry-refresh'
const REFRESH_COOLDOWN_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Checks if an error is related to dynamic import failures
 */
function isDynamicImportError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase()
  const errorName = error.name.toLowerCase()

  const dynamicImportErrorPatterns = [
    'failed to fetch dynamically imported module',
    'loading chunk failed',
    'loading css chunk failed',
    'failed to fetch',
    'networkerror when attempting to fetch resource',
    'chunk load failed',
    'loading chunk',
    'import() failed',
    'typeerror: failed to fetch',
    'networkerror',
  ]

  return dynamicImportErrorPatterns.some((pattern) => errorMessage.includes(pattern) || errorName.includes(pattern))
}

/**
 * Calculates delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: { baseDelay: number; maxDelay: number }): number {
  // Ensure baseDelay and maxDelay are non-negative
  const safeBaseDelay = Math.max(0, options.baseDelay)
  const safeMaxDelay = Math.max(0, options.maxDelay)

  const exponentialDelay = safeBaseDelay * Math.pow(2, attempt - 1)
  const jitter = Math.random() * 0.1 * exponentialDelay // Add 10% jitter
  return Math.min(exponentialDelay + jitter, safeMaxDelay)
}

/**
 * Attempts to refresh the page with cooldown protection
 */
function attemptPageRefresh(): void {
  try {
    const lastRefresh = localStorage.getItem(REFRESH_COOLDOWN_KEY)
    const now = Date.now()

    if (lastRefresh && now - parseInt(lastRefresh, 10) < REFRESH_COOLDOWN_DURATION) {
      // biome-ignore lint/suspicious/noConsole: Need console for debugging retry cooldown logic
      console.warn('Page refresh skipped due to recent refresh (cooldown active)')
      return
    }

    localStorage.setItem(REFRESH_COOLDOWN_KEY, now.toString())
    // biome-ignore lint/suspicious/noConsole: Need console for debugging import failure refresh
    console.log('Dynamic import failed after all retries, refreshing page...')
    window.location.reload()
  } catch (error) {
    // If localStorage fails, still try to refresh but log the issue
    // biome-ignore lint/suspicious/noConsole: Need console for debugging refresh fallback logic
    console.warn('Failed to set refresh cooldown, refreshing anyway:', error)
    window.location.reload()
  }
}

/**
 * Creates a factory function with retry logic for dynamic imports
 */
function createRetryableImport<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: Required<RetryOptions>,
): () => Promise<{ default: T }> {
  return async (): Promise<{ default: T }> => {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= options.maxRetries + 1; attempt++) {
      try {
        const result = await importFn()
        return result
      } catch (error) {
        lastError = error as Error

        // Only retry for dynamic import related errors
        if (!isDynamicImportError(lastError)) {
          throw lastError
        }

        // If this was our last attempt, handle the final failure
        if (attempt > options.maxRetries) {
          // Log the error to Datadog before handling the final failure
          logger.error(lastError, {
            tags: {
              file: 'lazyWithRetry.ts',
              function: 'createRetryableImport',
            },
            extra: {
              maxRetries: options.maxRetries,
              totalAttempts: attempt,
              errorMessage: lastError.message,
              refreshOnFinalFailure: options.refreshOnFinalFailure,
            },
          })

          if (options.refreshOnFinalFailure) {
            attemptPageRefresh()
            // Throw error anyway in case refresh doesn't happen immediately
            throw new Error(`Failed to load module after ${options.maxRetries} retries: ${lastError.message}`)
          }
          throw lastError
        }

        // Calculate delay and wait before retrying
        const delay = calculateDelay(attempt, { baseDelay: options.baseDelay, maxDelay: options.maxDelay })

        // biome-ignore lint/suspicious/noConsole: Need console for debugging import retry attempts
        console.warn(
          `Dynamic import failed (attempt ${attempt}/${options.maxRetries}), retrying in ${Math.round(delay)}ms:`,
          lastError.message,
        )

        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Unknown error during dynamic import')
  }
}

/**
 * Enhanced React.lazy with automatic retry logic for dynamic import failures
 *
 * Automatically retries failed dynamic imports caused by deployment-related issues like:
 * - "Failed to fetch dynamically imported module"
 * - "Loading chunk failed"
 * - "Loading CSS chunk failed"
 *
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry limits
 * - Automatic page refresh on final failure (optional)
 * - Infinite loop protection via localStorage cooldown
 * - Only retries dynamic import errors, not code errors
 * - Logs final failures to Datadog for monitoring
 *
 * @param importFn - The dynamic import function
 * @param options - Retry configuration options
 * @returns LazyExoticComponent with retry capability
 *
 * @example
 * ```tsx
 * // === BASIC USAGE (recommended) ===
 * import { createLazy } from 'utils/lazyWithRetry'
 *
 * // Drop-in replacement for React.lazy with sensible defaults
 * const MyComponent = createLazy(() => import('./MyComponent'))
 *
 * // === ADVANCED USAGE ===
 * import { lazyWithRetry } from 'utils/lazyWithRetry'
 *
 * // Custom retry configuration
 * const CriticalComponent = lazyWithRetry(
 *   () => import('./CriticalComponent'),
 *   {
 *     maxRetries: 5,              // Try up to 5 times
 *     baseDelay: 2000,            // Start with 2 second delay
 *     maxDelay: 10000,            // Cap delay at 10 seconds
 *     refreshOnFinalFailure: true // Refresh page if all retries fail
 *   }
 * )
 *
 * // === MIGRATION FROM React.lazy ===
 * // Before:
 * // const TokenDetails = lazy(() => import('pages/TokenDetails'))
 *
 * // After:
 * // const TokenDetails = createLazy(() => import('pages/TokenDetails'))
 *
 * // === RETRY BEHAVIOR ===
 * // Attempt 1: immediate
 * // Attempt 2: ~1 second delay
 * // Attempt 3: ~2 second delay
 * // Attempt 4: ~4 second delay
 * // Final failure: refresh page (unless disabled) + log error to Datadog
 * ```
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: RetryOptions = {},
): LazyExoticComponent<T> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }
  const retryableImport = createRetryableImport(importFn, finalOptions)

  return lazy(retryableImport)
}

/**
 * Factory function for creating a lazyWithRetry with pre-configured options
 * Useful for consistent retry behavior across your application
 *
 * @example
 * ```tsx
 * const createLazy = createLazyFactory({ maxRetries: 5, baseDelay: 2000 })
 * const MyComponent = createLazy(() => import('./MyComponent'))
 * ```
 */
export function createLazyFactory(defaultOptions: RetryOptions) {
  return function <T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    options: RetryOptions = {},
  ): LazyExoticComponent<T> {
    return lazyWithRetry(importFn, { ...defaultOptions, ...options })
  }
}

// Export a default instance with sensible defaults
export const createLazy = createLazyFactory({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  refreshOnFinalFailure: true,
})

// Export for testing purposes
export { isDynamicImportError }
