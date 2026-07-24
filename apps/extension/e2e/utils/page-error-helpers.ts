import type { Page } from '@playwright/test'

// Benign errors that are expected in a test environment and shouldn't fail a run.
const BENIGN_ERROR_PATTERNS = [
  'ResizeObserver', // Common benign browser noise
  'Non-Error promise rejection',
  'Failed to load resource', // External resources (analytics, images) may be blocked
]

/**
 * Starts collecting uncaught page errors on `page`. Returns a function that yields the
 * critical (non-benign) errors collected so far — call it at the end of the test and
 * assert it's empty.
 */
export function collectCriticalPageErrors(page: Page): () => string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  return () => errors.filter((message) => !BENIGN_ERROR_PATTERNS.some((pattern) => message.includes(pattern)))
}
